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
import { Plane, PlaneAngle, Precision, command } from "chili-core";
import { ArcNode } from "../../bodys/arc";
import { Dimension } from "../../snap";
import { AngleStep, LengthAtPlaneStep, PointStep } from "../../step";
import { CreateCommand } from "../createCommand";
let Arc = class Arc extends CreateCommand {
    _planeAngle;
    getSteps() {
        return [
            new PointStep("prompt.pickCircleCenter"),
            new LengthAtPlaneStep("prompt.pickRadius", this.getRadiusData),
            new AngleStep(
                "prompt.pickNextPoint",
                () => this.stepDatas[0].point,
                () => this.stepDatas[1].point,
                this.getAngleData,
            ),
        ];
    }
    getRadiusData = () => {
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
    getAngleData = () => {
        const [center, p1] = [this.stepDatas[0].point, this.stepDatas[1].point];
        const plane = this.stepDatas[1].plane ?? this.findPlane(this.stepDatas[1].view, center, p1);
        const points = [this.meshPoint(center), this.meshPoint(p1)];
        this._planeAngle = new PlaneAngle(new Plane(center, plane.normal, p1.sub(center)));
        return {
            dimension: Dimension.D1D2,
            preview: (point) => this.anglePreview(point, center, p1, points),
            plane: () => plane,
            validators: [this.angleValidator(center, plane)],
        };
    };
    anglePreview(point, center, p1, points) {
        point = point ?? p1;
        this._planeAngle.movePoint(point);
        const result = [...points];
        if (Math.abs(this._planeAngle.angle) > Precision.Angle) {
            result.push(
                this.meshCreatedShape(
                    "arc",
                    this._planeAngle.plane.normal,
                    center,
                    p1,
                    this._planeAngle.angle,
                ),
            );
        }
        return result;
    }
    angleValidator(center, plane) {
        return (p) =>
            p.distanceTo(center) >= Precision.Distance && !p.sub(center).isParallelTo(plane.normal);
    }
    geometryNode() {
        const [p0, p1] = [this.stepDatas[0].point, this.stepDatas[1].point];
        const plane = this.stepDatas[1].plane ?? this.findPlane(this.stepDatas[1].view, p0, p1);
        this._planeAngle?.movePoint(this.stepDatas[2].point);
        return new ArcNode(this.document, plane.normal, p0, p1, this._planeAngle.angle);
    }
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
};
Arc = __decorate(
    [
        command({
            key: "create.arc",
            icon: "icon-arc",
        }),
    ],
    Arc,
);
export { Arc };
