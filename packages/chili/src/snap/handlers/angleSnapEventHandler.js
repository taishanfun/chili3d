// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Config, Plane, PlaneAngle } from "chili-core";
import { ObjectSnap, PlaneSnap } from "../snaps";
import { TrackingSnap } from "../tracking";
import { SnapEventHandler } from "./snapEventHandler";
export class AngleSnapEventHandler extends SnapEventHandler {
    center;
    planeAngle;
    plane;
    constructor(document, controller, center, p1, snapPointData) {
        if (!snapPointData.plane) throw new Error("AngleSnapEventHandler: no plane");
        const objectSnap = new ObjectSnap(Config.instance.snapType, snapPointData.refPoint);
        const workplaneSnap = new PlaneSnap(snapPointData.plane, center);
        const trackingSnap = new TrackingSnap(center, false);
        super(document, controller, [objectSnap, trackingSnap, workplaneSnap], snapPointData);
        this.center = center;
        const xvec = p1.sub(center()).normalize();
        this.plane = new Plane(center(), snapPointData.plane().normal, xvec);
        this.planeAngle = new PlaneAngle(this.plane);
        snapPointData.prompt ??= this.formatAnglePrompt;
    }
    formatAnglePrompt = (snaped) => {
        if (!snaped?.point) return "";
        this.planeAngle.movePoint(snaped.point);
        return `${this.planeAngle.angle.toFixed(2)} °`;
    };
    inputError(text) {
        const angle = Number.parseFloat(text);
        return isNaN(angle) ? "error.input.invalidNumber" : undefined;
    }
    getPointFromInput(view, text) {
        const angle = (Number.parseFloat(text) * Math.PI) / 180;
        const vec = this.plane.xvec.rotate(this.plane.normal, angle);
        const point = this.center().add(vec);
        return { point, view, shapes: [], plane: this.plane };
    }
}
