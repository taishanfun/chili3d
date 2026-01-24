// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { I18n } from "chili-core";
import { Axis } from "./axis";
import { TrackingBase } from "./trackingBase";
export class AxisTracking extends TrackingBase {
    axies = new Map();
    constructor(trackingZ) {
        super(trackingZ);
    }
    getAxes(view, referencePoint, angle = undefined) {
        if (!this.axies.has(view)) {
            this.axies.set(view, this.initAxes(view.workplane, referencePoint, angle));
        }
        return this.axies.get(view);
    }
    initAxes(plane, referencePoint, angle) {
        if (angle === undefined) {
            return Axis.getAxiesAtPlane(referencePoint, plane, this.trackingZ);
        }
        const result = [];
        let testAngle = 0;
        while (testAngle < 360) {
            let direction = plane.xvec.rotate(plane.normal, (testAngle / 180) * Math.PI);
            result.push(new Axis(referencePoint, direction, `${testAngle} °`));
            testAngle += angle;
        }
        if (this.trackingZ) {
            result.push(new Axis(referencePoint, plane.normal, I18n.translate("axis.z")));
            result.push(new Axis(referencePoint, plane.normal.reverse(), I18n.translate("axis.z")));
        }
        return result;
    }
    clear() {
        super.clear();
        this.axies.clear();
    }
}
