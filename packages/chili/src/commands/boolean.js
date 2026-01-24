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
import { PubSub, ShapeNode, ShapeType, Transaction, VisualState, command } from "chili-core";
import { BooleanNode } from "../bodys/boolean";
import { SelectShapeStep } from "../step";
import { MultistepCommand } from "./multistepCommand";
export class BooleanOperate extends MultistepCommand {
    executeMainTask() {
        Transaction.execute(this.document, "boolean", () => {
            const shape1 = this.transformdFirstShape(this.stepDatas[0]);
            const shape2 = this.transformdShapes(this.stepDatas[1]);
            const booleanType = this.getBooleanOperateType();
            const booleanShape = this.getBooleanShape(booleanType, shape1, shape2);
            if (!booleanShape.isOk) {
                PubSub.default.pub("showToast", "error.default:{0}", "boolean failed");
                return;
            }
            const node = new BooleanNode(this.document, booleanShape.value);
            this.document.rootNode.add(node);
            this.stepDatas.forEach((x) => {
                x.nodes?.forEach((n) => n.parent?.remove(n));
            });
            this.document.visual.update();
        });
    }
    getBooleanShape(type, shape1, tools) {
        switch (type) {
            case "common":
                return this.application.shapeFactory.booleanCommon([shape1], tools);
            case "cut":
                return this.application.shapeFactory.booleanCut([shape1], tools);
            default:
                return this.application.shapeFactory.booleanFuse([shape1], tools);
        }
    }
    getSteps() {
        return [
            new SelectShapeStep(ShapeType.Shape, "prompt.select.shape", {
                nodeFilter: { allow: (node) => node instanceof ShapeNode },
            }),
            new SelectShapeStep(ShapeType.Shape, "prompt.select.shape", {
                nodeFilter: {
                    allow: (node) => {
                        if (!(node instanceof ShapeNode)) {
                            return false;
                        }
                        return !this.stepDatas[0].nodes
                            ?.map((x) => x.shape.value)
                            .includes(node.shape.value);
                    },
                },
                multiple: true,
                keepSelection: true,
                selectedState: VisualState.faceTransparent,
            }),
        ];
    }
}
let BooleanCommon = class BooleanCommon extends BooleanOperate {
    getBooleanOperateType() {
        return "common";
    }
};
BooleanCommon = __decorate(
    [
        command({
            key: "boolean.common",
            icon: "icon-booleanCommon",
        }),
    ],
    BooleanCommon,
);
export { BooleanCommon };
let BooleanCut = class BooleanCut extends BooleanOperate {
    getBooleanOperateType() {
        return "cut";
    }
};
BooleanCut = __decorate(
    [
        command({
            key: "boolean.cut",
            icon: "icon-booleanCut",
        }),
    ],
    BooleanCut,
);
export { BooleanCut };
let BooleanFuse = class BooleanFuse extends BooleanOperate {
    getBooleanOperateType() {
        return "fuse";
    }
};
BooleanFuse = __decorate(
    [
        command({
            key: "boolean.join",
            icon: "icon-booleanFuse",
        }),
    ],
    BooleanFuse,
);
export { BooleanFuse };
