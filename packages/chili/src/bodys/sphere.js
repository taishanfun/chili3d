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
let SphereNode = class SphereNode extends ParameterShapeNode {
    display() {
        return "body.sphere";
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
    set radius(value) {
        this.setPropertyEmitShapeChanged("radius", value);
    }
    constructor(document, center, radius) {
        super(document);
        this.setPrivateValue("center", center);
        this.setPrivateValue("radius", radius);
    }
    generateShape() {
        return this.document.application.shapeFactory.sphere(this.center, this.radius);
    }
};
__decorate([Serializer.serialze(), Property.define("circle.center")], SphereNode.prototype, "center", null);
__decorate([Serializer.serialze(), Property.define("circle.radius")], SphereNode.prototype, "radius", null);
SphereNode = __decorate([Serializer.register(["document", "center", "radius"])], SphereNode);
export { SphereNode };
