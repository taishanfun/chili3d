// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import {
    BoundingBox,
    ComponentNode,
    DimensionNode,
    GroupNode,
    IShape,
    ISubShape,
    IVisualObject,
    LeaderNode,
    Matrix4,
    MeshNode,
    MTextNode,
    ShapeMeshRange,
    ShapeType,
    TextNode,
    VisualConfig,
    VisualNode,
} from "chili-core";
import {
    BufferAttribute,
    BufferGeometry,
    DoubleSide,
    Group,
    Material,
    Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial,
    Object3D,
    PlaneGeometry,
} from "three";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { defaultEdgeMaterial, hilightEdgeMaterial } from "./common";
import { Constants } from "./constants";
import { IHighlightable } from "./highlightable";
import { ThreeGeometryFactory } from "./threeGeometryFactory";
import { ThreeHelper } from "./threeHelper";
import { ThreeVisualContext } from "./threeVisualContext";

const HighlightFaceMaterial = new MeshLambertMaterial({
    color: ThreeHelper.fromColor(VisualConfig.highlightFaceColor),
    side: DoubleSide,
    transparent: true,
    opacity: 0.56,
});

export abstract class ThreeVisualObject extends Object3D implements IVisualObject {
    get transform() {
        return ThreeHelper.toMatrix(this.matrix);
    }
    set transform(value: Matrix4) {
        this.matrix.fromArray(value.toArray());
    }

    private _node: VisualNode;
    get node(): VisualNode {
        return this._node;
    }

    worldTransform(): Matrix4 {
        return ThreeHelper.toMatrix(this.matrixWorld);
    }

    constructor(node: VisualNode) {
        super();
        this._node = node;
        this.matrixAutoUpdate = false;
        this.visible = node.visible && node.parentVisible;
        this.transform = node.transform;
        node.onPropertyChanged(this.handlePropertyChanged);
    }

    private readonly handlePropertyChanged = (property: keyof VisualNode) => {
        if (property === "transform") {
            this.transform = this.node.transform;
        }
    };

    boundingBox(): BoundingBox | undefined {
        return ThreeHelper.getBoundingBox(this);
    }

    dispose() {
        this.node.removePropertyChanged(this.handlePropertyChanged);
        this._node = null as any;
    }

    abstract getSubShapeAndIndex(
        shapeType: "face" | "edge",
        subVisualIndex: number,
    ): {
        shape: IShape | undefined;
        subShape: ISubShape | undefined;
        index: number;
        transform?: Matrix4;
        groups: ShapeMeshRange[];
    };

    abstract subShapeVisual(shapeType: ShapeType): (Mesh | LineSegments2)[];

    abstract wholeVisual(): (Mesh | LineSegments2)[];
}

export class ThreeMeshObject extends ThreeVisualObject implements IHighlightable {
    private _mesh: LineSegments2 | Mesh | Line2;
    private material: Material | Material[];

    get mesh() {
        return this._mesh;
    }

    constructor(
        readonly context: ThreeVisualContext,
        readonly meshNode: MeshNode,
    ) {
        super(meshNode);
        this._mesh = this.createMesh();
        this.material = this._mesh.material;
        this.add(this._mesh);
        meshNode.onPropertyChanged(this.handleGeometryPropertyChanged);
    }

    highlight() {
        if (this._mesh instanceof Mesh) {
            this._mesh.material = HighlightFaceMaterial;
        }

        if (this._mesh instanceof LineSegments2) {
            this._mesh.material = hilightEdgeMaterial;
        }
    }

    unhighlight() {
        if (this._mesh instanceof Mesh) {
            this._mesh.material = this.material;
        }

        if (this._mesh instanceof LineSegments2) {
            this._mesh.material = this.material as LineMaterial;
        }
    }

    getSubShapeAndIndex(
        shapeType: "face" | "edge",
        subVisualIndex: number,
    ): {
        shape: IShape | undefined;
        subShape: ISubShape | undefined;
        index: number;
        groups: ShapeMeshRange[];
    } {
        return {
            shape: undefined,
            subShape: undefined,
            index: -1,
            groups: [],
        };
    }

    override subShapeVisual(shapeType: ShapeType): (Mesh | LineSegments2)[] {
        return [];
    }

    private createMesh() {
        switch (this.meshNode.mesh.meshType) {
            case "linesegments":
                return this.newLineSegments();
            case "surface":
                return this.newMesh();
            default:
                throw new Error("Unknown mesh type");
        }
    }

