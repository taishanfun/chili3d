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
import { Property, ShapeType, command } from "chili-core";
import { SweepedNode } from "../../bodys";
import { SelectShapeStep } from "../../step/selectStep";
import { CreateCommand } from "../createCommand";
let Sweep = class Sweep extends CreateCommand {
    get round() {
        return this.getPrivateValue("round", false);
    }
    set round(value) {
        this.setProperty("round", value);
    }
    geometryNode() {
        const path = this.transformdFirstShape(this.stepDatas[0], false);
        const shapes = this.transformdShapes(this.stepDatas[1], false);
        return new SweepedNode(this.document, shapes, path, this.round);
    }
    getSteps() {
        return [
            new SelectShapeStep(ShapeType.Edge | ShapeType.Wire, "prompt.select.path"),
            new SelectShapeStep(ShapeType.Edge | ShapeType.Wire, "prompt.select.section", {
                keepSelection: true,
                multiple: true,
            }),
        ];
    }
};
__decorate([Property.define("option.command.isRoundCorner")], Sweep.prototype, "round", null);
Sweep = __decorate(
    [
        command({
            key: "create.sweep",
            icon: "icon-sweep",
        }),
    ],
    Sweep,
);
export { Sweep };
