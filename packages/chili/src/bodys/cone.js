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
let ConeNode = class ConeNode extends ParameterShapeNode {
    display() {
        return "body.cone";
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
    set radius(dy) {
        this.setPropertyEmitShapeChanged("radius", dy);
    }
    get dz() {
        return this.getPrivateValue("dz");
    }
    set dz(dz) {
        this.setPropertyEmitShapeChanged("dz", dz);
    }
    get normal() {
        return this.getPrivateValue("normal");
    }
    constructor(document, normal, center, radius, dz) {
        super(document);
        this.setPrivateValue("normal", normal);
        this.setPrivateValue("center", center);
        this.setPrivateValue("radius", radius);
        this.setPrivateValue("dz", dz);
    }
    generateShape() {
        return this.document.application.shapeFactory.cone(
            this.normal,
            this.center,
            this.radius,
            0,
            this.dz,
        );
    }
};
__decorate([Serializer.serialze(), Property.define("circle.center")], ConeNode.prototype, "center", null);
__decorate([Serializer.serialze(), Property.define("circle.radius")], ConeNode.prototype, "radius", null);
__decorate([Serializer.serialze(), Property.define("box.dz")], ConeNode.prototype, "dz", null);
__decorate([Serializer.serialze()], ConeNode.prototype, "normal", null);
ConeNode = __decorate([Serializer.register(["document", "normal", "center", "radius", "dz"])], ConeNode);
export { ConeNode };
