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
import { div, label, option, select } from "chili-controls";
import { command, ComponentNode, DialogResult, Localize, Matrix4, PubSub, Transaction } from "chili-core";
import { PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";
let InsertComponent = class InsertComponent extends MultistepCommand {
    _componentId;
    async canExcute() {
        if (this.document.components.length === 0) {
            PubSub.default.pub("showToast", "toast.select.noSelected");
            return false;
        }
        const componentId = await this.pickComponent();
        if (!componentId) return false;
        this._componentId = componentId;
        return true;
    }
    getSteps() {
        return [new PointStep("option.command.insertPoint", undefined, true)];
    }
    executeMainTask() {
        const componentId = this._componentId;
        if (!componentId) return;
        const component = this.document.components.find((c) => c.id === componentId);
        if (!component) return;
        const insert = this.stepDatas[0].point;
        Transaction.execute(this.document, "insert component", () => {
            const node = new ComponentNode(this.document, component.name, component.id, insert);
            node.transform = Matrix4.fromTranslation(insert.x, insert.y, insert.z);
            this.document.rootNode.add(node);
        });
        this.document.visual.update();
    }
    async pickComponent() {
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
};
InsertComponent = __decorate(
    [
        command({
            key: "create.insert",
            icon: "icon-group",
        }),
    ],
    InsertComponent,
);
export { InsertComponent };
