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
import {
    ComponentNode,
    EditableShapeNode,
    GroupNode,
    MultiShapeNode,
    ShapeNode,
    ShapeType,
    Transaction,
    command,
} from "chili-core";
import { GetOrSelectNodeStep } from "../../step/selectStep";
import { MultistepCommand } from "../multistepCommand";
let Explode = class Explode extends MultistepCommand {
    getSteps() {
        return [new GetOrSelectNodeStep("prompt.select.shape", { multiple: true })];
    }
    executeMainTask() {
        this.document.selection.clearSelection();
        Transaction.execute(this.document, `excute ${Object.getPrototypeOf(this).data.name}`, () => {
            this.stepDatas[0].nodes?.forEach((x) => {
                if (x instanceof ShapeNode) {
                    this.explodeShapeNode(x);
                } else if (x instanceof ComponentNode) {
                    this.explodeComponentNode(x);
                } else if (x instanceof MultiShapeNode) {
                    this.explodeMultiShapeNode(x);
                }
            });
        });
        this.document.visual.update();
    }
    explodeShapeNode(x) {
        let subShapes = x.shape.value.iterShape();
        if (subShapes.length === 1) {
            const subShapeNode = new EditableShapeNode(this.document, x.name, subShapes[0], x.materialId);
            subShapeNode.transform = x.transform;
            x.parent?.insertAfter(x.previousSibling, subShapeNode);
        } else {
            this.groupShapes(x, subShapes);
        }
        x.parent?.remove(x);
    }
    groupShapes(node, subShapes) {
        const folder = new GroupNode(this.document, node.name);
        folder.transform = node.transform;
        node.parent?.insertAfter(node.previousSibling, folder);
        let i = 1;
        for (const subShape of subShapes) {
            const name = `${ShapeType.stringValue(subShape.shapeType)} ${i++}`;
            let subShapeNode = new EditableShapeNode(this.document, name, subShape);
            folder.add(subShapeNode);
        }
    }
    explodeComponentNode(x) {
        for (const node of x.component.nodes) {
            const newNode = node.clone();
            newNode.transform = node.transform.multiply(x.transform);
            x.parent?.insertAfter(x.previousSibling, newNode);
        }
        x.parent?.remove(x);
    }
    explodeMultiShapeNode(x) {
        for (const shape of x.shapes) {
            const node = new EditableShapeNode(this.document, x.name, shape.transformed(x.transform));
            x.parent?.insertAfter(x.previousSibling, node);
        }
        x.parent?.remove(x);
        x.shapes.forEach((x) => x.dispose());
    }
};
Explode = __decorate(
    [
        command({
            key: "modify.explode",
            icon: "icon-explode",
        }),
    ],
    Explode,
);
export { Explode };
