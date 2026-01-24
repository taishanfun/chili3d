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
var RectNode_1;
import { FacebaseNode, Property, Serializer } from "chili-core";
let RectNode = (RectNode_1 = class RectNode extends FacebaseNode {
    display() {
        return "body.rect";
    }
    get dx() {
        return this.getPrivateValue("dx");
    }
    set dx(dx) {
        this.setPropertyEmitShapeChanged("dx", dx);
    }
    get dy() {
        return this.getPrivateValue("dy");
    }
    set dy(dy) {
        this.setPropertyEmitShapeChanged("dy", dy);
    }
    get plane() {
        return this.getPrivateValue("plane");
    }
    constructor(document, plane, dx, dy) {
        super(document);
        this.setPrivateValue("plane", plane);
        this.setPrivateValue("dx", dx);
        this.setPrivateValue("dy", dy);
    }
    generateShape() {
        let points = RectNode_1.points(this.plane, this.dx, this.dy);
        let wire = this.document.application.shapeFactory.polygon(points);
        if (!wire.isOk || !this.isFace) return wire;
        return wire.value.toFace();
    }
    static points(plane, dx, dy) {
        let start = plane.origin;
        return [
            start,
            start.add(plane.xvec.multiply(dx)),
            start.add(plane.xvec.multiply(dx)).add(plane.yvec.multiply(dy)),
            start.add(plane.yvec.multiply(dy)),
            start,
        ];
    }
});
__decorate([Serializer.serialze(), Property.define("rect.dx")], RectNode.prototype, "dx", null);
__decorate([Serializer.serialze(), Property.define("rect.dy")], RectNode.prototype, "dy", null);
__decorate([Serializer.serialze()], RectNode.prototype, "plane", null);
RectNode = RectNode_1 = __decorate([Serializer.register(["document", "plane", "dx", "dy"])], RectNode);
export { RectNode };
