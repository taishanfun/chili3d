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
import { command } from "chili-core";
import { PyramidNode } from "../../bodys";
import { LengthAtAxisStep } from "../../step";
import { RectCommandBase } from "./rect";
let Pyramid = class Pyramid extends RectCommandBase {
    getSteps() {
        let steps = super.getSteps();
        let third = new LengthAtAxisStep("prompt.pickNextPoint", this.getHeightStepData);
        return [...steps, third];
    }
    getHeightStepData = () => {
        const plane = this.stepDatas[1].plane;
        if (plane === undefined) {
            throw new Error("plane is undefined, please report bug");
        }
        const point = this.stepDatas[1].point.add(this.stepDatas[0].point).multiply(0.5);
        return {
            point,
            direction: plane.normal,
            preview: this.previewPyramid,
        };
    };
    previewPyramid = (end) => {
        if (!end) {
            return this.previewRect(this.stepDatas[1].point);
        }
        const data = this.rectDataFromTwoSteps();
        return [
            this.meshPoint(this.stepDatas[0].point),
            this.meshPoint(this.stepDatas[1].point),
            this.meshCreatedShape("pyramid", data.plane, data.dx, data.dy, this.getHeight(data.plane, end)),
        ];
    };
    geometryNode() {
        const rect = this.rectDataFromTwoSteps();
        const dz = this.getHeight(rect.plane, this.stepDatas[2].point);
        return new PyramidNode(this.document, rect.plane, rect.dx, rect.dy, dz);
    }
    getHeight(plane, point) {
        return point.sub(plane.origin).dot(plane.normal);
    }
};
Pyramid = __decorate(
    [
        command({
            key: "create.pyramid",
            icon: "icon-pyramid",
        }),
    ],
    Pyramid,
);
export { Pyramid };
