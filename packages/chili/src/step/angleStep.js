// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Precision } from "chili-core";
import { AngleSnapEventHandler, Dimension } from "../snap";
import { SnapStep } from "./step";
function defaultSnapedData() {
    return {
        dimension: Dimension.D1D2D3,
    };
}
export class AngleStep extends SnapStep {
    handleCenter;
    handleP1;
    constructor(tip, handleCenter, handleP1, handleP2Data = defaultSnapedData, keepSelected = false) {
        super(tip, handleP2Data, keepSelected);
        this.handleCenter = handleCenter;
        this.handleP1 = handleP1;
    }
    getEventHandler(document, controller, data) {
        return new AngleSnapEventHandler(document, controller, this.handleCenter, this.handleP1(), data);
    }
    validator(data, point) {
        return data.refPoint === undefined || data.refPoint().distanceTo(point) > Precision.Distance;
    }
}
