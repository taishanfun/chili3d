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
import { I18n, MTextNode, Matrix4, command } from "chili-core";
import { PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";
let MText = class MText extends MultistepCommand {
    getSteps() {
        return [new PointStep("prompt.pickFistPoint")];
    }
    executeMainTask() {
        const point = this.stepDatas[0].point;
        const node = new MTextNode(this.document, "MText\nLine 2", I18n.translate("command.create.mtext"));
        node.transform = Matrix4.fromTranslation(point.x, point.y, point.z);
        this.document.rootNode.add(node);
        this.document.visual.update();
    }
};
MText = __decorate(
    [
        command({
            key: "create.mtext",
            icon: "icon-line",
        }),
    ],
    MText,
);
export { MText };
