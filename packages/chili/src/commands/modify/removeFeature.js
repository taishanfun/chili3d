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
import { EditableShapeNode, ShapeType, Transaction, VisualState, command } from "chili-core";
import { SelectShapeStep } from "../../step/selectStep";
import { MultistepCommand } from "../multistepCommand";
let RemoveFaceCommand = class RemoveFaceCommand extends MultistepCommand {
    executeMainTask() {
        Transaction.execute(this.document, `excute ${Object.getPrototypeOf(this).data.name}`, () => {
            const node = this.stepDatas[0].shapes[0].owner.node;
            const faces = this.stepDatas.at(-1).shapes.map((x) => x.shape);
            const filetShape = this.document.application.shapeFactory.removeFeature(node.shape.value, faces);
            const model = new EditableShapeNode(this.document, node.name, filetShape, node.materialId);
            model.transform = node.transform;
            this.document.addNode(model);
            node.parent?.remove(node);
            this.document.visual.update();
        });
    }
    getSteps() {
        return [
            new SelectShapeStep(ShapeType.Shape, "prompt.select.shape", {
                shapeFilter: {
                    allow: (shape) => {
                        return (
                            shape.shapeType === ShapeType.Solid ||
                            shape.shapeType === ShapeType.Compound ||
                            shape.shapeType === ShapeType.CompoundSolid
                        );
                    },
                },
                selectedState: VisualState.faceTransparent,
            }),
            new SelectShapeStep(ShapeType.Face, "prompt.select.faces", {
                multiple: true,
                keepSelection: true,
            }),
        ];
    }
};
RemoveFaceCommand = __decorate(
    [
        command({
            key: "modify.removeFeature",
            icon: "icon-removeFeature",
        }),
    ],
    RemoveFaceCommand,
);
export { RemoveFaceCommand };
