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
import { Property, Transaction } from "chili-core";
import { MultistepCommand } from "./multistepCommand";
let count = 1;
export class CreateCommand extends MultistepCommand {
    executeMainTask() {
        Transaction.execute(this.document, `excute ${Object.getPrototypeOf(this).data.name}`, () => {
            let node = this.geometryNode();
            this.document.addNode(node);
            this.document.visual.update();
        });
    }
}
export class CreateNodeCommand extends MultistepCommand {
    executeMainTask() {
        Transaction.execute(this.document, `excute ${Object.getPrototypeOf(this).data.name}`, () => {
            this.document.addNode(this.getNode());
            this.document.visual.update();
        });
    }
}
export class CreateFaceableCommand extends CreateCommand {
    _isFace = false;
    get isFace() {
        return this._isFace;
    }
    set isFace(value) {
        this.setProperty("isFace", value);
    }
}
__decorate([Property.define("option.command.isFace")], CreateFaceableCommand.prototype, "isFace", null);
