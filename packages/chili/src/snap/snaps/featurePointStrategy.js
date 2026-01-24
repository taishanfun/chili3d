// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { I18n, ObjectSnapType, ShapeType } from "chili-core";
export class FeaturePointStrategy {
    _snapType;
    _featureInfos = new Map();
    constructor(_snapType) {
        this._snapType = _snapType;
    }
    getFeaturePoints(view, shape) {
        if (this._featureInfos.has(shape)) {
            return this._featureInfos.get(shape);
        }
        const infos = [];
        if (shape.shape.shapeType === ShapeType.Edge) {
            this.getEdgeFeaturePoints(view, shape, infos);
        }
        this._featureInfos.set(shape, infos);
        return infos;
    }
    getEdgeFeaturePoints(view, shape, infos) {
        const curve = shape.shape.curve;
        const start = curve.value(curve.firstParameter());
        const end = curve.value(curve.lastParameter());
        const addPoint = (point, info) =>
            infos.push({
                view,
                point: shape.transform.ofPoint(point),
                info,
                shapes: [shape],
            });
        if (ObjectSnapType.has(this._snapType, ObjectSnapType.endPoint)) {
            addPoint(start, I18n.translate("snap.end"));
            addPoint(end, I18n.translate("snap.end"));
        }
        if (ObjectSnapType.has(this._snapType, ObjectSnapType.midPoint)) {
            const mid = curve.value((curve.firstParameter() + curve.lastParameter()) * 0.5);
            addPoint(mid, I18n.translate("snap.mid"));
        }
    }
    clear() {
        this._featureInfos.clear();
    }
    updateSnapType(snapType) {
        this._snapType = snapType;
        this.clear();
    }
}
