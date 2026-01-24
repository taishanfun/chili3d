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
import { Matrix4, Plane, command } from "chili-core";
import { Dimension } from "../../snap";
import { PointStep } from "../../step";
import { TransformedCommand } from "./transformedCommand";
let Mirror = class Mirror extends TransformedCommand {
    transfrom(point) {
        const center = this.stepDatas[0].point;
        const xvec = this.stepDatas[0].view.workplane.normal;
        const yvec = point.sub(center);
        const normal = yvec.cross(xvec);
        const plane = new Plane(center, normal, xvec);
        return Matrix4.createMirrorWithPlane(plane);
    }
    getSteps() {
        let firstStep = new PointStep("prompt.pickFistPoint", undefined, true);
        let secondStep = new PointStep("prompt.pickNextPoint", this.getSecondPointData, true);
        return [firstStep, secondStep];
    }
    getSecondPointData = () => {
        return {
            refPoint: () => this.stepDatas[0].point,
            dimension: Dimension.D1D2,
            preview: this.mirrorPreview,
            validator: (p) => {
                const vec = p.sub(this.stepDatas[0].point);
                return vec.length() > 1e-3 && !vec.isParallelTo(this.stepDatas[0].view.workplane.normal);
            },
        };
    };
    mirrorPreview = (point) => {
        const p1 = this.meshPoint(this.stepDatas[0].point);
        if (!point) return [p1];
        const shape = this.transformPreview(point);
        const offset = point.sub(this.stepDatas[0].point).normalize().multiply(1e6);
        const line = this.getTempLineData(this.stepDatas[0].point.sub(offset), point.add(offset));
        return [p1, shape, line];
    };
};
Mirror = __decorate(
    [
        command({
            key: "modify.mirror",
            icon: "icon-mirror",
        }),
    ],
    Mirror,
);
export { Mirror };
