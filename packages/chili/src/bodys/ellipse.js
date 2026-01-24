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
let EllipseNode = class EllipseNode extends FacebaseNode {
    display() {
        return "body.ellipse";
    }
    get center() {
        return this.getPrivateValue("center");
    }
    set center(center) {
        this.setPropertyEmitShapeChanged("center", center);
    }
    get majorRadius() {
        return this.getPrivateValue("majorRadius");
    }
    set majorRadius(radius) {
        this.setPropertyEmitShapeChanged("majorRadius", radius);
    }
    get minorRadius() {
        return this.getPrivateValue("minorRadius");
    }
    set minorRadius(radius) {
        this.setPropertyEmitShapeChanged("minorRadius", radius);
    }
    get normal() {
        return this.getPrivateValue("normal");
    }
    get xvec() {
        return this.getPrivateValue("xvec");
    }
    constructor(document, normal, center, xvec, majorRadius, minorRadius) {
        super(document);
        this.setPrivateValue("normal", normal);
        this.setPrivateValue("center", center);
        this.setPrivateValue("xvec", xvec);
        this.setPrivateValue("majorRadius", majorRadius);
        this.setPrivateValue("minorRadius", minorRadius);
    }
    generateShape() {
        let circle = this.document.application.shapeFactory.ellipse(
            this.normal,
            this.center,
            this.xvec,
            this.majorRadius,
            this.minorRadius,
        );
        if (!circle.isOk || !this.isFace) return circle;
        let wire = this.document.application.shapeFactory.wire([circle.value]);
        return wire.isOk ? wire.value.toFace() : circle;
    }
};
__decorate([Serializer.serialze(), Property.define("circle.center")], EllipseNode.prototype, "center", null);
__decorate(
    [Serializer.serialze(), Property.define("ellipse.majorRadius")],
    EllipseNode.prototype,
    "majorRadius",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("ellipse.minorRadius")],
    EllipseNode.prototype,
    "minorRadius",
    null,
);
__decorate([Serializer.serialze()], EllipseNode.prototype, "normal", null);
__decorate([Serializer.serialze()], EllipseNode.prototype, "xvec", null);
EllipseNode = __decorate(
    [Serializer.register(["document", "normal", "center", "xvec", "majorRadius", "minorRadius"])],
    EllipseNode,
);
export { EllipseNode };
