// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { BoundingBox, MTextNode, ShapeType, TextNode, VisualConfig } from "chili-core";
import {
    BufferAttribute,
    BufferGeometry,
    DoubleSide,
    Group,
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
import { ThreeGeometryFactory } from "./threeGeometryFactory";
import { ThreeHelper } from "./threeHelper";
const HighlightFaceMaterial = new MeshLambertMaterial({
    color: ThreeHelper.fromColor(VisualConfig.highlightFaceColor),
    side: DoubleSide,
    transparent: true,
    opacity: 0.56,
});
export class ThreeVisualObject extends Object3D {
    get transform() {
        return ThreeHelper.toMatrix(this.matrix);
    }
    set transform(value) {
        this.matrix.fromArray(value.toArray());
    }
    _node;
    get node() {
        return this._node;
    }
    worldTransform() {
        return ThreeHelper.toMatrix(this.matrixWorld);
    }
    constructor(node) {
        super();
        this._node = node;
        this.matrixAutoUpdate = false;
        this.visible = node.visible && node.parentVisible;
        this.transform = node.transform;
        node.onPropertyChanged(this.handlePropertyChanged);
    }
    handlePropertyChanged = (property) => {
        if (property === "transform") {
            this.transform = this.node.transform;
        }
    };
    boundingBox() {
        return ThreeHelper.getBoundingBox(this);
    }
    dispose() {
        this.node.removePropertyChanged(this.handlePropertyChanged);
        this._node = null;
    }
}
export class ThreeMeshObject extends ThreeVisualObject {
    context;
    meshNode;
    _mesh;
    material;
    get mesh() {
        return this._mesh;
    }
    constructor(context, meshNode) {
        super(meshNode);
        this.context = context;
        this.meshNode = meshNode;
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
            this._mesh.material = this.material;
        }
    }
    getSubShapeAndIndex(shapeType, subVisualIndex) {
        return {
            shape: undefined,
            subShape: undefined,
            index: -1,
            groups: [],
        };
    }
    subShapeVisual(shapeType) {
        return [];
    }
    createMesh() {
        switch (this.meshNode.mesh.meshType) {
            case "linesegments":
                return this.newLineSegments();
            case "surface":
                return this.newMesh();
            default:
                throw new Error("Unknown mesh type");
        }
    }
    handleGeometryPropertyChanged = (property) => {
        if (property === "mesh") {
            this.disposeMesh();
            this._mesh = this.createMesh();
            this.add(this._mesh);
        } else if (property === "materialId" && this._mesh instanceof Mesh) {
            this.material = this.context.getMaterial(this.meshNode.materialId);
            this._mesh.material = this.material;
        }
    };
    newMesh() {
        const buff = new BufferGeometry();
        buff.setAttribute("position", new BufferAttribute(this.meshNode.mesh.position, 3));
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
    newLineSegments() {
        const material = new LineMaterial({
            linewidth: 1,
            color: this.meshNode.mesh.color,
            side: DoubleSide,
        });
        const buff = new LineSegmentsGeometry();
        buff.setPositions(this.meshNode.mesh.position);
        buff.computeBoundingBox();
        const line = new LineSegments2(buff, material);
        line.layers.set(Constants.Layers.Wireframe);
        return line;
    }
    newLine() {
        const material = new LineMaterial({
            linewidth: 1,
            color: this.meshNode.mesh.color,
            side: DoubleSide,
        });
        const geometry = new LineGeometry();
        geometry.setPositions(this.meshNode.mesh.position);
        geometry.computeBoundingBox();
        const line = new Line2(geometry, material);
        line.layers.set(Constants.Layers.Wireframe);
        return line;
    }
    wholeVisual() {
        return [this.mesh];
    }
    disposeMesh() {
        if (this._mesh instanceof LineSegments2 || this._mesh instanceof Line2) {
            this._mesh.material.dispose();
        }
        this._mesh.geometry?.dispose();
    }
    dispose() {
        super.dispose();
        this.meshNode.removePropertyChanged(this.handleGeometryPropertyChanged);
        this.disposeMesh();
    }
}
export class GroupVisualObject extends Group {
    groupNode;
    get transform() {
        return ThreeHelper.toMatrix(this.matrix);
    }
    set transform(value) {
        this.matrix.fromArray(value.toArray());
    }
    worldTransform() {
        return ThreeHelper.toMatrix(this.matrixWorld);
    }
    constructor(groupNode) {
        super();
        this.groupNode = groupNode;
        this.matrixAutoUpdate = false;
        this.transform = groupNode.transform;
        groupNode.onPropertyChanged(this.handlePropertyChanged);
    }
    handlePropertyChanged = (property) => {
        if (property === "transform") {
            this.transform = this.groupNode.transform;
        }
    };
    boundingBox() {
        return ThreeHelper.getBoundingBox(this);
    }
    dispose() {
        this.groupNode.removePropertyChanged(this.handlePropertyChanged);
    }
}
export class ThreeComponentObject extends ThreeVisualObject {
    componentNode;
    context;
    _boundbox;
    _edges;
    _faces;
    _linesegments;
    _surfaces;
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
    constructor(componentNode, context) {
        super(componentNode);
        this.componentNode = componentNode;
        this.context = context;
        this.initEdges();
        this.initFaces();
        this.initLinesegments();
        this.initSurfaces();
    }
    initEdges() {
        const data = this.componentNode.component.mesh.edge;
        if (!data || data.position.length === 0) {
            return;
        }
        const buff = ThreeGeometryFactory.createEdgeBufferGeometry(data);
        this._edges = new LineSegments2(buff, defaultEdgeMaterial);
        this._edges.layers.set(Constants.Layers.Wireframe);
        this.add(this._edges);
    }
    initFaces() {
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
        const buff = ThreeGeometryFactory.createFaceBufferGeometry(data);
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
        buff.setPositions(data.position);
        buff.computeBoundingBox();
        this._linesegments = new LineSegments2(buff, defaultEdgeMaterial);
        this._linesegments.layers.set(Constants.Layers.Wireframe);
        this.add(this._linesegments);
    }
    boundingBox() {
        return this.componentNode.component.boundingBox;
    }
    highlight() {
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
    unhighlight() {
        if (this._boundbox) {
            this._boundbox.visible = false;
        }
    }
    getSubShapeAndIndex(shapeType, subVisualIndex) {
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
    subShapeVisual(shapeType) {
        const shapes = [];
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
    wholeVisual() {
        return [this.edges, this.faces, this.linesegments, this.surfaces].filter((x) => x !== undefined);
    }
}
export class ThreeTextObject extends ThreeVisualObject {
    context;
    textNode;
    _label;
    _labelElement;
    _contentElement;
    _hitMesh;
    _hitMaterial;
    _isMText;
    constructor(context, textNode) {
        super(textNode);
        this.context = context;
        this.textNode = textNode;
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
            textNode.onPropertyChanged(this.handleMTextPropertyChanged);
        } else {
            textNode.onPropertyChanged(this.handleTextPropertyChanged);
        }
        this.syncFromNode();
    }
    handleTextPropertyChanged = (property) => {
        if (
            property === "text" ||
            property === "height" ||
            property === "horizontalAlign" ||
            property === "verticalAlign"
        ) {
            this.syncFromNode();
        }
    };
    handleMTextPropertyChanged = (property) => {
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
    syncFromNode() {
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
        const nodeColor = this.textNode.color;
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
    syncMTextLines(mtext) {
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
    parseInlineColoredLine(line) {
        const match = /^\s*\[(#[0-9A-Fa-f]{6}|[0-9A-Fa-f]{6})\]\s*/.exec(line);
        if (!match) return { text: line };
        const raw = match[1];
        const normalized = raw.startsWith("#") ? raw : `#${raw}`;
        return { text: line.slice(match[0].length), color: normalized };
    }
    toCssColor(value) {
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
    highlight() {
        this._hitMaterial.opacity = 0.15;
    }
    unhighlight() {
        this._hitMaterial.opacity = 0;
    }
    dispose() {
        if (this._isMText) {
            this.textNode.removePropertyChanged(this.handleMTextPropertyChanged);
        } else {
            this.textNode.removePropertyChanged(this.handleTextPropertyChanged);
        }
        this._hitMesh.geometry.dispose();
        this._hitMaterial.dispose();
        this._labelElement.remove();
        super.dispose();
    }
    getSubShapeAndIndex(shapeType, subVisualIndex) {
        void shapeType;
        void subVisualIndex;
        return { shape: undefined, subShape: undefined, index: -1, groups: [] };
    }
    subShapeVisual(shapeType) {
        void shapeType;
        return [];
    }
    wholeVisual() {
        return [this._hitMesh];
    }
}
export class ThreeDimensionObject extends ThreeVisualObject {
    context;
    dimensionNode;
    _lines;
    _label;
    _labelElement;
    _material;
    constructor(context, dimensionNode) {
        super(dimensionNode);
        this.context = context;
        this.dimensionNode = dimensionNode;
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
    handleDimensionPropertyChanged = (property) => {
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
    syncFromNode() {
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
        const geometry = this._lines.geometry;
        geometry.setPositions(positions);
        geometry.computeBoundingBox();
        this._label.position.set(r.text.x, r.text.y, r.text.z);
        this._labelElement.textContent = this.dimensionNode.formatValue(r.value);
        this._labelElement.style.fontSize = "12px";
        this._labelElement.style.color = "inherit";
    }
    highlight() {
        this._material = hilightEdgeMaterial;
        this._lines.material = this._material;
    }
    unhighlight() {
        this._material = defaultEdgeMaterial;
        this._lines.material = this._material;
    }
    dispose() {
        this.dimensionNode.removePropertyChanged(this.handleDimensionPropertyChanged);
        this._lines.geometry.dispose();
        this._labelElement.remove();
        super.dispose();
    }
    getSubShapeAndIndex(shapeType, subVisualIndex) {
        void shapeType;
        void subVisualIndex;
        return { shape: undefined, subShape: undefined, index: -1, groups: [] };
    }
    subShapeVisual(shapeType) {
        void shapeType;
        return [];
    }
    wholeVisual() {
        return [this._lines];
    }
}
export class ThreeLeaderObject extends ThreeVisualObject {
    context;
    leaderNode;
    _lines;
    _label;
    _labelElement;
    _hitMesh;
    _hitMaterial;
    _material;
    constructor(context, leaderNode) {
        super(leaderNode);
        this.context = context;
        this.leaderNode = leaderNode;
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
    handleLeaderPropertyChanged = (property) => {
        if (property === "points" || property === "text" || property === "height") {
            this.syncFromNode();
        }
    };
    syncFromNode() {
        const pts = this.leaderNode.points;
        const positions = [];
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i];
            const b = pts[i + 1];
            positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
        const geometry = this._lines.geometry;
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
    highlight() {
        this._material = hilightEdgeMaterial;
        this._lines.material = this._material;
    }
    unhighlight() {
        this._material = defaultEdgeMaterial;
        this._lines.material = this._material;
    }
    dispose() {
        this.leaderNode.removePropertyChanged(this.handleLeaderPropertyChanged);
        this._lines.geometry.dispose();
        this._hitMesh.geometry.dispose();
        this._hitMaterial.dispose();
        this._labelElement.remove();
        super.dispose();
    }
    getSubShapeAndIndex(shapeType, subVisualIndex) {
        void shapeType;
        void subVisualIndex;
        return { shape: undefined, subShape: undefined, index: -1, groups: [] };
    }
    subShapeVisual(shapeType) {
        void shapeType;
        return [];
    }
    wholeVisual() {
        return [this._lines, this._hitMesh];
    }
}
