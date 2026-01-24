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
import { EditableShapeNode, I18n, Property, PubSub, ShapeType, Transaction, command } from "chili-core";
import { SelectShapeStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";
let ThickSolidCommand = class ThickSolidCommand extends MultistepCommand {
    get thickness() {
        return this.getPrivateValue("thickness", 10);
    }
    set thickness(value) {
        this.setProperty("thickness", value);
    }
    executeMainTask() {
        Transaction.execute(this.document, `excute ${Object.getPrototypeOf(this).data.name}`, () => {
            this.stepDatas[0].shapes.forEach((x) => {
                const subShape = this.application.shapeFactory.makeThickSolidBySimple(
                    x.shape,
                    this.thickness,
                );
                if (!subShape.isOk) {
                    PubSub.default.pub("showToast", "toast.converter.error");
                    return;
                }
                const model = new EditableShapeNode(
                    this.document,
                    I18n.translate("command.create.thickSolid"),
                    subShape,
                );
                const node = x.owner.node;
                model.transform = node.transform;
                node.parent.insertAfter(node, model);
            });
            this.document.visual.update();
            PubSub.default.pub("showToast", "toast.success");
        });
    }
    getSteps() {
        return [new SelectShapeStep(ShapeType.Face, "prompt.select.faces", { multiple: true })];
    }
};
__decorate([Property.define("option.command.thickness")], ThickSolidCommand.prototype, "thickness", null);
ThickSolidCommand = __decorate(
    [
        command({
            key: "create.thickSolid",
            icon: "icon-thickSolid",
        }),
    ],
    ThickSolidCommand,
);
export { ThickSolidCommand };
