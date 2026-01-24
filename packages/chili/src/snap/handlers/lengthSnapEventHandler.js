// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Config, Precision } from "chili-core";
import { AxisSnap, ObjectSnap, PlaneSnap } from "../snaps";
import { TrackingSnap } from "../tracking";
import { SnapEventHandler } from "./snapEventHandler";
export class SnapLengthAtAxisHandler extends SnapEventHandler {
    constructor(document, controller, lengthData) {
        const objectSnap = new ObjectSnap(Config.instance.snapType, () => lengthData.point);
        const axisSnap = new AxisSnap(lengthData.point, lengthData.direction);
        super(document, controller, [objectSnap, axisSnap], lengthData);
    }
    getPointFromInput(view, text) {
        const dist = this.calculateDistance(Number(text));
        const point = this.calculatePoint(dist);
        return { view, point, distance: dist, shapes: [] };
    }
    calculateDistance(inputValue) {
        return this.shouldReverse() ? -inputValue : inputValue;
    }
    calculatePoint(distance) {
        return this.data.point.add(this.data.direction.multiply(distance));
    }
    shouldReverse() {
        return (
            this._snaped?.point &&
            this._snaped.point.sub(this.data.point).dot(this.data.direction) < -Precision.Distance
        );
    }
    inputError(text) {
        return Number.isNaN(Number(text)) ? "error.input.invalidNumber" : undefined;
    }
}
export class SnapLengthAtPlaneHandler extends SnapEventHandler {
    lengthData;
    workplane;
    constructor(document, controller, lengthData) {
        const objectSnap = new ObjectSnap(Config.instance.snapType, lengthData.point);
        const trackingSnap = new TrackingSnap(lengthData.point, false);
        const planeSnap = new PlaneSnap(lengthData.plane, lengthData.point);
        super(document, controller, [objectSnap, trackingSnap, planeSnap], lengthData);
        this.lengthData = lengthData;
    }
    setSnaped(view, event) {
        super.setSnaped(view, event);
        this.updateWorkplane();
    }
    updateWorkplane() {
        if (this._snaped) {
            this.workplane = this.lengthData.plane(this._snaped.point);
            this._snaped.plane = this.workplane;
        }
    }
    getPointFromInput(view, text) {
        const plane = this.workplane ?? view.workplane;
        const point = this.calculatePoint(text, plane);
        return { point, view, shapes: [], plane };
    }
    calculatePoint(text, plane) {
        const numbers = text.split(",").map(Number);
        return numbers.length === 1
            ? this.calculatePointFromDistance(numbers[0])
            : this.calculatePointFromCoordinates(numbers, plane);
    }
    calculatePointFromDistance(distance) {
        const vector = this._snaped?.point.sub(this.data.point()).normalize();
        return this.data.point().add(vector.multiply(distance));
    }
    calculatePointFromCoordinates(coords, plane) {
        return this.data.point().add(plane.xvec.multiply(coords[0])).add(plane.yvec.multiply(coords[1]));
    }
    inputError(text) {
        const numbers = text.split(",").map(Number);
        if (numbers.some(Number.isNaN) || (numbers.length !== 1 && numbers.length !== 2)) {
            return "error.input.invalidNumber";
        }
        return undefined;
    }
}
