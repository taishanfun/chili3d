// Part of the Chili3d Project, under the AGPL-3.0 Licensettt.
// See LICENSE file in the project root for full license information.
var __decorate =
    (this && this.__decorate) ||
    function (decorators, target, key, desc) {
        var c = arguments.length,
            r =
                c < 3
                    ? target
                    : desc === null
                      ? (desc = Object.getOwnPropertyDescriptor(target, key))
                      : desc,
            d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if ((d = decorators[i]))
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
import { MeshUtils } from "chili-geo";
import { Id } from "../foundation";
import { BoundingBox, Matrix4 } from "../math";
import { Property } from "../property";
import { Serializer } from "../serialize";
import { LineType, Mesh } from "../shape";
import { MeshNode } from "./meshNode";
import { ShapeNode } from "./shapeNode";
import { VisualNode } from "./visualNode";
export function createComponentMesh(size) {
    return {
        faceMaterials: [],
        edge: {
            lineType: LineType.Solid,
            position: new Float32Array(size.edge * 3),
            range: [],
        },
        face: {
            index: new Uint32Array(size.faceIndex),
            normal: new Float32Array(size.facePosition * 3),
            position: new Float32Array(size.facePosition * 3),
            uv: new Float32Array(size.facePosition * 2),
            range: [],
            groups: [],
        },
        linesegments: Mesh.createLineSegments(size.lineSegment),
        surfaceMaterials: [],
        surface: Mesh.createSurface(
            size.meshPosition,
            size.meshIndex > 0 ? size.meshIndex : size.meshPosition * 3,
        ),
    };
}
export function createComponentSize() {
    return {
        facePosition: 0,
        faceIndex: 0,
        edge: 0,
        lineSegment: 0,
        meshIndex: 0,
        meshPosition: 0,
    };
}
let Component = class Component {
    _nodes;
    get nodes() {
        return this._nodes;
    }
    _name;
    get name() {
        return this._name;
    }
    id;
    _origin;
    get origin() {
        return this._origin;
    }
    set origin(value) {
        this._origin = value;
    }
    _boundingBox;
    get boundingBox() {
        this._boundingBox ??= this.computeBoundingBox();
        return this._boundingBox;
    }
    _mesh;
    get mesh() {
        this._mesh ??= this.mergeMesh();
        return this._mesh;
    }
    instances = [];
    constructor(name, nodes, origin, id = Id.generate()) {
        this._name = name;
        this._nodes = nodes;
        this.id = id;
        this._origin = origin ?? BoundingBox.center(this.boundingBox);
        this._nodes.forEach((node) => node.onPropertyChanged(this.handleDefinitionNodeChanged));
    }
    toString() {
        return this.name;
    }
    handleDefinitionNodeChanged = () => {
        this.invalidate();
    };
    invalidate() {
        this._mesh = undefined;
        this._boundingBox = undefined;
        const instances = [...this.instances];
        const documentRedrawMap = new Map();
        for (const instance of instances) {
            const list = documentRedrawMap.get(instance.document) ?? [];
            list.push(instance);
            documentRedrawMap.set(instance.document, list);
        }
        documentRedrawMap.forEach((nodes, document) => {
            document.visual.context.redrawNode(nodes);
        });
    }
    mergeMesh() {
        const size = createComponentSize();
        this.getSize(this._nodes, size);
        const mesh = createComponentMesh(size);
        const offset = createComponentSize();
        const faceMaterialPair = [];
        this.mergeNodesMesh(mesh, faceMaterialPair, this._nodes, Matrix4.identity(), offset);
        mesh.face = MeshUtils.mergeFaceMesh(mesh.face, faceMaterialPair);
        return mesh;
    }
    getSize(nodes, size) {
        for (const node of nodes) {
            if (node instanceof ShapeNode && node.shape.isOk) {
                const mesh = node.shape.value.mesh;
                if (mesh.faces) {
                    size.facePosition += mesh.faces.position.length / 3;
                    size.faceIndex += mesh.faces.index.length;
                }
                if (mesh.edges) size.edge += mesh.edges.position.length / 3;
            } else if (node instanceof MeshNode) {
                size.meshPosition += node.mesh.position.length / 3;
                if (node.mesh.meshType === "surface") {
                    size.meshIndex += node.mesh.index?.length ?? 0;
                }
            } else if (node instanceof ComponentNode) {
                this.getSize(node.component.nodes, size);
            }
        }
    }
    mergeNodesMesh = (visual, faceMaterialPair, nodes, transform, offset) => {
        for (const node of nodes) {
            const totleTransform = node.transform.multiply(transform);
            if (node instanceof ShapeNode && node.shape.isOk) {
                this.mergeShapeNode(visual, faceMaterialPair, node, totleTransform, offset);
            } else if (node instanceof ComponentNode) {
                this.mergeNodesMesh(visual, faceMaterialPair, node.component.nodes, totleTransform, offset);
            } else if (node instanceof MeshNode) {
                this.mergeMeshNode(visual, node, totleTransform, offset);
            } else {
                console.log(`****** to do merge MeshNode ******: ${Object.prototype.toString.call(node)}`);
            }
        }
    };
    mergeShapeNode(visual, faceMaterialPair, node, transform, offset) {
        const mesh = node.shape.value.mesh;
        if (mesh.edges) {
            MeshUtils.setEdgeMeshData(visual.edge, mesh.edges, transform, offset.edge);
            offset.edge += mesh.edges.position.length / 3;
        }
        if (mesh.faces) {
            this.mergeFaceMaterial(node, visual, faceMaterialPair);
            MeshUtils.setFaceMeshData(visual.face, mesh.faces, transform, offset);
            offset.facePosition += mesh.faces.position.length / 3;
            offset.faceIndex += mesh.faces.index.length;
        }
    }
    mergeFaceMaterial(node, visual, faceMaterialPair) {
        const materialIndexMap = this.mapOldNewMaterialIndex(node.materialId, visual.faceMaterials);
        const map = new Map(node.faceMaterialPair.map((pair) => [pair.faceIndex, pair.materialIndex]));
        node.mesh.faces?.range.forEach((range, i) => {
            if (!map.has(i)) {
                faceMaterialPair.push([i + visual.face.range.length, materialIndexMap.get(0)]);
            }
        });
        node.faceMaterialPair.forEach((pair) => {
            faceMaterialPair.push([
                pair.faceIndex + visual.face.range.length,
                materialIndexMap.get(pair.materialIndex),
            ]);
        });
    }
    mergeMeshNode(visual, node, transform, offset) {
        if (node.mesh.meshType === "surface") {
            const materialONMap = this.mapOldNewMaterialIndex(node.materialId, visual.surfaceMaterials);
            MeshUtils.setSurfaceMeshData(visual.surface, node.mesh, transform, offset, materialONMap);
            offset.meshPosition += node.mesh.position.length / 3;
            if (node.mesh.index?.length) {
                offset.meshIndex += node.mesh.index.length;
            }
        } else if (node.mesh.meshType === "linesegments") {
            visual.linesegments.position?.set(
                transform.ofPoints(node.mesh.position),
                offset.lineSegment * 3,
            );
            offset.lineSegment += node.mesh.position.length / 3;
        }
    }
    mapOldNewMaterialIndex(materialId, materialIds) {
        const materialIndexMap = new Map();
        const materials = Array.isArray(materialId) ? materialId : [materialId];
        for (let i = 0; i < materials.length; i++) {
            const index = materialIds.indexOf(materials[i]);
            if (index === -1) {
                materialIds.push(materials[i]);
                materialIndexMap.set(i, materialIds.length - 1);
            } else {
                materialIndexMap.set(i, index);
            }
        }
        return materialIndexMap;
    }
    computeBoundingBox() {
        if (this._nodes.length === 0) {
            return undefined;
        }
        let box = this._nodes[0].boundingBox();
        for (let i = 1; i < this._nodes.length; i++) {
            box = BoundingBox.combine(box, this._nodes[i].boundingBox());
        }
        return box;
    }
};
__decorate([Serializer.serialze()], Component.prototype, "nodes", null);
__decorate([Serializer.serialze()], Component.prototype, "name", null);
__decorate([Serializer.serialze()], Component.prototype, "id", void 0);
__decorate([Serializer.serialze()], Component.prototype, "origin", null);
Component = __decorate([Serializer.register(["name", "nodes", "origin", "id"])], Component);
export { Component };
let ComponentNode = class ComponentNode extends VisualNode {
    display() {
        return "body.group";
    }
    boundingBox() {
        if (!this.component.boundingBox) {
            return undefined;
        }
        return BoundingBox.transformed(this.component.boundingBox, this.transform);
    }
    _component;
    get component() {
        if (!this._component) {
            this._component = this.document.components.find((c) => c.id === this.componentId);
            if (!this._component) {
                throw new Error(`Component ${this.componentId} not found`);
            }
            this._component.instances.push(this);
        }
        return this._component;
    }
    componentId;
    insert;
    constructor(document, name, componentId, insert, id = Id.generate()) {
        super(document, name, id);
        this.componentId = componentId;
        this.insert = insert;
    }
};
__decorate([Property.define("body.group")], ComponentNode.prototype, "component", null);
__decorate([Serializer.serialze()], ComponentNode.prototype, "componentId", void 0);
__decorate([Serializer.serialze()], ComponentNode.prototype, "insert", void 0);
ComponentNode = __decorate(
    [Serializer.register(["document", "name", "componentId", "insert", "id"])],
    ComponentNode,
);
export { ComponentNode };
