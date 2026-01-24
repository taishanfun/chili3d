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
import { ICurve, Property, Ray, ShapeType, command } from "chili-core";
import { RevolvedNode } from "../../bodys";
import { SelectShapeStep } from "../../step/selectStep";
import { CreateCommand } from "../createCommand";
let Revolve = class Revolve extends CreateCommand {
    get angle() {
        return this.getPrivateValue("angle", 360);
    }
    set angle(value) {
        this.setProperty("angle", value);
    }
    geometryNode() {
        const shape = this.transformdFirstShape(this.stepDatas[0], false);
        const edge = this.stepDatas[1].shapes[0].shape.curve.basisCurve;
        const transform = this.stepDatas[1].shapes[0].transform;
        const axis = new Ray(transform.ofPoint(edge.value(0)), transform.ofVector(edge.direction));
        return new RevolvedNode(this.document, shape, axis, this.angle);
    }
    getSteps() {
        return [
            new SelectShapeStep(ShapeType.Edge | ShapeType.Face | ShapeType.Wire, "prompt.select.shape"),
            new SelectShapeStep(ShapeType.Edge, "prompt.select.edges", {
                shapeFilter: new LineFilter(),
                keepSelection: true,
            }),
        ];
    }
};
__decorate([Property.define("common.angle")], Revolve.prototype, "angle", null);
Revolve = __decorate(
    [
        command({
            key: "create.revol",
            icon: "icon-revolve",
        }),
    ],
    Revolve,
);
export { Revolve };
class LineFilter {
    allow(shape) {
        if (shape.shapeType === ShapeType.Edge) {
            let edge = shape;
            let curve = edge.curve.basisCurve;
            return ICurve.isLine(curve);
        }
        return false;
    }
}
