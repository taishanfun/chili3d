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
import { Precision, XYZ, command } from "chili-core";
import { SphereNode } from "../../bodys";
import { LengthAtPlaneStep, PointStep } from "../../step";
import { CreateCommand } from "../createCommand";
let Sphere = class Sphere extends CreateCommand {
    getSteps() {
        let centerStep = new PointStep("prompt.pickCircleCenter");
        let radiusStep = new LengthAtPlaneStep("prompt.pickRadius", this.getRadiusData);
        return [centerStep, radiusStep];
    }
    getRadiusData = () => {
        const point = this.stepDatas[0].point;
        return {
            point: () => point,
            preview: this.previewSphere,
            plane: () => this.stepDatas[0].view.workplane.translateTo(point),
            validator: (p) => p.distanceTo(point) > Precision.Distance,
        };
    };
    previewSphere = (end) => {
        if (!end) {
            return [this.meshPoint(this.stepDatas[0].point)];
        }
        const radius = this.stepDatas[0].point?.distanceTo(end);
        return [
            this.meshPoint(this.stepDatas[0].point),
            this.meshCreatedShape("circle", XYZ.unitZ, this.stepDatas[0].point, radius),
            this.meshCreatedShape("circle", XYZ.unitY, this.stepDatas[0].point, radius),
        ];
    };
    geometryNode() {
        const radius = this.stepDatas[0].point.distanceTo(this.stepDatas[1].point);
        return new SphereNode(this.document, this.stepDatas[0].point, radius);
    }
};
Sphere = __decorate(
    [
        command({
            key: "create.sphere",
            icon: "icon-sphere",
        }),
    ],
    Sphere,
);
export { Sphere };
