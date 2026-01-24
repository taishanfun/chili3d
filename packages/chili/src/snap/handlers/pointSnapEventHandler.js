// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Config, XYZ } from "chili-core";
import { Dimension } from "../dimension";
import { AxisSnap, ObjectSnap, PlaneSnap, PointOnCurveSnap, WorkplaneSnap } from "../snaps";
import { TrackingSnap } from "../tracking";
import { SnapEventHandler } from "./snapEventHandler";
export class PointSnapEventHandler extends SnapEventHandler {
    constructor(document, controller, pointData) {
        super(document, controller, [], pointData);
        this.snaps.push(...this.getInitSnaps(pointData));
    }
    getInitSnaps(pointData) {
        const objectSnap = new ObjectSnap(Config.instance.snapType, pointData.refPoint);
        const workplaneSnap = pointData.plane
            ? new PlaneSnap(pointData.plane, pointData.refPoint)
            : new WorkplaneSnap(pointData.refPoint);
        const trackingSnap = new TrackingSnap(pointData.refPoint, true);
        return [objectSnap, trackingSnap, workplaneSnap];
    }
    getPointFromInput(view, text) {
        const [dims, isAbsolute] = this.parseInputDimensions(text);
        const refPoint = this.getRefPoint() ?? XYZ.zero;
        const result = { point: refPoint, view, shapes: [] };
        if (isAbsolute) {
            result.point = new XYZ(dims[0], dims[1], dims[2]);
        } else if (dims.length === 1 && this._snaped?.point) {
            result.point = this.calculatePointFromDistance(refPoint, dims[0]);
        } else if (dims.length > 1) {
            result.point = this.calculatePointFromCoordinates(refPoint, dims);
        }
        return result;
    }
    parseInputDimensions(text) {
        const isAbsolute = text.startsWith("#");
        if (isAbsolute) {
            text = text.slice(1);
        }
        return [text.split(",").map(Number), isAbsolute];
    }
    calculatePointFromDistance(refPoint, distance) {
        const vector = this._snaped.point.sub(refPoint).normalize();
        return refPoint.add(vector.multiply(distance));
    }
    calculatePointFromCoordinates(refPoint, dims) {
        const plane = this.data.plane?.() ?? this.snaped.view.workplane;
        let point = refPoint.add(plane.xvec.multiply(dims[0])).add(plane.yvec.multiply(dims[1]));
        if (dims.length === 3) {
            point = point.add(plane.normal.multiply(dims[2]));
        }
        return point;
    }
    inputError(text) {
        const [dims, isAbsolute] = this.parseInputDimensions(text);
        const dimension = Dimension.from(dims.length);
        if (isAbsolute && dims.length !== 3) return "error.input.threeNumberCanBeInput";
        if (!this.isValidDimension(dimension)) return "error.input.unsupportedInputs";
        if (this.hasInvalidNumbers(dims)) return "error.input.invalidNumber";
        if (this.requiresThreeNumbers(dims)) return "error.input.threeNumberCanBeInput";
        if (this.isInvalidSingleNumber(dims)) return "error.input.cannotInputANumber";
        return undefined;
    }
    isValidDimension(dimension) {
        return Dimension.contains(this.data.dimension, dimension);
    }
    hasInvalidNumbers(dims) {
        return dims.some(Number.isNaN);
    }
    requiresThreeNumbers(dims) {
        const refPoint = this.getRefPoint();
        return refPoint === undefined && dims.length !== 3;
    }
    isInvalidSingleNumber(dims) {
        const refPoint = this.getRefPoint();
        return dims.length === 1 && refPoint && (!this._snaped || this._snaped.point.isEqualTo(refPoint));
    }
    getRefPoint() {
        return this.data.refPoint?.() ?? this._snaped?.refPoint;
    }
}
export class SnapPointOnCurveEventHandler extends SnapEventHandler {
    constructor(document, controller, pointData) {
        const objectSnap = new ObjectSnap(Config.instance.snapType);
        const snap = new PointOnCurveSnap(pointData);
        const workplaneSnap = new WorkplaneSnap();
        super(document, controller, [objectSnap, snap, workplaneSnap], pointData);
    }
    getPointFromInput(view, text) {
        const length = this.data.curve.length();
        const parameter = Number(text) / length;
        return { point: this.data.curve.value(parameter), view, shapes: [] };
    }
    inputError(text) {
        return Number.isNaN(Number(text)) ? "error.input.invalidNumber" : undefined;
    }
}
export class SnapPointOnAxisEventHandler extends SnapEventHandler {
    constructor(document, controller, pointData) {
        const objectSnap = new ObjectSnap(Config.instance.snapType);
        const snap = new AxisSnap(pointData.ray.location, pointData.ray.direction);
        super(document, controller, [objectSnap, snap], pointData);
    }
    getPointFromInput(view, text) {
        const parameter = Number(text);
        const point = this.data.ray.location.add(this.data.ray.direction.multiply(parameter));
        return { point, view, shapes: [] };
    }
    inputError(text) {
        return Number.isNaN(Number(text)) ? "error.input.invalidNumber" : undefined;
    }
}
export class SnapPointPlaneEventHandler extends PointSnapEventHandler {
    getInitSnaps(pointData) {
        if (!pointData.plane) throw new Error("plane is required");
        return [new ObjectSnap(Config.instance.snapType), new PlaneSnap(pointData.plane)];
    }
    findSnapPoint(shapeType, view, event) {
        super.findSnapPoint(shapeType, view, event);
        if (this._snaped?.point) {
            this._snaped.point = this.data.plane().project(this._snaped.point);
        }
    }
}
