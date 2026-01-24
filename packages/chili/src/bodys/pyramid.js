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
let PyramidNode = class PyramidNode extends ParameterShapeNode {
    display() {
        return "body.pyramid";
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
    get dz() {
        return this.getPrivateValue("dz");
    }
    set dz(dz) {
        this.setPropertyEmitShapeChanged("dz", dz);
    }
    get plane() {
        return this.getPrivateValue("plane");
    }
    constructor(document, plane, dx, dy, dz) {
        super(document);
        this.setPrivateValue("plane", plane);
        this.setPrivateValue("dx", dx);
        this.setPrivateValue("dy", dy);
        this.setPrivateValue("dz", dz);
    }
    generateShape() {
        return this.document.application.shapeFactory.pyramid(this.plane, this.dx, this.dy, this.dz);
    }
};
__decorate([Serializer.serialze(), Property.define("box.dx")], PyramidNode.prototype, "dx", null);
__decorate([Serializer.serialze(), Property.define("box.dy")], PyramidNode.prototype, "dy", null);
__decorate([Serializer.serialze(), Property.define("box.dz")], PyramidNode.prototype, "dz", null);
__decorate([Serializer.serialze()], PyramidNode.prototype, "plane", null);
PyramidNode = __decorate([Serializer.register(["document", "plane", "dx", "dy", "dz"])], PyramidNode);
export { PyramidNode };
