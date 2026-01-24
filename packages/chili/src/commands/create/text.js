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
import { I18n, Matrix4, TextNode, command } from "chili-core";
import { PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";
let Text = class Text extends MultistepCommand {
    getSteps() {
        return [new PointStep("prompt.pickFistPoint")];
    }
    executeMainTask() {
        const point = this.stepDatas[0].point;
        const node = new TextNode(this.document, "Text", I18n.translate("command.create.text"));
        node.transform = Matrix4.fromTranslation(point.x, point.y, point.z);
        this.document.rootNode.add(node);
        this.document.visual.update();
    }
};
Text = __decorate(
    [
        command({
            key: "create.text",
            icon: "icon-line",
        }),
    ],
    Text,
);
export { Text };
