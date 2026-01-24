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
import { ParameterShapeNode, Property, Serializer } from "chili-core";
let ArcNode = class ArcNode extends ParameterShapeNode {
    display() {
        return "body.arc";
    }
    get center() {
        return this.getPrivateValue("center");
    }
    set center(center) {
        this.setPropertyEmitShapeChanged("center", center);
    }
    get start() {
        return this.getPrivateValue("start");
    }
    get normal() {
        return this.getPrivateValue("normal");
    }
    get angle() {
        return this.getPrivateValue("angle");
    }
    set angle(value) {
        this.setPropertyEmitShapeChanged("angle", value);
    }
    constructor(document, normal, center, start, angle) {
        super(document);
        this.setPrivateValue("normal", normal);
        this.setPrivateValue("center", center);
        this.setPrivateValue("start", start);
        this.setPrivateValue("angle", angle);
    }
    generateShape() {
        return this.document.application.shapeFactory.arc(this.normal, this.center, this.start, this.angle);
    }
};
__decorate([Serializer.serialze(), Property.define("circle.center")], ArcNode.prototype, "center", null);
__decorate([Serializer.serialze(), Property.define("arc.start")], ArcNode.prototype, "start", null);
__decorate([Serializer.serialze()], ArcNode.prototype, "normal", null);
__decorate([Serializer.serialze(), Property.define("arc.angle")], ArcNode.prototype, "angle", null);
ArcNode = __decorate([Serializer.register(["document", "normal", "center", "start", "angle"])], ArcNode);
export { ArcNode };