    private readonly handleGeometryPropertyChanged = (property: keyof MeshNode) => {
        if (property === "mesh") {
            this.disposeMesh();
            this._mesh = this.createMesh();
            this.add(this._mesh);
        } else if (property === "materialId" && this._mesh instanceof Mesh) {
            this.material = this.context.getMaterial(this.meshNode.materialId);
            this._mesh.material = this.material;
        }
    };

    private newMesh() {
        const buff = new BufferGeometry();
        buff.setAttribute("position", new BufferAttribute(this.meshNode.mesh.position!, 3));
        if (this.meshNode.mesh.normal)
            buff.setAttribute("normal", new BufferAttribute(this.meshNode.mesh.normal, 3));
        if (this.meshNode.mesh.uv) buff.setAttribute("uv", new BufferAttribute(this.meshNode.mesh.uv, 2));
        if (this.meshNode.mesh.index) buff.setIndex(new BufferAttribute(this.meshNode.mesh.index, 1));
        if (this.meshNode.mesh.groups.length > 1) buff.groups = this.meshNode.mesh.groups;
        buff.computeBoundingBox();
        const mesh = new Mesh(buff, this.context.getMaterial(this.meshNode.materialId));
        mesh.layers.set(Constants.Layers.Solid);
        return mesh;
    }

    private newLineSegments() {
        const material = new LineMaterial({
            linewidth: 1,
            color: this.meshNode.mesh.color as number,
            side: DoubleSide,
        });
        const buff = new LineSegmentsGeometry();
        buff.setPositions(this.meshNode.mesh.position!);
        buff.computeBoundingBox();
        const line = new LineSegments2(buff, material);
        line.layers.set(Constants.Layers.Wireframe);
        return line;
    }

    private newLine() {
        const material = new LineMaterial({
            linewidth: 1,
            color: this.meshNode.mesh.color as number,
            side: DoubleSide,
        });
        const geometry = new LineGeometry();
        geometry.setPositions(this.meshNode.mesh.position!);
        geometry.computeBoundingBox();
        const line = new Line2(geometry, material);
        line.layers.set(Constants.Layers.Wireframe);
        return line;
    }

    override wholeVisual() {
        return [this.mesh];
    }

    private disposeMesh() {
        if (this._mesh instanceof LineSegments2 || this._mesh instanceof Line2) {
            this._mesh.material.dispose();
        }
        this._mesh.geometry?.dispose();
    }

    override dispose(): void {
        super.dispose();
        this.meshNode.removePropertyChanged(this.handleGeometryPropertyChanged);
        this.disposeMesh();
    }
}

export class GroupVisualObject extends Group implements IVisualObject {
    get transform() {
        return ThreeHelper.toMatrix(this.matrix);
    }
    set transform(value: Matrix4) {
        this.matrix.fromArray(value.toArray());
    }

    worldTransform(): Matrix4 {
        return ThreeHelper.toMatrix(this.matrixWorld);
    }

    constructor(private readonly groupNode: GroupNode) {
        super();
        this.matrixAutoUpdate = false;
        this.transform = groupNode.transform;
        groupNode.onPropertyChanged(this.handlePropertyChanged);
    }

    private readonly handlePropertyChanged = (property: keyof GroupNode) => {
        if (property === "transform") {
            this.transform = this.groupNode.transform;
        }
    };

    boundingBox(): BoundingBox | undefined {
        return ThreeHelper.getBoundingBox(this);
    }

    dispose() {
        this.groupNode.removePropertyChanged(this.handlePropertyChanged);
    }
}

export class ThreeComponentObject extends ThreeVisualObject implements IHighlightable {
    private _boundbox?: LineSegments2;
    private _edges?: LineSegments2;
    private _faces?: Mesh;
    private _linesegments?: LineSegments2;
    private _surfaces?: Mesh;

    get edges() {
        return this._edges;
    }

    get faces() {
        return this._faces;
    }

    get linesegments() {
        return this._linesegments;
    }

    get surfaces() {
        return this._surfaces;
    }

    constructor(
        readonly componentNode: ComponentNode,
        readonly context: ThreeVisualContext,
    ) {
        super(componentNode);
        this.initEdges();
        this.initFaces();
        this.initLinesegments();
        this.initSurfaces();
    }

    private initEdges() {
        const data = this.componentNode.component.mesh.edge;
        if (!data || data.position.length === 0) {
            return;
        }

        const buff = ThreeGeometryFactory.createEdgeBufferGeometry(data);
        this._edges = new LineSegments2(buff, defaultEdgeMaterial);
        this._edges.layers.set(Constants.Layers.Wireframe);
        this.add(this._edges);
    }

