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
import { FacebaseNode, Property, Serializer } from "chili-core";
let CircleNode = class CircleNode extends FacebaseNode {
    display() {
        return "body.circle";
    }
    get center() {
        return this.getPrivateValue("center");
    }
    set center(center) {
        this.setPropertyEmitShapeChanged("center", center);
    }
    get radius() {
        return this.getPrivateValue("radius");
    }
    set radius(radius) {
        this.setPropertyEmitShapeChanged("radius", radius);
    }
    get normal() {
        return this.getPrivateValue("normal");
    }
    constructor(document, normal, center, radius) {
        super(document);
        this.setPrivateValue("normal", normal);
        this.setPrivateValue("center", center);
        this.setPrivateValue("radius", radius);
    }
    generateShape() {
        let circle = this.document.application.shapeFactory.circle(this.normal, this.center, this.radius);
        if (!circle.isOk || !this.isFace) return circle;
        let wire = this.document.application.shapeFactory.wire([circle.value]);
        return wire.isOk ? wire.value.toFace() : circle;
    }
};
__decorate([Serializer.serialze(), Property.define("circle.center")], CircleNode.prototype, "center", null);
__decorate([Serializer.serialze(), Property.define("circle.radius")], CircleNode.prototype, "radius", null);
__decorate([Serializer.serialze()], CircleNode.prototype, "normal", null);
CircleNode = __decorate([Serializer.register(["document", "normal", "center", "radius"])], CircleNode);
export { CircleNode };
