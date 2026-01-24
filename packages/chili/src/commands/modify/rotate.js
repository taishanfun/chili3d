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
import { Matrix4, Precision, command } from "chili-core";
import { Dimension } from "../../snap";
import { AngleStep, LengthAtPlaneStep, PointStep } from "../../step";
import { TransformedCommand } from "./transformedCommand";
let Rotate = class Rotate extends TransformedCommand {
    transfrom(point) {
        const normal = this.stepDatas[1].plane.normal;
        const center = this.stepDatas[0].point;
        const angle = this.getAngle(point);
        return Matrix4.fromAxisRad(center, normal, angle);
    }
    getSteps() {
        let firstStep = new PointStep("prompt.pickFistPoint", undefined, true);
        let secondStep = new LengthAtPlaneStep("prompt.pickNextPoint", this.getSecondPointData, true);
        let thirdStep = new AngleStep(
            "prompt.pickNextPoint",
            () => this.stepDatas[0].point,
            () => this.stepDatas[1].point,
            this.getThirdPointData,
            true,
        );
        return [firstStep, secondStep, thirdStep];
    }
    getSecondPointData = () => {
        const { point, view } = this.stepDatas[0];
        return {
            point: () => point,
            preview: this.circlePreview,
            plane: (p) => this.findPlane(view, point, p),
            validator: (p) => {
                if (p.distanceTo(point) < Precision.Distance) return false;
                return p.sub(point).isParallelTo(this.stepDatas[0].view.workplane.normal) === false;
            },
        };
    };
    circlePreview = (end) => {
        const visualCenter = this.meshPoint(this.stepDatas[0].point);
        if (!end) return [visualCenter];
        const { point, view } = this.stepDatas[0];
        const plane = this.findPlane(view, point, end);
        return [
            visualCenter,
            this.meshLine(this.stepDatas[0].point, end),
            this.meshCreatedShape("circle", plane.normal, point, plane.projectDistance(point, end)),
        ];
    };
    getThirdPointData = () => {
        return {
            dimension: Dimension.D1D2,
            preview: this.anglePreview,
            plane: () => this.stepDatas[1].plane,
            validator: (p) => {
                return (
                    p.distanceTo(this.stepDatas[0].point) > 1e-3 &&
                    p.distanceTo(this.stepDatas[1].point) > 1e-3
                );
            },
        };
    };
    getAngle(point) {
        const normal = this.stepDatas[1].plane.normal;
        const center = this.stepDatas[0].point;
        const p1 = this.stepDatas[1].point;
        const v1 = p1.sub(center);
        const v2 = point.sub(center);
        return v1.angleOnPlaneTo(v2, normal);
    }
    anglePreview = (point) => {
        point = point ?? this.stepDatas[1].point;
        const result = [
            this.transformPreview(point),
            this.meshPoint(this.stepDatas[0].point),
            this.meshPoint(this.stepDatas[1].point),
            this.getRayData(this.stepDatas[1].point),
            this.getRayData(point),
        ];
        const angle = this.getAngle(point);
        if (Math.abs(angle) > Precision.Angle) {
            result.push(
                this.meshCreatedShape(
                    "arc",
                    this.stepDatas[1].plane.normal,
                    this.stepDatas[0].point,
                    this.stepDatas[1].point,
                    (angle * 180) / Math.PI,
                ),
            );
        }
        return result;
    };
    getRayData(end) {
        let center = this.stepDatas[0].point;
        let rayEnd = center.add(end.sub(center).normalize().multiply(1e6));
        return this.getTempLineData(center, rayEnd);
    }
};
Rotate = __decorate(
    [
        command({
            key: "modify.rotate",
            icon: "icon-rotate",
        }),
    ],
    Rotate,
);
export { Rotate };
