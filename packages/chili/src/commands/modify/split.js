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
let Split = class Split extends MultistepCommand {
    splitedShape() {
        const shape1 = this.stepDatas[0].shapes[0].shape;
        const invertTransform = this.stepDatas[0].shapes[0].transform.invert();
        const edges = this.stepDatas[1].shapes.map((x) =>
            x.shape.transformedMul(x.transform.multiply(invertTransform)),
        );
        const result = shape1.split(edges);
        edges.forEach((x) => x.dispose());
        return result;
    }
    executeMainTask() {
        Transaction.execute(this.document, `excute ${Object.getPrototypeOf(this).data.name}`, () => {
            const old = this.stepDatas[0].nodes[0];
            const shape = this.splitedShape();
            let subShapes = shape.iterShape();
            if (subShapes.length > 1) {
                let i = 1;
                old.parent?.add(
                    ...subShapes.map((x) => {
                        const model = new EditableShapeNode(this.document, old.name + i++, x);
                        model.transform = old.transform;
                        return model;
                    }),
                );
            } else {
                const model = new EditableShapeNode(this.document, old.name, shape);
                model.transform = old.transform;
                old.parent?.add(model);
            }
            this.removeModels(
                this.stepDatas[0].shapes[0].owner,
                ...this.stepDatas[1].shapes.map((x) => x.owner),
            );
            this.document.visual.update();
        });
    }
    removeModels(...shapes) {
        shapes.forEach((x) => {
            const model = this.document.visual.context.getNode(x);
            model?.parent?.remove(model);
        });
    }
    getSteps() {
        return [
            new SelectShapeStep(ShapeType.Shape, "prompt.select.shape", {
                selectedState: VisualState.faceTransparent,
            }),
            new SelectShapeStep(ShapeType.Edge | ShapeType.Wire | ShapeType.Face, "prompt.select.shape", {
                multiple: true,
                keepSelection: true,
            }),
        ];
    }
};
Split = __decorate(
    [
        command({
            key: "modify.split",
            icon: "icon-split",
        }),
    ],
    Split,
);
export { Split };
