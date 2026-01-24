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
let RemoveSubShapesCommand = class RemoveSubShapesCommand extends MultistepCommand {
    executeMainTask() {
        Transaction.execute(this.document, `excute ${Object.getPrototypeOf(this).data.name}`, () => {
            const node = this.stepDatas[0].shapes[0].owner.node;
            const subShapes = this.stepDatas.at(-1).shapes.map((x) => x.shape);
            const shape = this.document.application.shapeFactory.removeSubShape(node.shape.value, subShapes);
            const model = new EditableShapeNode(this.document, node.name, shape, node.materialId);
            model.transform = node.transform;
            node.parent?.insertAfter(node.previousSibling, model);
            node.parent?.remove(node);
            this.document.visual.update();
        });
    }
    getSteps() {
        return [
            new SelectShapeStep(ShapeType.Shape, "prompt.select.shape", {
                shapeFilter: {
                    allow: (shape) => {
                        return shape.shapeType !== ShapeType.Vertex && shape.shapeType !== ShapeType.Edge;
                    },
                },
                selectedState: VisualState.faceTransparent,
            }),
            new SelectShapeStep(ShapeType.Edge | ShapeType.Face, "prompt.select.shape", {
                multiple: true,
                keepSelection: true,
            }),
        ];
    }
};
RemoveSubShapesCommand = __decorate(
    [
        command({
            key: "modify.removeShapes",
            icon: "icon-removeSubShape",
        }),
    ],
    RemoveSubShapesCommand,
);
export { RemoveSubShapesCommand };
