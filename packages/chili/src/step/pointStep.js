// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Precision } from "chili-core";
import {
    Dimension,
    PointSnapEventHandler,
    SnapPointOnAxisEventHandler,
    SnapPointOnCurveEventHandler,
    SnapPointPlaneEventHandler,
} from "../snap";
import { SnapStep } from "./step";
function defaultSnapedData() {
    return { dimension: Dimension.D1 | Dimension.D1D2D3 };
}
export class PointStep extends SnapStep {
    constructor(tip, handleData = defaultSnapedData, keepSelected = false) {
        super(tip, handleData, keepSelected);
    }
    getEventHandler(document, controller, data) {
        return new PointSnapEventHandler(document, controller, data);
    }
    validator(data, point) {
        return data.refPoint === undefined || data.refPoint().distanceTo(point) > Precision.Distance;
    }
}
export class PointOnCurveStep extends SnapStep {
    constructor(tip, handleData, keepSelected = false) {
        super(tip, handleData, keepSelected);
    }
    validator(data, point) {
        return true;
    }
    getEventHandler(document, controller, data) {
        return new SnapPointOnCurveEventHandler(document, controller, data);
    }
}
export class PointOnAxisStep extends SnapStep {
    constructor(tip, handleData, keepSelected = false) {
        super(tip, handleData, keepSelected);
    }
    validator(data, point) {
        return true;
    }
    getEventHandler(document, controller, data) {
        return new SnapPointOnAxisEventHandler(document, controller, data);
    }
}
export class PointOnPlaneStep extends SnapStep {
    constructor(tip, handleData, keepSelected = false) {
        super(tip, handleData, keepSelected);
    }
    validator(data, point) {
        return true;
    }
    getEventHandler(document, controller, data) {
        return new SnapPointPlaneEventHandler(document, controller, data);
    }
}
