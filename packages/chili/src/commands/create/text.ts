import { I18n, Matrix4, TextNode, command } from "chili-core";
import { IStep, PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";

@command({
    key: "create.text",
    icon: "icon-line",
})
export class Text extends MultistepCommand {
    getSteps(): IStep[] {
        return [new PointStep("prompt.pickFistPoint")];
    }

    protected override executeMainTask(): void {
        const point = this.stepDatas[0].point!;
        const node = new TextNode(this.document, "Text", I18n.translate("command.create.text"));
        node.transform = Matrix4.fromTranslation(point.x, point.y, point.z);
        this.document.rootNode.add(node);
        this.document.visual.update();
    }
}
