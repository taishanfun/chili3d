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
import { EdgeMeshData, LineType, Precision, VisualConfig, command } from "chili-core";
import { ConeNode } from "../../bodys";
import { LengthAtAxisStep, LengthAtPlaneStep, PointStep } from "../../step";
import { CreateCommand } from "../createCommand";
let Cone = class Cone extends CreateCommand {
    getSteps() {
        let centerStep = new PointStep("prompt.pickCircleCenter");
        let radiusStep = new LengthAtPlaneStep("prompt.pickRadius", this.getRadiusData);
        let third = new LengthAtAxisStep("prompt.pickNextPoint", this.getHeightStepData);
        return [centerStep, radiusStep, third];
    }
    getRadiusData = () => {
        const point = this.stepDatas[0].point;
        return {
            point: () => point,
            preview: this.circlePreview,
            plane: (p) => this.findPlane(this.stepDatas[0].view, point, p),
            validator: (p) => {
                if (p.distanceTo(point) < Precision.Distance) return false;
                const plane = this.findPlane(this.stepDatas[0].view, point, p);
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
            preview: this.previewCone,
        };
    };
    previewCone = (end) => {
        if (!end) {
            return this.circlePreview(this.stepDatas[1].point);
        }
        const center = this.stepDatas[0].point;
        const p1Visual = this.meshPoint(center);
        const plane = this.stepDatas[1].plane;
        const radius = plane.projectDistance(center, this.stepDatas[1].point);
        const up = center.add(plane.normal.multiply(this.getHeight(plane, end)));
        return [
            p1Visual,
            this.meshCreatedShape("circle", plane.normal, center, radius),
            this.meshLine(center.add(plane.xvec.multiply(radius)), up),
            this.meshLine(center.add(plane.xvec.multiply(-radius)), up),
            this.meshLine(center.add(plane.yvec.multiply(radius)), up),
            this.meshLine(center.add(plane.yvec.multiply(-radius)), up),
        ];
    };
    meshLine(start, end) {
        return EdgeMeshData.from(start, end, VisualConfig.defaultEdgeColor, LineType.Solid);
    }
    geometryNode() {
        const plane = this.stepDatas[1].plane;
        const radius = plane.projectDistance(this.stepDatas[0].point, this.stepDatas[1].point);
        const height = this.getHeight(plane, this.stepDatas[2].point);
        return new ConeNode(
            this.document,
            height < 0 ? plane.normal.reverse() : plane.normal,
            this.stepDatas[0].point,
            radius,
            Math.abs(height),
        );
    }
    getHeight(plane, point) {
        return point.sub(this.stepDatas[0].point).dot(plane.normal);
    }
};
Cone = __decorate(
    [
        command({
            key: "create.cone",
            icon: "icon-cone",
        }),
    ],
    Cone,
);
export { Cone };