    private initFaces() {
        const data = this.componentNode.component.mesh.face;
        if (!data || data.position.length === 0) {
            return;
        }

        const buff = ThreeGeometryFactory.createFaceBufferGeometry(data);
        if (data.groups.length > 1) buff.groups = data.groups;
        const materials = this.context.getMaterial(this.componentNode.component.mesh.faceMaterials);
        this._faces = new Mesh(buff, materials);
        this._faces.layers.set(Constants.Layers.Solid);
        this.add(this._faces);
    }

    initSurfaces() {
        const data = this.componentNode.component.mesh.surface;
        if (!data || data.position?.length === 0) {
            return;
        }

        const buff = ThreeGeometryFactory.createFaceBufferGeometry(data as any);
        if (data.groups.length > 1) buff.groups = data.groups;
        const materials = this.context.getMaterial(this.componentNode.component.mesh.surfaceMaterials);
        this._surfaces = new Mesh(buff, materials);
        this._surfaces.layers.set(Constants.Layers.Solid);
        this.add(this._surfaces);
    }

    initLinesegments() {
        const data = this.componentNode.component.mesh.linesegments;
        if (!data || data.position?.length === 0) {
            return;
        }

        let buff = new LineSegmentsGeometry();
        buff.setPositions(data.position!);
        buff.computeBoundingBox();
        this._linesegments = new LineSegments2(buff, defaultEdgeMaterial);
        this._linesegments.layers.set(Constants.Layers.Wireframe);
        this.add(this._linesegments);
    }

    override boundingBox(): BoundingBox | undefined {
        return this.componentNode.component.boundingBox;
    }

    highlight(): void {
        if (!this._boundbox) {
            const box = this.componentNode.component.boundingBox;
            if (!box) {
                return;
            }

            const geometry = new LineSegmentsGeometry();
            geometry.setPositions(BoundingBox.wireframe(box).position);
            this._boundbox = new LineSegments2(geometry, hilightEdgeMaterial);
            this.add(this._boundbox);
        }

        this._boundbox.visible = true;
    }

    unhighlight(): void {
        if (this._boundbox) {
            this._boundbox.visible = false;
        }
    }

    override getSubShapeAndIndex(shapeType: "face" | "edge", subVisualIndex: number) {
        const range =
            shapeType === "face"
                ? this.componentNode.component.mesh.face.range
                : this.componentNode.component.mesh.edge.range;
        const index = ThreeHelper.findGroupIndex(range, subVisualIndex);
        if (index !== undefined) {
            return {
                shape: range[index].shape,
                subShape: range[index].shape,
                transform: range[index].transform,
                index,
                groups: range,
            };
        }

        return {
            shape: undefined,
            subShape: undefined,
            transform: undefined,
            index: -1,
            groups: [],
        };
    }

    override subShapeVisual(shapeType: ShapeType): (Mesh | LineSegments2)[] {
        const shapes: (Mesh | LineSegments2 | undefined)[] = [];

        const isWhole =
            shapeType === ShapeType.Shape ||
            ShapeType.hasCompound(shapeType) ||
            ShapeType.hasCompoundSolid(shapeType) ||
            ShapeType.hasSolid(shapeType);

        if (isWhole || ShapeType.hasEdge(shapeType) || ShapeType.hasWire(shapeType)) {
            shapes.push(this.edges);
        }

        if (isWhole || ShapeType.hasFace(shapeType) || ShapeType.hasShell(shapeType)) {
            shapes.push(this.faces);
        }

        return shapes.filter((x) => x !== undefined);
    }

    override wholeVisual(): (Mesh | LineSegments2)[] {
        return [this.edges, this.faces, this.linesegments, this.surfaces].filter((x) => x !== undefined);
    }
}

export class ThreeTextObject extends ThreeVisualObject implements IHighlightable {
    private readonly _label: CSS2DObject;
    private readonly _labelElement: HTMLDivElement;
    private readonly _contentElement: HTMLDivElement;
    private readonly _hitMesh: Mesh;
    private readonly _hitMaterial: MeshBasicMaterial;
    private readonly _isMText: boolean;

