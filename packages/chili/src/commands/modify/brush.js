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
import { command, GeometryNode, Property, ShapeType, Transaction } from "chili-core";
import { SelectNodeStep, SelectShapeStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";
let AddBrushCommand = class AddBrushCommand extends MultistepCommand {
    get materialId() {
        return this.getPrivateValue("materialId", this.document.materials.at(0)?.id);
    }
    set materialId(value) {
        this.setProperty("materialId", value);
    }
    getSteps() {
        return [new SelectShapeStep(ShapeType.Face, "prompt.select.faces", { multiple: true })];
    }
    executeMainTask() {
        const nodeMatiralMape = new Map();
        this.stepDatas[0].shapes.forEach((x) => {
            if (x.owner.node instanceof GeometryNode) {
                if (!nodeMatiralMape.has(x.owner.node)) {
                    nodeMatiralMape.set(x.owner.node, []);
                }
                nodeMatiralMape.get(x.owner.node).push({
                    faceIndex: x.shape.index,
                    materialId: this.materialId,
                });
            }
        });
        Transaction.execute(this.document, "add face material", () => {
            nodeMatiralMape.forEach((value, key) => {
                key.addFaceMaterial(value);
            });
        });
        this.document.visual.update();
    }
};
__decorate(
    [Property.define("common.material", { type: "materialId" })],
    AddBrushCommand.prototype,
    "materialId",
    null,
);
AddBrushCommand = __decorate(
    [
        command({
            key: "modify.brushAdd",
            icon: "icon-addBrush",
        }),
    ],
    AddBrushCommand,
);
export { AddBrushCommand };
let RemoveBrushCommand = class RemoveBrushCommand extends MultistepCommand {
    getSteps() {
        return [new SelectShapeStep(ShapeType.Face, "prompt.select.faces", { multiple: true })];
    }
    executeMainTask() {
        const nodeMatiralMape = new Map();
        this.stepDatas[0].shapes.forEach((x) => {
            if (x.owner.node instanceof GeometryNode) {
                if (!nodeMatiralMape.has(x.owner.node)) {
                    nodeMatiralMape.set(x.owner.node, []);
                }
                nodeMatiralMape.get(x.owner.node).push(x.shape.index);
            }
        });
        Transaction.execute(this.document, "remove face material", () => {
            nodeMatiralMape.forEach((value, key) => {
                key.removeFaceMaterial(value);
            });
        });
        this.document.visual.update();
    }
};
RemoveBrushCommand = __decorate(
    [
        command({
            key: "modify.brushRemove",
            icon: "icon-removeBrush",
        }),
    ],
    RemoveBrushCommand,
);
export { RemoveBrushCommand };
let ClearBrushCommand = class ClearBrushCommand extends MultistepCommand {
    getSteps() {
        return [new SelectNodeStep("prompt.select.shape", { multiple: true, keepSelection: true })];
    }
    executeMainTask() {
        Transaction.execute(this.document, "clear face material", () => {
            this.stepDatas[0].nodes?.forEach((x) => {
                if (x instanceof GeometryNode) {
                    x.clearFaceMaterial();
                }
            });
        });
        this.document.visual.update();
    }
};
ClearBrushCommand = __decorate(
    [
        command({
            key: "modify.brushClear",
            icon: "icon-clearBrush",
        }),
    ],
    ClearBrushCommand,
);
export { ClearBrushCommand };
