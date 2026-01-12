import { I18n, MTextNode, Matrix4, command } from "chili-core";
import { IStep, PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";

@command({
    key: "create.mtext",
    icon: "icon-line",
})
export class MText extends MultistepCommand {
    getSteps(): IStep[] {
        return [new PointStep("prompt.pickFistPoint")];
    }

    protected override executeMainTask(): void {
        const point = this.stepDatas[0].point!;
        const node = new MTextNode(this.document, "MText\nLine 2", I18n.translate("command.create.mtext"));
        node.transform = Matrix4.fromTranslation(point.x, point.y, point.z);
        this.document.rootNode.add(node);
        this.document.visual.update();
    }
}
