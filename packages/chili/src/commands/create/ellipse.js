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
import { EllipseNode } from "../../bodys/ellipse";
import { LengthAtAxisStep, LengthAtPlaneStep, PointStep } from "../../step";
import { CreateFaceableCommand } from "../createCommand";
let Ellipse = class Ellipse extends CreateFaceableCommand {
    getSteps() {
        let centerStep = new PointStep("prompt.pickCircleCenter");
        let radiusStepX = new LengthAtPlaneStep("prompt.pickRadius", this.getRadius1Data);
        let radiusStepY = new LengthAtAxisStep("prompt.pickRadius", this.getRadius2Data);
        return [centerStep, radiusStepX, radiusStepY];
    }
    getRadius1Data = () => {
        const point = this.stepDatas[0].point;
        return {
            point: () => point,
            preview: this.previewCircle,
            plane: (tmp) => this.findPlane(this.stepDatas[0].view, point, tmp),
            validator: this.validatePoint,
        };
    };
    validatePoint = (point) => {
        const center = this.stepDatas[0].point;
        if (point.distanceTo(center) < Precision.Distance) return false;
        const plane = this.findPlane(this.stepDatas[0].view, center, point);
        return point.sub(center).isParallelTo(plane.normal) === false;
    };
    previewCircle = (end) => {
        if (end === undefined) return [this.meshPoint(this.stepDatas[0].point)];
        const plane = this.findPlane(this.stepDatas[0].view, this.stepDatas[0].point, end);
        return [
            this.meshPoint(this.stepDatas[0].point),
            this.meshPoint(end),
            this.meshCreatedShape(
                "circle",
                plane.normal,
                this.stepDatas[0].point,
                end.distanceTo(this.stepDatas[0].point),
            ),
        ];
    };
    getRadius2Data = () => {
        const point = this.stepDatas[0].point;
        const plane = this.stepDatas[1].plane;
        const direction = plane.normal.cross(this.stepDatas[1].point.sub(point)).normalize();
        return {
            point: point,
            preview: this.ellipsePreview,
            direction,
            validator: this.validatePoint,
        };
    };
    geometryNode() {
        const [p0, p1, p2] = [this.stepDatas[0].point, this.stepDatas[1].point, this.stepDatas[2].point];
        const plane = this.stepDatas[1].plane;
        const d1 = plane.projectDistance(p0, p1);
        const d2 = plane.projectDistance(p0, p2);
        const body = new EllipseNode(this.document, plane.normal, p0, p1.sub(p0), d1, d2 > d1 ? d1 : d2);
        return body;
    }
    ellipsePreview = (point) => {
        if (!point) return this.previewCircle(this.stepDatas[1].point);
        return [
            this.meshPoint(this.stepDatas[0].point),
            this.meshPoint(this.stepDatas[1].point),
            this.createEllipse(point),
        ];
    };
    createEllipse(p2) {
        const p0 = this.stepDatas[0].point;
        const p1 = this.stepDatas[1].point;
        const plane = this.stepDatas[1].plane;
        const d1 = plane.projectDistance(p0, p1);
        const d2 = plane.projectDistance(p0, p2);
        return this.meshCreatedShape("ellipse", plane.normal, p0, p1.sub(p0), d1, d2 > d1 ? d1 : d2);
    }
};
Ellipse = __decorate(
    [
        command({
            key: "create.ellipse",
            icon: "icon-ellipse",
        }),
    ],
    Ellipse,
);
export { Ellipse };
