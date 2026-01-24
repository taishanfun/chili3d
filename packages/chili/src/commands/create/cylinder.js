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
import { Precision, command } from "chili-core";
import { CylinderNode } from "../../bodys";
import { LengthAtAxisStep, LengthAtPlaneStep, PointStep } from "../../step";
import { CreateCommand } from "../createCommand";
let Cylinder = class Cylinder extends CreateCommand {
    getSteps() {
        let centerStep = new PointStep("prompt.pickCircleCenter");
        let radiusStep = new LengthAtPlaneStep("prompt.pickRadius", this.getRadiusData);
        let third = new LengthAtAxisStep("prompt.pickNextPoint", this.getHeightStepData);
        return [centerStep, radiusStep, third];
    }
    getRadiusData = () => {
        const { point, view } = this.stepDatas[0];
        return {
            point: () => point,
            preview: this.circlePreview,
            plane: (tmp) => this.findPlane(view, point, tmp),
            validator: (p) => {
                if (p.distanceTo(point) < Precision.Distance) return false;
                const plane = this.findPlane(view, point, p);
                return p.sub(point).isParallelTo(plane.normal) === false;
            },
        };
    };
    circlePreview = (point) => {
        if (!point) return [this.meshPoint(this.stepDatas[0].point)];
        const start = this.stepDatas[0].point;
        const plane = this.findPlane(this.stepDatas[0].view, start, point);
        return [
            this.meshPoint(this.stepDatas[0].point),
            this.meshLine(start, point),
            this.meshCreatedShape("circle", plane.normal, start, plane.projectDistance(start, point)),
        ];
    };
    getHeightStepData = () => {
        return {
            point: this.stepDatas[0].point,
            direction: this.stepDatas[1].plane.normal,
            preview: this.previewCylinder,
            validator: (p) => {
                return Math.abs(this.getHeight(this.stepDatas[1].plane, p)) > 0.001;
            },
        };
    };
    previewCylinder = (end) => {
        if (!end) {
            return this.circlePreview(this.stepDatas[1].point);
        }
        const plane = this.stepDatas[1].plane;
        const radius = plane.projectDistance(this.stepDatas[0].point, this.stepDatas[1].point);
        const height = this.getHeight(plane, end);
        return [
            this.meshPoint(this.stepDatas[0].point),
            this.meshCreatedShape(
                "cylinder",
                height < 0 ? plane.normal.reverse() : plane.normal,
                this.stepDatas[0].point,
                radius,
                Math.abs(height),
            ),
        ];
    };
    geometryNode() {
        const plane = this.stepDatas[1].plane;
        const radius = plane.projectDistance(this.stepDatas[0].point, this.stepDatas[1].point);
        const dz = this.getHeight(plane, this.stepDatas[2].point);
        return new CylinderNode(
            this.document,
            dz < 0 ? plane.normal.reverse() : plane.normal,
            this.stepDatas[0].point,
            radius,
            Math.abs(dz),
        );
    }
    getHeight(plane, point) {
        return point.sub(this.stepDatas[0].point).dot(plane.normal);
    }
};
Cylinder = __decorate(
    [
        command({
            key: "create.cylinder",
            icon: "icon-cylinder",
        }),
    ],
    Cylinder,
);
export { Cylinder };
