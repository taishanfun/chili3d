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
import { GeoUtils } from "chili-geo";
let PrismNode = class PrismNode extends ParameterShapeNode {
    display() {
        return "body.prism";
    }
    get section() {
        return this.getPrivateValue("section");
    }
    set section(value) {
        this.setPropertyEmitShapeChanged("section", value);
    }
    get length() {
        return this.getPrivateValue("length");
    }
    set length(value) {
        this.setPropertyEmitShapeChanged("length", value);
    }
    constructor(document, face, length) {
        super(document);
        this.setPrivateValue("section", face);
        this.setPrivateValue("length", length);
    }
    generateShape() {
        let normal = GeoUtils.normal(this.section);
        let vec = normal.multiply(this.length);
        return this.document.application.shapeFactory.prism(this.section, vec);
    }
};
__decorate([Serializer.serialze()], PrismNode.prototype, "section", null);
__decorate([Serializer.serialze(), Property.define("common.length")], PrismNode.prototype, "length", null);
PrismNode = __decorate([Serializer.register(["document", "section", "length"])], PrismNode);
export { PrismNode };
