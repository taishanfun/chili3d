// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Precision } from "chili-core";
import { SnapLengthAtAxisHandler, SnapLengthAtPlaneHandler } from "../snap";
import { SnapStep } from "./step";
export class LengthAtAxisStep extends SnapStep {
    getEventHandler(document, controller, data) {
        return new SnapLengthAtAxisHandler(document, controller, data);
    }
    validator(data, point) {
        return Math.abs(point.sub(data.point).dot(data.direction)) > Precision.Distance;
    }
}
export class LengthAtPlaneStep extends SnapStep {
    getEventHandler(document, controller, data) {
        return new SnapLengthAtPlaneHandler(document, controller, data);
    }
    validator(data, point) {
        const pointAtPlane = data.plane(point).project(point);
        return pointAtPlane.distanceTo(data.point()) > Precision.Distance;
    }
}
