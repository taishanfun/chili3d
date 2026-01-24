// Part of the Chili3d Project, under the AGPL-3.0 License.
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
import { VisualConfig } from "../config";
import { Id, Logger, PubSub, Result } from "../foundation";
import { I18n } from "../i18n";
import { Matrix4 } from "../math";
import { Serializer } from "../serialize";
import { LineType } from "../shape";
import { GeometryNode } from "./geometryNode";
const SHAPE_UNDEFINED = "Shape not initialized";
export class ShapeNode extends GeometryNode {
    _shape = Result.err(SHAPE_UNDEFINED);
    get shape() {
        return this._shape;
    }
    setShape(shape) {
        if (this._shape.isOk && this._shape.value.isEqual(shape.value)) {
            return;
        }
        if (!shape.isOk) {
            PubSub.default.pub("displayError", shape.error);
            return;
        }
        let oldShape = this._shape;
        this._shape = shape;
        this._mesh = undefined;
        this.emitPropertyChanged("shape", oldShape);
        oldShape.unchecked()?.dispose();
    }
    createMesh() {
        if (!this.shape.isOk) {
            Logger.warn(this.shape.error);
            return { edges: undefined, faces: undefined };
        }
        const mesh = this.shape.value.mesh;
        this._originFaceMesh = mesh.faces;
        if (mesh.faces)
            mesh.faces = MeshUtils.mergeFaceMesh(
                mesh.faces,
                this.faceMaterialPair.map((x) => [x.faceIndex, x.materialIndex]),
            );
        return mesh;
    }
    disposeInternal() {
        super.disposeInternal();
        this._shape.unchecked()?.dispose();
        this._shape = null;
    }
}
export class MultiShapeMesh {
    _edges;
    _faces;
    get edges() {
        return this._edges.position.length > 0 ? this._edges : undefined;
    }
    get faces() {
        return this._faces.position.length > 0 ? this._faces : undefined;
    }
    constructor() {
        this._edges = {
            lineType: LineType.Solid,
            position: new Float32Array(),
            range: [],
            color: VisualConfig.defaultEdgeColor,
        };
        this._faces = {
            index: new Uint32Array(),
            normal: new Float32Array(),
            position: new Float32Array(),
            uv: new Float32Array(),
            range: [],
            groups: [],
            color: VisualConfig.defaultFaceColor,
        };
    }
    addShape(shape, matrix) {
        const mesh = shape.mesh;
        const totleMatrix = shape.matrix.multiply(matrix);
        if (mesh.faces) {
            MeshUtils.combineFaceMeshData(this._faces, mesh.faces, totleMatrix);
        }
        if (mesh.edges) {
            MeshUtils.combineEdgeMeshData(this._edges, mesh.edges, totleMatrix);
        }
    }
}
let MultiShapeNode = class MultiShapeNode extends GeometryNode {
    _shapes;
    get shapes() {
        return this._shapes;
    }
    constructor(document, name, shapes, materialId, id = Id.generate()) {
        super(document, name, materialId, id);
        this._shapes = shapes;
    }
    createMesh() {
        const meshes = new MultiShapeMesh();
        this._shapes.forEach((shape) => {
            meshes.addShape(shape, Matrix4.identity());
        });
        return meshes;
    }
    display() {
        return "body.multiShape";
    }
};
__decorate([Serializer.serialze()], MultiShapeNode.prototype, "shapes", null);
MultiShapeNode = __decorate(
    [Serializer.register(["document", "name", "shapes", "materialId", "id"])],
    MultiShapeNode,
);
export { MultiShapeNode };
export class ParameterShapeNode extends ShapeNode {
    get shape() {
        if (!this._shape.isOk && this._shape.error === SHAPE_UNDEFINED) {
            this._shape = this.generateShape();
        }
        return this._shape;
    }
    setPropertyEmitShapeChanged(property, newValue, onPropertyChanged, equals) {
        if (this.setProperty(property, newValue, onPropertyChanged, equals)) {
            this.setShape(this.generateShape());
            return true;
        }
        return false;
    }
    constructor(document, materialId, id) {
        super(document, undefined, materialId, id);
        this.setPrivateValue("name", I18n.translate(this.display()));
    }
}
let EditableShapeNode = class EditableShapeNode extends ShapeNode {
    display() {
        return "body.editableShape";
    }
    get shape() {
        return this._shape;
    }
    set shape(shape) {
        this.setShape(shape);
    }
    constructor(document, name, shape, materialId, id) {
        super(document, name, materialId, id);
        this._shape = shape instanceof Result ? shape : Result.ok(shape);
    }
};
__decorate([Serializer.serialze()], EditableShapeNode.prototype, "shape", null);
EditableShapeNode = __decorate(
    [Serializer.register(["document", "name", "shape", "materialId", "id"])],
    EditableShapeNode,
);
export { EditableShapeNode };
