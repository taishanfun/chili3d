// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { gc, LineType, VisualConfig } from "chili-core";
import { OccSubEdgeShape, OccSubFaceShape } from "./shape";
export class Mesher {
    shape;
    _isMeshed = false;
    _lines;
    _faces;
    get edges() {
        if (this._lines === undefined) {
            this.mesh();
        }
        return this._lines;
    }
    set edges(value) {
        this._lines = value;
    }
    get faces() {
        if (this._faces === undefined) {
            this.mesh();
        }
        return this._faces;
    }
    set faces(value) {
        this._faces = value;
    }
    constructor(shape) {
        this.shape = shape;
    }
    mesh() {
        if (this._isMeshed) {
            return;
        }
        this._isMeshed = true;
        gc((c) => {
            const occMesher = c(new wasm.Mesher(this.shape.shape, 0.005));
            const meshData = c(occMesher.mesh());
            const faceMeshData = c(meshData.faceMeshData);
            const edgeMeshData = c(meshData.edgeMeshData);
            this._faces = this.parseFaceMeshData(faceMeshData);
            this._lines = this.parseEdgeMeshData(edgeMeshData);
        });
    }
    parseFaceMeshData(faceMeshData) {
        return {
            position: new Float32Array(faceMeshData.position),
            normal: new Float32Array(faceMeshData.normal),
            uv: new Float32Array(faceMeshData.uv),
            index: new Uint32Array(faceMeshData.index),
            range: this.getFaceRanges(faceMeshData),
            color: VisualConfig.defaultFaceColor,
            groups: [],
        };
    }
    parseEdgeMeshData(edgeMeshData) {
        return {
            lineType: LineType.Solid,
            position: new Float32Array(edgeMeshData.position),
            range: this.getEdgeRanges(edgeMeshData),
            color: VisualConfig.defaultEdgeColor,
        };
    }
    dispose() {
        this._faces?.range.forEach((g) => g.shape.dispose());
        this._lines?.range.forEach((g) => g.shape.dispose());
        this.shape = null;
        this._faces = null;
        this._lines = null;
    }
    getEdgeRanges(data) {
        let result = [];
        for (let i = 0; i < data.edges.length; i++) {
            result.push({
                start: data.group[2 * i],
                count: data.group[2 * i + 1],
                shape: new OccSubEdgeShape(this.shape, data.edges[i], i),
            });
        }
        return result;
    }
    getFaceRanges(data) {
        let result = [];
        for (let i = 0; i < data.faces.length; i++) {
            result.push({
                start: data.group[2 * i],
                count: data.group[2 * i + 1],
                shape: new OccSubFaceShape(this.shape, data.faces[i], i),
            });
        }
        return result;
    }
}
