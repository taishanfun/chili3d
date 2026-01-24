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
import { button, div, input, label, XYZConverter } from "chili-controls";
import {
    AsyncController,
    Binding,
    command,
    Component,
    ComponentNode,
    DialogResult,
    Localize,
    Matrix4,
    Observable,
    PubSub,
    Transaction,
    VisualNode,
    XYZ,
} from "chili-core";
import { GetOrSelectNodeStep, PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";
class GroupDefinition extends Observable {
    get name() {
        return this.getPrivateValue("name", "unnamed");
    }
    set name(value) {
        this.setProperty("name", value);
    }
    get insert() {
        return this.getPrivateValue("insert", XYZ.zero);
    }
    set insert(value) {
        this.setProperty("insert", value);
    }
    get convertInstance() {
        return this.getPrivateValue("convertInstance", true);
    }
    set convertInstance(value) {
        this.setProperty("convertInstance", value);
    }
}
let GroupCommand = class GroupCommand extends MultistepCommand {
    getSteps() {
        return [new GetOrSelectNodeStep("prompt.select.shape", { multiple: true })];
    }
    executeMainTask() {
        const nodes = this.stepDatas[0].nodes?.filter((node) => node instanceof VisualNode);
        if (!nodes || nodes.length === 0) {
            PubSub.default.pub("showToast", "toast.select.noSelected");
            return;
        }
        let definition = new GroupDefinition();
        PubSub.default.pub("showDialog", "command.create.group", this.dialog(definition), (r) => {
            if (r === DialogResult.ok) this.createGroup(definition, nodes);
        });
    }
    createGroup(definition, nodes) {
        Transaction.execute(this.document, "create group", () => {
            for (const node of nodes) {
                const worldTransform = node.worldTransform();
                node.parent?.transfer(node);
                node.transform = worldTransform;
            }
            const toLocal = Matrix4.fromTranslation(
                -definition.insert.x,
                -definition.insert.y,
                -definition.insert.z,
            );
            for (const node of nodes) {
                node.transform = node.transform.multiply(toLocal);
            }
            const component = new Component(definition.name, nodes, XYZ.zero);
            this.document.components.push(component);
            if (definition.convertInstance) {
                const group = new ComponentNode(
                    this.document,
                    definition.name,
                    component.id,
                    definition.insert,
                );
                group.transform = Matrix4.fromTranslation(
                    definition.insert.x,
                    definition.insert.y,
                    definition.insert.z,
                );
                this.document.rootNode.add(group);
            }
        });
    }
    pickInsertPoint = async (definition, e) => {
        const dialog = this.findDialog(e.target);
        if (!dialog) return;
        dialog.close();
        const command = new PickInsertPointCommand(this.document, definition);
        try {
            if (this.document.application.executingCommand) {
                throw new Error("Command is executing");
            }
            this.document.application.executingCommand = command;
            await command.execute(this.document.application);
        } finally {
            dialog.showModal();
            this.document.application.executingCommand = undefined;
        }
    };
    findDialog = (e) => {
        if (e instanceof HTMLDialogElement) return e;
        if (!e.parentElement) return undefined;
        return this.findDialog(e.parentElement);
    };
    dialog(definition) {
        return div(
            {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                },
            },
            label(
                {
                    textContent: new Localize("common.name"),
                },
                ": ",
            ),
            input({
                value: new Binding(definition, "name"),
                onkeydown: (e) => {
                    e.stopPropagation();
                },
                onblur: (e) => {
                    definition.name = e.target.value;
                },
            }),
            label(
                {
                    textContent: new Localize("option.command.insertPoint"),
                },
                ": ",
            ),
            div(
                {
                    style: {
                        display: "inline-flex",
                        flexDirection: "row",
                        padding: "10px",
                        borderRadius: "5px",
                        border: "1px solid var(--border-color)",
                        gap: "6px",
                    },
                },
                input({
                    value: new Binding(definition, "insert", new XYZConverter()),
                    onkeydown: (e) => {
                        e.stopPropagation();
                    },
                }),
                button({
                    textContent: new Localize("option.command.insertPoint"),
                    onclick: (e) => this.pickInsertPoint(definition, e),
                }),
            ),
            div(
                input({
                    type: "checkbox",
                    id: "instanceID",
                    checked: new Binding(definition, "convertInstance"),
                    onchange: (e) => {
                        definition.convertInstance = e.target.checked;
                    },
                }),
                " ",
                label({
                    textContent: new Localize("option.command.isConvertInstance"),
                    htmlFor: "instanceID",
                }),
            ),
        );
    }
};
GroupCommand = __decorate(
    [
        command({
            key: "create.group",
            icon: "icon-group",
        }),
    ],
    GroupCommand,
);
export { GroupCommand };
class PickInsertPointCommand {
    document;
    defination;
    constructor(document, defination) {
        this.document = document;
        this.defination = defination;
    }
    async execute(application) {
        const pickPointStep = new PointStep("option.command.insertPoint");
        const controller = new AsyncController();
        const result = await pickPointStep.execute(this.document, controller);
        if (result?.point) {
            this.defination.insert = result.point;
        }
    }
}
