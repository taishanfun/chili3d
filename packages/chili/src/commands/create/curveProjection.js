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
import { command, EditableShapeNode, I18n, Property, ShapeType, XYZ } from "chili-core";
import { SelectShapeStep } from "../../step";
import { CreateCommand } from "../createCommand";
let CurveProjectionCommand = class CurveProjectionCommand extends CreateCommand {
    get dir() {
        return this.getPrivateValue("dir", "0,0,-1");
    }
    set dir(value) {
        const nums = this.dir
            .split(",")
            .map(Number)
            .filter((n) => !isNaN(n));
        if (nums.length !== 3) {
            alert(I18n.translate("error.input.threeNumberCanBeInput"));
            return;
        }
        this.setProperty("dir", value);
    }
    geometryNode() {
        const shape = this.transformdFirstShape(this.stepDatas[0]);
        const face = this.transformdFirstShape(this.stepDatas[1]);
        const [x, y, z] = this.dir.split(",").map(Number);
        const dir = new XYZ(x, y, z).normalize();
        const curveProjection = this.application.shapeFactory.curveProjection(shape, face, dir);
        return new EditableShapeNode(
            this.document,
            I18n.translate("command.convert.curveProjection"),
            curveProjection.value,
        );
    }
    getSteps() {
        return [
            new SelectShapeStep(ShapeType.Edge | ShapeType.Wire, "prompt.select.shape"),
            new SelectShapeStep(ShapeType.Face, "prompt.select.faces", { keepSelection: true }),
        ];
    }
};
__decorate([Property.define("common.dir")], CurveProjectionCommand.prototype, "dir", null);
CurveProjectionCommand = __decorate(
    [
        command({
            key: "convert.curveProjection",
            icon: "icon-curveProject",
        }),
    ],
    CurveProjectionCommand,
);
export { CurveProjectionCommand };
