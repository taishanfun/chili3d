// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { ShapeNode, ShapeType } from "chili-core";
import { MeshUtils } from "chili-geo";
import { Color, Mesh } from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry";
import { defaultEdgeMaterial } from "./common";
import { Constants } from "./constants";
import { ThreeGeometryFactory } from "./threeGeometryFactory";
import { ThreeHelper } from "./threeHelper";
import { ThreeVisualObject } from "./threeVisualObject";
export class ThreeGeometry extends ThreeVisualObject {
    geometryNode;
    context;
    _faceMaterial;
    _edgeMaterial;
    _edges;
    _faces;
    constructor(geometryNode, context) {
        super(geometryNode);
        this.geometryNode = geometryNode;
        this.context = context;
        this._faceMaterial = context.getMaterial(geometryNode.materialId);
        this.generateShape();
        geometryNode.onPropertyChanged(this.handleGeometryPropertyChanged);
    }
    changeFaceMaterial(material) {
        if (this._faces) {
            this._faceMaterial = material;
            this._faces.material = material;
        }
    }
    box() {
        return this._faces?.geometry.boundingBox ?? this._edges?.geometry.boundingBox;
    }
    boundingBox() {
        const box = this._faces?.geometry.boundingBox ?? this._edges?.geometry.boundingBox;
        if (!box) return undefined;
        return {
            min: ThreeHelper.toXYZ(box.min),
            max: ThreeHelper.toXYZ(box.max),
        };
    }
    handleGeometryPropertyChanged = (property) => {
        if (property === "materialId") {
            this.changeFaceMaterial(this.context.getMaterial(this.geometryNode.materialId));
        } else if (property === "shape") {
            this.removeMeshes();
            this.generateShape();
        }
    };
    generateShape() {
        const mesh = this.geometryNode.mesh;
        if (mesh?.faces?.position.length) this.initFaces(mesh.faces);
        if (mesh?.edges?.position.length) this.initEdges(mesh.edges);
    }
    dispose() {
        super.dispose();
        this.geometryNode.removePropertyChanged(this.handleGeometryPropertyChanged);
        this.removeMeshes();
    }
    removeMeshes() {
        if (this._edges) {
            this.remove(this._edges);
            this._edgeMaterial?.dispose();
            this._edges.geometry.dispose();
            this._edges = null;
            this._edgeMaterial = undefined;
        }
        if (this._faces) {
            this.remove(this._faces);
            this._faces.geometry.dispose();
            this._faces = null;
        }
    }
    toHexColor(value) {
        if (value === undefined) return undefined;
        if (typeof value === "number") return value;
        if (!value) return undefined;
        try {
            return new Color(value).getHex();
        } catch {
            return undefined;
        }
    }
    initEdges(data) {
        const layer = this.geometryNode.document.layers.find((l) => l.id === this.geometryNode.layerId);
        const layerColor = this.toHexColor(layer?.color);
        const layerEdgeData = {
            ...data,
            color: layerColor ?? data.color,
            lineType: layer?.lineType ?? data.lineType,
        };
        const buff = ThreeGeometryFactory.createEdgeBufferGeometry(layerEdgeData);
        const material = ThreeGeometryFactory.createEdgeMaterial(layerEdgeData);
        this._edgeMaterial = material;
        ThreeGeometryFactory.setColor(buff, layerEdgeData, material);
        this._edges = new LineSegments2(buff, material).computeLineDistances();
        this._edges.layers.set(Constants.Layers.Wireframe);
        this.add(this._edges);
    }
    initFaces(data) {
        const buff = ThreeGeometryFactory.createFaceBufferGeometry(data);
        if (data.groups.length > 1) buff.groups = data.groups;
        this._faces = new Mesh(buff, this._faceMaterial);
        this._faces.layers.set(Constants.Layers.Solid);
        this.add(this._faces);
    }
    setFacesMateiralTemperary(material) {
        if (this._faces) this._faces.material = material;
    }
    setEdgesMateiralTemperary(material) {
        if (this._edges) this._edges.material = material;
    }
    removeTemperaryMaterial() {
        if (this._edges) this._edges.material = this._edgeMaterial ?? defaultEdgeMaterial;
        if (this._faces) this._faces.material = this._faceMaterial;
    }
    cloneSubEdge(index) {
        const positions = MeshUtils.subEdge(this.geometryNode.mesh.edges, index);
        if (!positions) return undefined;
        const buff = new LineSegmentsGeometry();
        buff.setPositions(positions);
        buff.applyMatrix4(this.matrixWorld);
        return new LineSegments2(buff, defaultEdgeMaterial);
    }
    cloneSubFace(index) {
        const mesh = MeshUtils.subFace(this.geometryNode.mesh.faces, index);
        if (!mesh) return undefined;
        const buff = ThreeGeometryFactory.createFaceBufferGeometry(mesh);
        buff.applyMatrix4(this.matrixWorld);
        return new Mesh(buff, this._faceMaterial);
    }
    faces() {
        return this._faces;
    }
    edges() {
        return this._edges;
    }
    getSubShapeAndIndex(shapeType, subVisualIndex) {
        let subShape = undefined;
        let transform = undefined;
        let index = -1;
        let groups = undefined;
        if (shapeType === "edge") {
            groups = this.geometryNode.mesh.edges?.range;
            if (groups) {
                index = ThreeHelper.findGroupIndex(groups, subVisualIndex);
                subShape = groups[index].shape;
                transform = groups[index].transform;
            }
        } else {
            groups = this.geometryNode.mesh.faces?.range;
            if (groups) {
                index = ThreeHelper.findGroupIndex(groups, subVisualIndex);
                subShape = groups[index].shape;
                transform = groups[index].transform;
            }
        }
        let shape = subShape;
        if (this.geometryNode instanceof ShapeNode) {
            shape = this.geometryNode.shape.value;
        }
        return { transform, shape, subShape, index, groups: groups ?? [] };
    }
    subShapeVisual(shapeType) {
        const shapes = [];
        const isWhole =
            shapeType === ShapeType.Shape ||
            ShapeType.hasCompound(shapeType) ||
            ShapeType.hasCompoundSolid(shapeType) ||
            ShapeType.hasSolid(shapeType);
        if (isWhole || ShapeType.hasEdge(shapeType) || ShapeType.hasWire(shapeType)) {
            shapes.push(this.edges());
        }
        if (isWhole || ShapeType.hasFace(shapeType) || ShapeType.hasShell(shapeType)) {
            shapes.push(this.faces());
        }
        return shapes.filter((x) => x !== undefined);
    }
    wholeVisual() {
        return [this.edges(), this.faces()].filter((x) => x !== undefined);
    }
}
