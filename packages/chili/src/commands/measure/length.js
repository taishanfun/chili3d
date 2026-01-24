// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
var __decorate =
    (this && this.__decorate) ||
    function (decorators, target, key, desc) {
        var c = arguments.length,
            r =
                c < 3
                    ? target
                    : desc === null
                      ? (desc = Object.getOwnPropertyDescriptor(target, key))
                      : desc,
            d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if ((d = decorators[i]))
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
import { command, Precision, VisualConfig } from "chili-core";
import { Dimension } from "../../snap";
import { PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";
let LengthMeasure = class LengthMeasure extends MultistepCommand {
    getSteps() {
        let firstStep = new PointStep("prompt.pickFistPoint");
        let secondStep = new PointStep("prompt.pickNextPoint", this.getSecondPointData);
        return [firstStep, secondStep];
    }
    getSecondPointData = () => {
        return {
            refPoint: () => this.stepDatas[0].point,
            dimension: Dimension.D1D2D3,
            validator: (point) => {
                return this.stepDatas[0].point.distanceTo(point) > Precision.Distance;
            },
            preview: this.linePreview,
        };
    };
    linePreview = (point) => {
        if (!point) {
            return [this.meshPoint(this.stepDatas[0].point)];
        }
        return [this.meshPoint(this.stepDatas[0].point), this.meshLine(this.stepDatas[0].point, point)];
    };
    executeMainTask() {
        const firstPoint = this.stepDatas[0].point;
        const secondPoint = this.stepDatas[1].point;
        const distance = firstPoint.distanceTo(secondPoint);
        const visualId = this.document.visual.context.displayMesh([
            this.meshPoint(firstPoint),
            this.meshLine(firstPoint, secondPoint, VisualConfig.highlightEdgeColor, 3),
            this.meshPoint(secondPoint),
        ]);
        this.application.activeView?.htmlText(
            distance.toFixed(2),
            firstPoint.add(secondPoint).multiply(0.5),
            {
                onDispose: () => {
                    this.document.visual.context.removeMesh(visualId);
                },
            },
        );
    }
};
LengthMeasure = __decorate(
    [
        command({
            key: "measure.length",
            icon: "icon-measureLength",
        }),
    ],
    LengthMeasure,
);
export { LengthMeasure };
