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
import { command, PubSub, Transaction } from "chili-core";
import { GetOrSelectNodeStep } from "../step";
import { MultistepCommand } from "./multistepCommand";
let Delete = class Delete extends MultistepCommand {
    executeMainTask() {
        const nodes = this.stepDatas[0].nodes;
        if (!nodes || nodes.length === 0) {
            PubSub.default.pub("showToast", "toast.select.noSelected");
            return;
        }
        if (this.document.currentNode && nodes.includes(this.document.currentNode)) {
            this.document.currentNode = this.document.rootNode;
        }
        this.document.selection.clearSelection();
        Transaction.execute(this.document, "delete", () => {
            nodes.forEach((model) => model.parent?.remove(model));
        });
        this.document.visual.update();
        PubSub.default.pub("showToast", "toast.delete{0}Objects", nodes.length);
    }
    getSteps() {
        return [new GetOrSelectNodeStep("prompt.select.models", { multiple: true })];
    }
};
Delete = __decorate(
    [
        command({
            key: "modify.deleteNode",
            icon: "icon-delete",
        }),
    ],
    Delete,
);
export { Delete };
