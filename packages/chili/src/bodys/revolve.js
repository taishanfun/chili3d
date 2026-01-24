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
import { ParameterShapeNode, Serializer } from "chili-core";
let RevolvedNode = class RevolvedNode extends ParameterShapeNode {
    display() {
        return "body.revol";
    }
    get profile() {
        return this.getPrivateValue("profile");
    }
    set profile(value) {
        this.setPropertyEmitShapeChanged("profile", value);
    }
    get axis() {
        return this.getPrivateValue("axis");
    }
    set axis(value) {
        this.setPropertyEmitShapeChanged("axis", value);
    }
    get angle() {
        return this.getPrivateValue("angle");
    }
    set angle(value) {
        this.setPropertyEmitShapeChanged("angle", value);
    }
    constructor(document, profile, axis, angle) {
        super(document);
        this.setPrivateValue("profile", profile);
        this.setPrivateValue("axis", axis);
        this.setPrivateValue("angle", angle);
    }
    generateShape() {
        return this.document.application.shapeFactory.revolve(this.profile, this.axis, this.angle);
    }
};
__decorate([Serializer.serialze()], RevolvedNode.prototype, "profile", null);
__decorate([Serializer.serialze()], RevolvedNode.prototype, "axis", null);
__decorate([Serializer.serialze()], RevolvedNode.prototype, "angle", null);
RevolvedNode = __decorate([Serializer.register(["document", "profile", "axis", "angle"])], RevolvedNode);
export { RevolvedNode };
