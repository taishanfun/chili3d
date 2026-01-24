// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { GeometryType } from "chili-core";
import { OcctHelper } from "./helper";
export class OccGeometry {
    geometry;
    _geometryType;
    _handleGeometry;
    get geometryType() {
        return this._geometryType;
    }
    constructor(geometry) {
        this.geometry = geometry;
        this._handleGeometry = new wasm.Handle_Geom_Geometry(geometry);
        this._geometryType = this.getGeometryType(geometry);
    }
    getGeometryType(geometry) {
        let isKind = (type) => wasm.Transient.isKind(geometry, type);
        if (isKind("Geom_Curve")) {
            return GeometryType.Curve;
        } else if (isKind("Geom_Surface")) {
            return GeometryType.Surface;
        }
        throw new Error("Unknown geometry type");
    }
    #disposed = false;
    dispose = () => {
        if (!this.#disposed) {
            this.#disposed = true;
            this.disposeInternal();
        }
    };
    disposeInternal() {
        this._handleGeometry.delete();
    }
    transform(value) {
        this.geometry.transform(OcctHelper.convertFromMatrix(value));
    }
}
