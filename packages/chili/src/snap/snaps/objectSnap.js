// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import {
    Config,
    I18n,
    ICurve,
    IView,
    ObjectSnapType,
    ShapeType,
    VertexMeshData,
    VisualConfig,
} from "chili-core";
import { BaseSnap } from "./baseSnap";
import { FeaturePointStrategy } from "./featurePointStrategy";
export class ObjectSnap extends BaseSnap {
    _snapType;
    _featureStrategy;
    _intersectionInfos;
    _invisibleInfos;
    _lastDetected;
    _hintVertex;
    constructor(_snapType, referencePoint) {
        super(referencePoint);
        this._snapType = _snapType;
        this._featureStrategy = new FeaturePointStrategy(_snapType);
        this._intersectionInfos = new Map();
        this._invisibleInfos = new Map();
        Config.instance.onPropertyChanged(this.onSnapTypeChanged);
    }
    clear() {
        super.clear();
        this._invisibleInfos.forEach((info) => {
            info.displays.forEach((x) => info.view.document.visual.context.removeMesh(x));
        });
        this.removeHint();
        this._featureStrategy.clear();
        Config.instance.removePropertyChanged(this.onSnapTypeChanged);
    }
    handleSnaped = (document, snaped) => {
        if (snaped?.shapes.length === 0 && this._lastDetected) {
            this.displayHint(this._lastDetected[0], this._lastDetected[1]);
            this._lastDetected = undefined;
        }
    };
    onSnapTypeChanged = (property) => {
        if (property === "snapType" || property === "enableSnap") {
            this._snapType = Config.instance.snapType;
            this._featureStrategy.updateSnapType(this._snapType);
            this._intersectionInfos.clear();
        }
    };
    removeDynamicObject() {
        super.removeDynamicObject();
        this.removeHint();
    }
    removeHint() {
        if (this._hintVertex !== undefined) {
            this._hintVertex[0].removeMesh(this._hintVertex[1]);
            this._hintVertex = undefined;
        }
    }
    snap(data) {
        if (!Config.instance.enableSnap) return undefined;
        let snap;
        if (data.shapes.length > 0) {
            this.showInvisibleSnaps(data.view, data.shapes[0]);
            snap = this.snapOnShape(data.view, data.mx, data.my, data.shapes);
        } else {
            snap = this.snapeInvisible(data.view, data.mx, data.my);
        }
        if (this.referencePoint && snap?.point) {
            snap.distance = this.referencePoint().distanceTo(snap.point);
        }
        return snap;
    }
    snapOnShape(view, x, y, shapes) {
        const featurePoints = this._featureStrategy.getFeaturePoints(view, shapes[0]);
        const perpendiculars = this.findPerpendicular(view, shapes[0]);
        const intersections = this.getIntersections(view, shapes[0], shapes);
        const ordered = [...featurePoints, ...perpendiculars, ...intersections].sort((a, b) =>
            this.sortSnaps(view, x, y, a, b),
        );
        if (ordered.length === 0) return undefined;
        const dist = IView.screenDistance(view, x, y, ordered[0].point);
        if (dist < Config.instance.SnapDistance) {
            this.hilighted(view, ordered[0].shapes);
            return ordered[0];
        } else {
            this._lastDetected = [view, ordered[0]];
            return undefined;
        }
    }
    displayHint(view, shape) {
        this.hilighted(view, shape.shapes);
        let data = VertexMeshData.from(
            shape.point,
            VisualConfig.hintVertexSize,
            VisualConfig.hintVertexColor,
        );
        this._hintVertex = [view.document.visual.context, view.document.visual.context.displayMesh([data])];
    }
    snapeInvisible(view, x, y) {
        const { minDistance, snap } = this.getNearestInvisibleSnap(view, x, y);
        if (minDistance < Config.instance.SnapDistance) {
            this.hilighted(view, snap.shapes);
            return snap;
        }
        return undefined;
    }
    getNearestInvisibleSnap(view, x, y) {
        let snap;
        let minDistance = Number.MAX_VALUE;
        this._invisibleInfos.forEach((info) => {
            info.snaps.forEach((s) => {
                const dist = IView.screenDistance(view, x, y, s.point);
                if (dist < minDistance) {
                    minDistance = dist;
                    snap = s;
                }
            });
        });
        return { minDistance, snap };
    }
    showInvisibleSnaps(view, shape) {
        if (shape.shape.shapeType === ShapeType.Edge) {
            if (this._invisibleInfos.has(shape)) return;
            let curve = shape.shape.curve;
            let basisCurve = curve.basisCurve;
            if (ICurve.isCircle(basisCurve)) {
                this.showCircleCenter(basisCurve, view, shape);
            }
        }
    }
    showCircleCenter(curve, view, shape) {
        const center = shape.transform.ofPoint(curve.center);
        let temporary = VertexMeshData.from(
            center,
            VisualConfig.hintVertexSize,
            VisualConfig.hintVertexColor,
        );
        let id = view.document.visual.context.displayMesh([temporary]);
        this._invisibleInfos.set(shape, {
            view,
            snaps: [
                {
                    view,
                    point: center,
                    info: I18n.translate("snap.center"),
                    shapes: [shape],
                },
            ],
            displays: [id],
        });
    }
    hilighted(view, shapes) {
        this.highlight(shapes);
    }
    sortSnaps(view, x, y, a, b) {
        return IView.screenDistance(view, x, y, a.point) - IView.screenDistance(view, x, y, b.point);
    }
    findPerpendicular(view, shape) {
        let result = [];
        if (
            !ObjectSnapType.has(this._snapType, ObjectSnapType.perpendicular) ||
            this.referencePoint === undefined
        ) {
            return result;
        }
        let curve = shape.shape.curve;
        const transform = shape.transform;
        let point = curve.project(transform.invert().ofPoint(this.referencePoint())).at(0);
        if (point === undefined) return result;
        result.push({
            view,
            point: transform.ofPoint(point),
            info: I18n.translate("snap.perpendicular"),
            shapes: [shape],
        });
        return result;
    }
    getIntersections(view, current, shapes) {
        let result = new Array();
        if (
            !ObjectSnapType.has(this._snapType, ObjectSnapType.intersection) ||
            current.shape.shapeType !== ShapeType.Edge
        ) {
            return result;
        }
        shapes.forEach((x) => {
            if (x === current || x.shape.shapeType !== ShapeType.Edge) return;
            let key = this.getIntersectionKey(current, x);
            let arr = this._intersectionInfos.get(key);
            if (arr === undefined) {
                arr = this.findIntersections(view, current, x);
                this._intersectionInfos.set(key, arr);
            }
            result.push(...arr);
        });
        return result;
    }
    getIntersectionKey(s1, s2) {
        return s1.shape.id < s2.shape.id ? `${s1.shape.id}:${s2.shape.id}` : `${s2.shape.id}:${s1.shape.id}`;
    }
    findIntersections(view, s1, s2) {
        const e1 = s1.shape.transformedMul(s1.transform);
        const e2 = s2.shape.transformedMul(s2.transform);
        let intersections = e1.intersect(e2);
        e1.dispose();
        e2.dispose();
        return intersections.map((point) => {
            return {
                view,
                point: point.point,
                info: I18n.translate("snap.intersection"),
                shapes: [s1, s2],
            };
        });
    }
}
