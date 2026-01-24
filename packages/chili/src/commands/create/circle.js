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
import { CircleNode } from "../../bodys";
import { LengthAtPlaneStep, PointStep } from "../../step";
import { CreateFaceableCommand } from "../createCommand";
let Circle = class Circle extends CreateFaceableCommand {
    getSteps() {
        let centerStep = new PointStep("prompt.pickCircleCenter");
        let radiusStep = new LengthAtPlaneStep("prompt.pickRadius", this.getRadiusData);
        return [centerStep, radiusStep];
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
    geometryNode() {
        const [p1, p2] = [this.stepDatas[0].point, this.stepDatas[1].point];
        const plane = this.stepDatas[1].plane ?? this.findPlane(this.stepDatas[1].view, p1, p2);
        const body = new CircleNode(this.document, plane.normal, p1, plane.projectDistance(p1, p2));
        body.isFace = this.isFace;
        return body;
    }
    circlePreview = (end) => {
        if (!end) return [this.meshPoint(this.stepDatas[0].point)];
        const { point, view } = this.stepDatas[0];
        const plane = this.findPlane(view, point, end);
        return [
            this.meshPoint(this.stepDatas[0].point),
            this.meshLine(point, end),
            this.meshCreatedShape("circle", plane.normal, point, plane.projectDistance(point, end)),
        ];
    };
};
Circle = __decorate(
    [
        command({
            key: "create.circle",
            icon: "icon-circle",
        }),
    ],
    Circle,
);
export { Circle };
