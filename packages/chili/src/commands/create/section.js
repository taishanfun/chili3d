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
import { EditableShapeNode, I18n, ShapeType, VisualState, command } from "chili-core";
import { SelectShapeStep } from "../../step/selectStep";
import { MultistepCommand } from "../multistepCommand";
let Section = class Section extends MultistepCommand {
    executeMainTask() {
        let shape = this.transformdFirstShape(this.stepDatas[0]);
        let path = this.transformdFirstShape(this.stepDatas[1]);
        let section = shape.section(path);
        const node = new EditableShapeNode(this.document, I18n.translate("command.create.section"), section);
        this.document.rootNode.add(node);
        this.document.visual.update();
    }
    getSteps() {
        return [
            new SelectShapeStep(ShapeType.Shape, "prompt.select.shape", {
                selectedState: VisualState.faceTransparent,
            }),
            new SelectShapeStep(ShapeType.Shape, "prompt.select.shape", { keepSelection: true }),
        ];
    }
};
Section = __decorate(
    [
        command({
            key: "create.section",
            icon: "icon-section",
        }),
    ],
    Section,
);
export { Section };
