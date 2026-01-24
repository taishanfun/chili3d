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
var Mesh_1;
import { VisualConfig } from "../config";
import { Serializer } from "../serialize";
import { LineType } from "./lineType";
let MeshGroup = class MeshGroup {
    start;
    count;
    materialIndex;
    constructor(start, count, materialIndex) {
        this.start = start;
        this.count = count;
        this.materialIndex = materialIndex;
    }
};
__decorate([Serializer.serialze()], MeshGroup.prototype, "start", void 0);
__decorate([Serializer.serialze()], MeshGroup.prototype, "count", void 0);
__decorate([Serializer.serialze()], MeshGroup.prototype, "materialIndex", void 0);
MeshGroup = __decorate([Serializer.register(["start", "count", "materialIndex"])], MeshGroup);
export { MeshGroup };
let Mesh = (Mesh_1 = class Mesh {
    static createSurface(positionSize, indexSize) {
        let mesh = new Mesh_1();
        mesh.meshType = "surface";
        mesh.normal = new Float32Array(positionSize * 3);
        mesh.uv = new Float32Array(positionSize * 2);
        mesh.position = new Float32Array(positionSize * 3);
        mesh.index = new Uint32Array(indexSize);
        return mesh;
    }
    static createLineSegments(size) {
        let mesh = new Mesh_1();
        mesh.meshType = "linesegments";
        mesh.position = new Float32Array(size * 3);
        return mesh;
    }
    meshType = "linesegments";
    position;
    normal = undefined;
    index = undefined;
    color = 0xfff;
    uv = undefined;
    groups = [];
});
__decorate([Serializer.serialze()], Mesh.prototype, "meshType", void 0);
__decorate([Serializer.serialze()], Mesh.prototype, "position", void 0);
__decorate([Serializer.serialze()], Mesh.prototype, "normal", void 0);
__decorate([Serializer.serialze()], Mesh.prototype, "index", void 0);
__decorate([Serializer.serialze()], Mesh.prototype, "color", void 0);
__decorate([Serializer.serialze()], Mesh.prototype, "uv", void 0);
__decorate([Serializer.serialze()], Mesh.prototype, "groups", void 0);
Mesh = Mesh_1 = __decorate([Serializer.register([])], Mesh);
export { Mesh };
export var ShapeMeshData;
(function (ShapeMeshData) {
    function isVertex(data) {
        return data?.size !== undefined;
    }
    ShapeMeshData.isVertex = isVertex;
    function isEdge(data) {
        return data?.lineType !== undefined;
    }
    ShapeMeshData.isEdge = isEdge;
    function isFace(data) {
        return data?.index !== undefined;
    }
    ShapeMeshData.isFace = isFace;
})(ShapeMeshData || (ShapeMeshData = {}));
export var VertexMeshData;
(function (VertexMeshData) {
    function from(point, size, color) {
        return {
            position: new Float32Array([point.x, point.y, point.z]),
            range: [],
            color,
            size,
        };
    }
    VertexMeshData.from = from;
})(VertexMeshData || (VertexMeshData = {}));
export function concatTypedArrays(arrays) {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    const result = new arrays[0].constructor(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}
export var EdgeMeshData;
(function (EdgeMeshData) {
    function from(start, end, color, lineType) {
        return {
            position: new Float32Array([start.x, start.y, start.z, end.x, end.y, end.z]),
            color,
            lineType,
            range: [],
        };
    }
    EdgeMeshData.from = from;
    function merge(data, other) {
        const otherRange = other.range.map((range) => {
            return {
                start: range.start + data.position.length / 3,
                count: range.count,
                shape: range.shape,
                transform: range.transform,
            };
        });
        return {
            position: concatTypedArrays([data.position, other.position]),
            range: data.range.concat(otherRange),
            color: data.color,
            lineType: data.lineType,
            lineWidth: data.lineWidth,
        };
    }
    EdgeMeshData.merge = merge;
})(EdgeMeshData || (EdgeMeshData = {}));
export var FaceMeshData;
(function (FaceMeshData) {
    function merge(data, other) {
        const otherRange = other.range.map((range) => {
            return {
                start: range.start + data.position.length / 3,
                count: range.count,
                shape: range.shape,
                transform: range.transform,
            };
        });
        const groups = other.groups.map((group) => {
            return {
                start: group.start + data.index.length,
                count: group.count,
                materialIndex: group.materialIndex,
            };
        });
        return {
            position: concatTypedArrays([data.position, other.position]),
            range: data.range.concat(otherRange),
            index: concatTypedArrays([data.index, other.index]),
            normal: concatTypedArrays([data.normal, other.normal]),
            uv: concatTypedArrays([data.uv, other.uv]),
            color: data.color,
            groups,
        };
    }
    FaceMeshData.merge = merge;
})(FaceMeshData || (FaceMeshData = {}));
export class MeshDataBuilder {
    _positions = [];
    _groups = [];
    _color;
    _vertexColor;
    setColor(color) {
        this._color = color;
    }
    addColor(r, g, b) {
        this._vertexColor ??= [];
        this._vertexColor.push(r, g, b);
        return this;
    }
    getColor() {
        let color = this._vertexColor;
        if (this._vertexColor?.length !== this._positions.length) {
            color = this._color;
        }
        return color;
    }
}
/**
 * LineSegments
 */
export class EdgeMeshDataBuilder extends MeshDataBuilder {
    _positionStart = 0;
    _previousVertex = undefined;
    _lineType = LineType.Solid;
    constructor() {
        super();
        this._color = VisualConfig.defaultEdgeColor;
    }
    setType(type) {
        this._lineType = type;
    }
    newGroup() {
        this._positionStart = this._positions.length;
        this._previousVertex = undefined;
        return this;
    }
    endGroup(shape) {
        this._groups.push({
            start: this._positionStart / 3,
            count: (this._positions.length - this._positionStart) / 3,
            shape,
        });
        return this;
    }
    addPosition(x, y, z) {
        if (this._previousVertex) {
            this._positions.push(...this._previousVertex, x, y, z);
        }
        this._previousVertex = [x, y, z];
        return this;
    }
    build() {
        let color = this.getColor();
        return {
            position: new Float32Array(this._positions),
            range: this._groups,
            lineType: this._lineType,
            color,
        };
    }
}
export class FaceMeshDataBuilder extends MeshDataBuilder {
    _indexStart = 0;
    _groupStart = 0;
    _normals = [];
    _uvs = [];
    _indices = [];
    constructor() {
        super();
        this._color = VisualConfig.defaultFaceColor;
    }
    newGroup() {
        this._groupStart = this._indices.length;
        this._indexStart = this._positions.length / 3;
        return this;
    }
    endGroup(shape) {
        this._groups.push({
            start: this._groupStart,
            count: this._indices.length - this._groupStart,
            shape,
        });
        return this;
    }
    addPosition(x, y, z) {
        this._positions.push(x, y, z);
        return this;
    }
    addNormal(x, y, z) {
        this._normals.push(x, y, z);
        return this;
    }
    addUV(u, v) {
        this._uvs.push(u, v);
        return this;
    }
    addIndices(i1, i2, i3) {
        this._indices.push(this._indexStart + i1, this._indexStart + i2, this._indexStart + i3);
        return this;
    }
    build() {
        return {
            position: new Float32Array(this._positions),
            color: this.getColor(),
            normal: new Float32Array(this._normals),
            index: new Uint32Array(this._indices),
            uv: new Float32Array(this._uvs),
            range: this._groups,
            groups: [],
        };
    }
}
