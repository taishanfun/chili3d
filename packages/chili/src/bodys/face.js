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
import { ParameterShapeNode, Result, Serializer, ShapeType } from "chili-core";
let FaceNode = class FaceNode extends ParameterShapeNode {
    display() {
        return "body.face";
    }
    get shapes() {
        return this.getPrivateValue("shapes");
    }
    set shapes(values) {
        this.setPropertyEmitShapeChanged("shapes", values);
    }
    constructor(document, shapes) {
        super(document);
        this.setPrivateValue("shapes", shapes);
    }
    isAllClosed() {
        return this.shapes.every((shape) => shape.isClosed() || shape.shapeType === ShapeType.Wire);
    }
    getWires() {
        let wires = [];
        if (this.isAllClosed()) {
            this.addClosedEdges(wires, this.shapes);
        } else {
            this.addUnclosedEdges(wires, this.shapes);
        }
        return wires;
    }
    addClosedEdges(wires, edges) {
        for (const shape of this.shapes) {
            if (shape.shapeType === ShapeType.Wire) {
                wires.push(shape);
            } else {
                this.addUnclosedEdges(wires, [shape]);
            }
        }
    }
    addUnclosedEdges(wires, edges) {
        let wire = this.document.application.shapeFactory.wire(edges);
        if (!wire.isOk) throw new Error("Cannot create wire from open shapes");
        wires.push(wire.value);
    }
    generateShape() {
        if (this.shapes.length === 0) return Result.err("No shapes to create face");
        let wires = this.getWires();
        return this.document.application.shapeFactory.face(wires);
    }
};
__decorate([Serializer.serialze()], FaceNode.prototype, "shapes", null);
FaceNode = __decorate([Serializer.register(["document", "shapes"])], FaceNode);
export { FaceNode };