    constructor(
        readonly context: ThreeVisualContext,
        readonly textNode: TextNode | MTextNode,
    ) {
        super(textNode);
        this._isMText = textNode instanceof MTextNode;
        this._labelElement = document.createElement("div");
        this._labelElement.style.pointerEvents = "none";
        this._labelElement.style.whiteSpace = textNode instanceof MTextNode ? "pre" : "nowrap";
        this._contentElement = document.createElement("div");
        this._contentElement.style.transform = "scale(var(--c3d-px-per-world-unit, 1))";
        this._contentElement.style.transformOrigin = "50% 50%";
        this._contentElement.style.color = "inherit";
        this._labelElement.appendChild(this._contentElement);
        this._label = new CSS2DObject(this._labelElement);
        this.add(this._label);

        this._hitMaterial = new MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
        });
        this._hitMesh = new Mesh(new PlaneGeometry(1, 1), this._hitMaterial);
        this._hitMesh.layers.enable(Constants.Layers.Wireframe);
        this._hitMesh.layers.enable(Constants.Layers.Solid);
        this.add(this._hitMesh);

        if (this._isMText) {
            (textNode as MTextNode).onPropertyChanged(this.handleMTextPropertyChanged);
        } else {
            (textNode as TextNode).onPropertyChanged(this.handleTextPropertyChanged);
        }
        this.syncFromNode();
    }

    private readonly handleTextPropertyChanged = (property: keyof TextNode) => {
        if (
            property === "text" ||
            property === "height" ||
            property === "horizontalAlign" ||
            property === "verticalAlign"
        ) {
            this.syncFromNode();
        }
    };

    private readonly handleMTextPropertyChanged = (property: keyof MTextNode) => {
        if (
            property === "text" ||
            property === "height" ||
            property === "horizontalAlign" ||
            property === "verticalAlign" ||
            property === "lineSpacing" ||
            property === "lineColors"
        ) {
            this.syncFromNode();
        }
    };

    private syncFromNode() {
        const { width, height } = this.textNode.estimateSize();
        const safeWidth = Math.max(1e-6, width);
        const safeHeight = Math.max(1e-6, height);

        const alignX = this.textNode.alignXNormalized();
        const alignYBox = this.textNode.alignYNormalized();
        const centerX = 0.5 - alignX;
        const centerY = 0.5 - alignYBox;
        this._hitMesh.position.set(centerX * safeWidth, centerY * safeHeight, -0.001);
        this._hitMesh.geometry.dispose();
        this._hitMesh.geometry = new PlaneGeometry(safeWidth, safeHeight);

        const cssCenterY = 1 - alignYBox;
        this._label.center.set(alignX, cssCenterY);
        this._label.position.set(0, 0, 0);
        this._contentElement.style.transformOrigin = `${alignX * 100}% ${cssCenterY * 100}%`;

        const nodeColor = (this.textNode as any).color;
        this._labelElement.style.color =
            nodeColor === undefined || nodeColor === null ? "inherit" : this.toCssColor(nodeColor);

        if (this.textNode instanceof MTextNode) {
            this.syncMTextLines(this.textNode);
        } else {
            this._contentElement.replaceChildren();
            this._contentElement.textContent = this.textNode.text;
        }
        const baseFontPx = Math.max(1e-6, Math.min(1e6, this.textNode.height));
        this._contentElement.style.fontSize = `${baseFontPx}px`;
    }

    private syncMTextLines(mtext: MTextNode) {
        const lines = mtext.lines();
        const colors = mtext.lineColors ?? [];
        this._contentElement.replaceChildren();
        for (let i = 0; i < lines.length; i++) {
            const lineElement = document.createElement("div");
            const { text, color } = this.parseInlineColoredLine(lines[i]);
            const configured = colors[i];
            const lineColor = configured === "" || configured === undefined ? color : configured;
            lineElement.textContent = text;
            lineElement.style.color =
                lineColor === undefined || lineColor === "" ? "inherit" : this.toCssColor(lineColor);
            this._contentElement.appendChild(lineElement);
        }
    }

    private parseInlineColoredLine(line: string): { text: string; color?: string } {
        const match = /^\s*\[(#[0-9A-Fa-f]{6}|[0-9A-Fa-f]{6})\]\s*/.exec(line);
        if (!match) return { text: line };
        const raw = match[1];
        const normalized = raw.startsWith("#") ? raw : `#${raw}`;
        return { text: line.slice(match[0].length), color: normalized };
    }

    private toCssColor(value: number | string): string {
        if (typeof value === "number" && Number.isFinite(value)) {
            return `#${value.toString(16).padStart(6, "0")}`;
        }
        if (typeof value === "string") {
            const v = value.trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v;
            if (/^[0-9A-Fa-f]{6}$/.test(v)) return `#${v}`;
            return v.length ? v : "#808080";
        }
        return "#808080";
    }

    highlight(): void {
        this._hitMaterial.opacity = 0.15;
    }

    unhighlight(): void {
        this._hitMaterial.opacity = 0;
    }

    override dispose(): void {
        if (this._isMText) {
            (this.textNode as MTextNode).removePropertyChanged(this.handleMTextPropertyChanged);
        } else {
            (this.textNode as TextNode).removePropertyChanged(this.handleTextPropertyChanged);
        }
        this._hitMesh.geometry.dispose();
        this._hitMaterial.dispose();
        this._labelElement.remove();
        super.dispose();
    }

    override getSubShapeAndIndex(
        shapeType: "face" | "edge",
        subVisualIndex: number,
    ): {
        shape: IShape | undefined;
        subShape: ISubShape | undefined;
        index: number;
        transform?: Matrix4;
        groups: ShapeMeshRange[];
    } {
        void shapeType;
        void subVisualIndex;
        return { shape: undefined, subShape: undefined, index: -1, groups: [] };
    }

    override subShapeVisual(shapeType: ShapeType): (Mesh | LineSegments2)[] {
        void shapeType;
        return [];
    }

    override wholeVisual(): (Mesh | LineSegments2)[] {
        return [this._hitMesh];
    }
}

export class ThreeDimensionObject extends ThreeVisualObject implements IHighlightable {
    private readonly _lines: LineSegments2;
    private readonly _label: CSS2DObject;
    private readonly _labelElement: HTMLDivElement;
    private _material: LineMaterial;

    constructor(
        readonly context: ThreeVisualContext,
        readonly dimensionNode: DimensionNode,
    ) {
        super(dimensionNode);
        this._material = defaultEdgeMaterial;
        this._lines = new LineSegments2(new LineSegmentsGeometry(), this._material);
        this._lines.layers.set(Constants.Layers.Wireframe);
        this.add(this._lines);

        this._labelElement = document.createElement("div");
        this._labelElement.style.pointerEvents = "none";
        this._label = new CSS2DObject(this._labelElement);
        this._label.center.set(0.5, 0.5);
        this.add(this._label);

        dimensionNode.onPropertyChanged(this.handleDimensionPropertyChanged);
        this.syncFromNode();
    }

    private readonly handleDimensionPropertyChanged = (property: keyof DimensionNode) => {
        if (
            property === "type" ||
            property === "p1" ||
            property === "p2" ||
            property === "location" ||
            property === "planeOrigin" ||
            property === "planeX" ||
            property === "planeY" ||
            property === "planeNormal" ||
            property === "precision"
        ) {
            this.syncFromNode();
        }
    };

    private syncFromNode() {
        const r = this.dimensionNode.compute();
        const positions = [
            r.p1.x,
            r.p1.y,
            r.p1.z,
            r.dimStart.x,
            r.dimStart.y,
            r.dimStart.z,
            r.p2.x,
            r.p2.y,
            r.p2.z,
            r.dimEnd.x,
            r.dimEnd.y,
            r.dimEnd.z,
            r.dimStart.x,
            r.dimStart.y,
            r.dimStart.z,
            r.dimEnd.x,
            r.dimEnd.y,
            r.dimEnd.z,
        ];
        const geometry = this._lines.geometry as LineSegmentsGeometry;
        geometry.setPositions(positions);
        geometry.computeBoundingBox();

        this._label.position.set(r.text.x, r.text.y, r.text.z);
        this._labelElement.textContent = this.dimensionNode.formatValue(r.value);
        this._labelElement.style.fontSize = "12px";
        this._labelElement.style.color = "inherit";
    }

    highlight(): void {
        this._material = hilightEdgeMaterial;
        this._lines.material = this._material;
    }

    unhighlight(): void {
        this._material = defaultEdgeMaterial;
        this._lines.material = this._material;
    }

    override dispose(): void {
        this.dimensionNode.removePropertyChanged(this.handleDimensionPropertyChanged);
        this._lines.geometry.dispose();
        this._labelElement.remove();
        super.dispose();
    }

    override getSubShapeAndIndex(
        shapeType: "face" | "edge",
        subVisualIndex: number,
    ): {
        shape: IShape | undefined;
        subShape: ISubShape | undefined;
        index: number;
        transform?: Matrix4;
        groups: ShapeMeshRange[];
    } {
        void shapeType;
        void subVisualIndex;
        return { shape: undefined, subShape: undefined, index: -1, groups: [] };
    }

    override subShapeVisual(shapeType: ShapeType): (Mesh | LineSegments2)[] {
        void shapeType;
        return [];
    }

    override wholeVisual(): (Mesh | LineSegments2)[] {
        return [this._lines];
    }
}

export class ThreeLeaderObject extends ThreeVisualObject implements IHighlightable {
    private readonly _lines: LineSegments2;
    private readonly _label: CSS2DObject;
    private readonly _labelElement: HTMLDivElement;
    private readonly _hitMesh: Mesh;
    private readonly _hitMaterial: MeshBasicMaterial;
    private _material: LineMaterial;

    constructor(
        readonly context: ThreeVisualContext,
        readonly leaderNode: LeaderNode,
    ) {
        super(leaderNode);
        this._material = defaultEdgeMaterial;
        this._lines = new LineSegments2(new LineSegmentsGeometry(), this._material);
        this._lines.layers.set(Constants.Layers.Wireframe);
        this.add(this._lines);

        this._labelElement = document.createElement("div");
        this._labelElement.style.pointerEvents = "none";
        this._label = new CSS2DObject(this._labelElement);
        this._label.center.set(0, 0.5);
        this.add(this._label);

        this._hitMaterial = new MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
        });
        this._hitMesh = new Mesh(new PlaneGeometry(1, 1), this._hitMaterial);
        this._hitMesh.layers.enable(Constants.Layers.Wireframe);
        this._hitMesh.layers.enable(Constants.Layers.Solid);
        this.add(this._hitMesh);

        leaderNode.onPropertyChanged(this.handleLeaderPropertyChanged);
        this.syncFromNode();
    }

    private readonly handleLeaderPropertyChanged = (property: keyof LeaderNode) => {
        if (property === "points" || property === "text" || property === "height") {
            this.syncFromNode();
        }
    };

    private syncFromNode() {
        const pts = this.leaderNode.points;
        const positions: number[] = [];
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i];
            const b = pts[i + 1];
            positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
        const geometry = this._lines.geometry as LineSegmentsGeometry;
        geometry.setPositions(positions.length === 0 ? [0, 0, 0, 0, 0, 0] : positions);
        geometry.computeBoundingBox();

        const last = pts.at(-1);
        if (last) {
            this._label.position.set(last.x, last.y, last.z);
        } else {
            this._label.position.set(0, 0, 0);
        }

        this._labelElement.textContent = this.leaderNode.text;
        const fontPx = Math.max(10, Math.min(200, this.leaderNode.height * 12));
        this._labelElement.style.fontSize = `${fontPx}px`;
        this._labelElement.style.color = "inherit";

        const width = Math.max(
            1e-6,
            TextNode.estimateLineWidth(this.leaderNode.text ?? "", this.leaderNode.height),
        );
        const height = Math.max(1e-6, this.leaderNode.height);
        this._hitMesh.position.set(
            this._label.position.x + width * 0.5,
            this._label.position.y,
            this._label.position.z,
        );
        this._hitMesh.geometry.dispose();
        this._hitMesh.geometry = new PlaneGeometry(width, height);
    }

    highlight(): void {
        this._material = hilightEdgeMaterial;
        this._lines.material = this._material;
    }

    unhighlight(): void {
        this._material = defaultEdgeMaterial;
        this._lines.material = this._material;
    }

    override dispose(): void {
        this.leaderNode.removePropertyChanged(this.handleLeaderPropertyChanged);
        this._lines.geometry.dispose();
        this._hitMesh.geometry.dispose();
        this._hitMaterial.dispose();
        this._labelElement.remove();
        super.dispose();
    }

    override getSubShapeAndIndex(
        shapeType: "face" | "edge",
        subVisualIndex: number,
    ): {
        shape: IShape | undefined;
        subShape: ISubShape | undefined;
        index: number;
        transform?: Matrix4;
        groups: ShapeMeshRange[];
    } {
        void shapeType;
        void subVisualIndex;
        return { shape: undefined, subShape: undefined, index: -1, groups: [] };
    }

    override subShapeVisual(shapeType: ShapeType): (Mesh | LineSegments2)[] {
        void shapeType;
        return [];
    }

    override wholeVisual(): (Mesh | LineSegments2)[] {
        return [this._lines, this._hitMesh];
    }
}
