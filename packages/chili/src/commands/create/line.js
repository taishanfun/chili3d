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
import { Precision, Property, command } from "chili-core";
import { LineNode } from "../../bodys";
import { Dimension } from "../../snap";
import { PointStep } from "../../step";
import { CreateCommand } from "../createCommand";
let Line = class Line extends CreateCommand {
    get isContinue() {
        return this.getPrivateValue("isContinue", false);
    }
    set isContinue(value) {
        this.setProperty("isContinue", value);
    }
    geometryNode() {
        return new LineNode(this.document, this.stepDatas[0].point, this.stepDatas[1].point);
    }
    getSteps() {
        let firstStep = new PointStep("prompt.pickFistPoint");
        let secondStep = new PointStep("prompt.pickNextPoint", this.getSecondPointData);
        return [firstStep, secondStep];
    }
    resetStepDatas() {
        if (this.isContinue) {
            this.stepDatas[0] = this.stepDatas[1];
            this.stepDatas.length = 1;
        } else {
            this.stepDatas.length = 0;
        }
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
};
__decorate(
    [
        Property.define("option.command.isConnected", {
            dependencies: [{ property: "repeatOperation", value: true }],
        }),
    ],
    Line.prototype,
    "isContinue",
    null,
);
Line = __decorate(
    [
        command({
            key: "create.line",
            icon: "icon-line",
        }),
    ],
    Line,
);
export { Line };
