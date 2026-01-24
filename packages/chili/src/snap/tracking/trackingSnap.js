// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import {
    Config,
    EdgeMeshData,
    I18n,
    IView,
    LineType,
    Precision,
    ShapeType,
    VisualConfig,
    XY,
} from "chili-core";
import { AxisTracking } from "./axisTracking";
import { ObjectTracking } from "./objectTracking";
export class TrackingSnap {
    referencePoint;
    _axisTracking;
    _objectTracking;
    _tempLines = new Map();
    constructor(referencePoint, trackingAxisZ) {
        this.referencePoint = referencePoint;
        this._axisTracking = new AxisTracking(trackingAxisZ);
        this._objectTracking = new ObjectTracking(trackingAxisZ);
        Config.instance.onPropertyChanged(this.onSnapTypeChanged);
    }
    handleSnaped = (document, snaped) => {
        if (Config.instance.enableSnapTracking) {
            this._objectTracking.showTrackingAtTimeout(document, snaped);
        }
    };
    snap(data) {
        if (!Config.instance.enableSnapTracking) return undefined;
        const trackingDatas = this.detectTracking(data.view, data.mx, data.my);
        if (trackingDatas.length === 0) return undefined;
        trackingDatas.sort((x) => x.distance);
        let snaped = this.shapeIntersectTracking(data, trackingDatas);
        if (snaped !== undefined) return snaped;
        if (trackingDatas.length === 1) {
            return this.getSnapedAndShowTracking(data.view, trackingDatas[0].point, [trackingDatas[0]]);
        }
        return (
            this.trackingIntersectTracking(data.view, trackingDatas) ??
            this.getSnapedAndShowTracking(data.view, trackingDatas[0].point, [trackingDatas[0]])
        );
    }
    trackingIntersectTracking(view, trackingDatas) {
        const point = trackingDatas[0].axis.intersect(trackingDatas[1].axis);
        return point
            ? this.getSnapedAndShowTracking(view, point, [trackingDatas[0], trackingDatas[1]])
            : undefined;
    }
    getSnapedAndShowTracking(view, point, trackingDatas) {
        const lines = trackingDatas
            .map((x) => this.showTempLine(view, x.axis.location, point))
            .filter((id) => id !== undefined);
        this._tempLines.set(view, lines);
        let info = undefined;
        let distance = undefined;
        if (trackingDatas.length === 1) {
            distance = point.distanceTo(trackingDatas[0].axis.location);
            info = trackingDatas[0].axis.name;
        } else if (trackingDatas.length === 2) {
            info = I18n.translate("snap.intersection");
        }
        const refPoint = trackingDatas[0].axis.location;
        return { view, point, info, shapes: [], refPoint, distance };
    }
    showTempLine(view, start, end) {
        const vector = end.sub(start);
        const normal = vector.normalize();
        if (!normal) return undefined;
        const distance = Math.min(vector.length() * 1e10, 1e20);
        const newEnd = start.add(normal.multiply(distance));
        const lineDats = EdgeMeshData.from(start, newEnd, VisualConfig.temporaryEdgeColor, LineType.Dash);
        return view.document.visual.context.displayMesh([lineDats]);
    }
    shapeIntersectTracking(data, trackingDatas) {
        if (data.shapes.length === 0 || data.shapes[0].shape.shapeType !== ShapeType.Edge) return undefined;
        const point = this.findIntersection(data, trackingDatas);
        if (!point) return undefined;
        const id = this.showTempLine(data.view, point.location, point.intersect);
        if (id === undefined) return undefined;
        this._tempLines.set(data.view, [id]);
        return {
            view: data.view,
            point: point.intersect,
            info: I18n.translate("snap.intersection"),
            shapes: [data.shapes[0]],
        };
    }
    findIntersection(data, trackingDatas) {
        const edge = data.shapes[0].shape;
        const points = [];
        trackingDatas.forEach((x) => {
            edge.intersect(x.axis).forEach((p) => {
                points.push({ intersect: p.point, location: x.axis.location });
            });
        });
        points.sort((p) => IView.screenDistance(data.view, data.mx, data.my, p.intersect));
        return points.at(0);
    }
    detectTracking(view, x, y) {
        const data = [];
        if (this.referencePoint) {
            const axies = this._axisTracking.getAxes(view, this.referencePoint());
            data.push(...this.getSnapedFromAxes(axies, view, x, y));
        }
        const objectTrackingRays = this._objectTracking.getTrackingRays(view);
        objectTrackingRays.forEach((a) => {
            data.push(...this.getSnapedFromAxes(a.axes, view, x, y, a.objectName));
        });
        return data;
    }
    getSnapedFromAxes(axes, view, x, y, snapedName) {
        let result = [];
        for (const axis of axes) {
            let distance = this.rayDistanceAtScreen(view, x, y, axis);
            if (distance < Config.instance.SnapDistance) {
                let ray = view.rayAt(x, y);
                let point = axis.nearestTo(ray);
                if (point.sub(axis.location).dot(axis.direction) < 0) continue;
                result.push({
                    axis,
                    distance,
                    point,
                    info: snapedName ?? axis.name,
                    isObjectTracking: snapedName !== undefined,
                });
            }
        }
        return result;
    }
    rayDistanceAtScreen(view, x, y, axis) {
        const start = view.worldToScreen(axis.location);
        const vector = new XY(x - start.x, y - start.y);
        if (vector.isEqualTo(XY.zero)) return 0;
        const end = view.worldToScreen(axis.location.add(axis.direction.multiply(100000)));
        if (start.distanceTo(end) < Precision.Float) return vector.length();
        const dir = end.sub(start).normalize();
        const dot = vector.dot(dir);
        return Math.sqrt(vector.lengthSq() - dot * dot);
    }
    removeDynamicObject() {
        this._tempLines.forEach((v, k) => {
            v.forEach((id) => {
                k.document.visual.context.removeMesh(id);
            });
        });
        this._tempLines.clear();
    }
    onSnapTypeChanged = (property) => {
        if (property === "snapType" || property === "enableSnapTracking" || property === "enableSnap") {
            this.removeDynamicObject();
            this._objectTracking.clear();
            this._axisTracking.clear();
        }
    };
    clear() {
        this.removeDynamicObject();
        this._axisTracking.clear();
        this._objectTracking.clear();
        Config.instance.removePropertyChanged(this.onSnapTypeChanged);
    }
}
