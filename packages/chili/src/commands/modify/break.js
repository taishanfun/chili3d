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
import { EditableShapeNode, ShapeType, Transaction, command } from "chili-core";
import { Dimension } from "../../snap";
import { PointOnCurveStep } from "../../step";
import { SelectShapeStep } from "../../step/selectStep";
import { MultistepCommand } from "../multistepCommand";
let Break = class Break extends MultistepCommand {
    executeMainTask() {
        Transaction.execute(this.document, `excute ${Object.getPrototypeOf(this).data.name}`, () => {
            const shape = this.stepDatas[0].shapes[0].shape;
            const curve = shape.curve;
            const point = this.stepDatas[0].shapes[0].owner.node
                .worldTransform()
                .invert()
                .ofPoint(this.stepDatas[1].point);
            const parameter = curve.parameter(point, 1e-3);
            if (parameter === undefined) return;
            const curve2 = curve.trim(parameter, curve.lastParameter());
            curve.setTrim(curve.firstParameter(), parameter);
            shape.update(curve);
            const model = this.stepDatas[0].nodes[0];
            const model1 = new EditableShapeNode(this.document, `${model.name}_1`, shape);
            const model2 = new EditableShapeNode(this.document, `${model.name}_2`, curve2.makeEdge());
            model1.transform = model.transform;
            model2.transform = model.transform;
            model.parent?.insertAfter(model, model1);
            model.parent?.insertAfter(model1, model2);
            model.parent?.remove(model);
            this.document.visual.update();
        });
    }
    getSteps() {
        return [
            new SelectShapeStep(ShapeType.Shape, "prompt.select.edges", {
                shapeFilter: { allow: (s) => s.shapeType === ShapeType.Edge },
            }),
            new PointOnCurveStep("prompt.pickFistPoint", this.handlePointData, true),
        ];
    }
    handlePointData = () => {
        const edge = this.stepDatas[0].shapes[0].shape;
        const curve = edge.curve.transformed(edge.matrix.multiply(this.stepDatas[0].shapes[0].transform));
        this.disposeStack.add(curve);
        return {
            curve,
            dimension: Dimension.D1,
            preview: (point) => {
                if (!point) return [];
                let project = curve.project(point).at(0);
                return [this.meshPoint(project ?? point)];
            },
        };
    };
};
Break = __decorate(
    [
        command({
            key: "modify.break",
            icon: "icon-break",
        }),
    ],
    Break,
);
export { Break };
