import { div, label, option, select } from "chili-controls";
import {
    command,
    ComponentNode,
    DialogResult,
    ICommand,
    Localize,
    Matrix4,
    PubSub,
    Transaction,
} from "chili-core";
import { IStep, PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";

@command({
    key: "create.insert",
    icon: "icon-group",
})
export class InsertComponent extends MultistepCommand implements ICommand {
    private _componentId?: string;

    protected override async canExcute(): Promise<boolean> {
        if (this.document.components.length === 0) {
            PubSub.default.pub("showToast", "toast.select.noSelected");
            return false;
        }

        const componentId = await this.pickComponent();
        if (!componentId) return false;
        this._componentId = componentId;
        return true;
    }

    protected override getSteps(): IStep[] {
        return [new PointStep("option.command.insertPoint", undefined, true)];
    }

    protected override executeMainTask(): void {
        const componentId = this._componentId;
        if (!componentId) return;

        const component = this.document.components.find((c) => c.id === componentId);
        if (!component) return;

        const insert = this.stepDatas[0].point!;
        Transaction.execute(this.document, "insert component", () => {
            const node = new ComponentNode(this.document, component.name, component.id, insert);
            node.transform = Matrix4.fromTranslation(insert.x, insert.y, insert.z);
            this.document.rootNode.add(node);
        });
        this.document.visual.update();
    }

    private async pickComponent(): Promise<string | undefined> {
        return new Promise((resolve) => {
            const componentSelect = select(
                {},
                ...this.document.components.map((c) =>
                    option({
                        value: c.id,
                        textContent: c.name,
                    }),
                ),
            );

            PubSub.default.pub(
                "showDialog",
                "command.create.insert",
                div(label({ textContent: new Localize("common.name") }), ": ", componentSelect),
                (result) => {
                    if (result !== DialogResult.ok) {
                        resolve(undefined);
                        return;
                    }
                    resolve(componentSelect.value);
                },
            );
        });
    }
}
