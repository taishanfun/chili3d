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
import { Config, MathUtils, Plane, Property, command } from "chili-core";
import { ViewUtils } from "chili-vis";
import { RectNode } from "../../bodys";
import { LengthAtPlaneStep, PointStep } from "../../step";
import { CreateCommand } from "../createCommand";
export var RectData;
(function (RectData) {
    function get(atPlane, start, end) {
        let plane = new Plane(start, atPlane.normal, atPlane.xvec);
        let vector = end.sub(start);
        let dx = vector.dot(plane.xvec);
        let dy = vector.dot(plane.yvec);
        return { plane, dx, dy, p1: start, p2: end };
    }
    RectData.get = get;
})(RectData || (RectData = {}));
export class RectCommandBase extends CreateCommand {
    getSteps() {
        return [
            new PointStep("prompt.pickFistPoint"),
            new LengthAtPlaneStep("prompt.pickNextPoint", this.nextSnapData),
        ];
    }
    nextSnapData = () => {
        const { point, view } = this.stepDatas[0];
        return {
            point: () => point,
            preview: this.previewRect,
            plane: (tmp) => this.findPlane(view, point, tmp),
            validator: this.handleValid,
            prompt: (snaped) => {
                let data = this.rectDataFromTemp(snaped.point);
                return `${data.dx.toFixed(2)}, ${data.dy.toFixed(2)}`;
            },
        };
    };
    handleValid = (end) => {
        const data = this.rectDataFromTemp(end);
        return data !== undefined && !MathUtils.anyEqualZero(data.dx, data.dy);
    };
    previewRect = (end) => {
        if (end === undefined) return [this.meshPoint(this.stepDatas[0].point)];
        const { plane, dx, dy } = this.rectDataFromTemp(end);
        return [
            this.meshPoint(this.stepDatas[0].point),
            this.meshPoint(end),
            this.meshCreatedShape("rect", plane, dx, dy),
        ];
    };
    rectDataFromTemp(tmp) {
        const { view, point } = this.stepDatas[0];
        const plane = Config.instance.dynamicWorkplane
            ? ViewUtils.raycastClosestPlane(view, point, tmp)
            : this.stepDatas[0].view.workplane.translateTo(point);
        return RectData.get(plane, point, tmp);
    }
    rectDataFromTwoSteps() {
        let rect;
        if (this.stepDatas[1].plane) {
            rect = RectData.get(this.stepDatas[1].plane, this.stepDatas[0].point, this.stepDatas[1].point);
        } else {
            rect = this.rectDataFromTemp(this.stepDatas[1].point);
        }
        return rect;
    }
}
let Rect = class Rect extends RectCommandBase {
    get isFace() {
        return this.getPrivateValue("isFace", false);
    }
    set isFace(value) {
        this.setProperty("isFace", value);
    }
    geometryNode() {
        const { plane, dx, dy } = this.rectDataFromTwoSteps();
        const node = new RectNode(this.document, plane, dx, dy);
        node.isFace = this.isFace;
        return node;
    }
};
__decorate([Property.define("option.command.isFace")], Rect.prototype, "isFace", null);
Rect = __decorate(
    [
        command({
            key: "create.rect",
            icon: "icon-rect",
        }),
    ],
    Rect,
);
export { Rect };
