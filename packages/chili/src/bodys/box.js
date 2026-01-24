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
let BoxNode = class BoxNode extends ParameterShapeNode {
    display() {
        return "body.box";
    }
    get plane() {
        return this.getPrivateValue("plane");
    }
    get location() {
        return this.plane.origin;
    }
    set location(value) {
        this.setPropertyEmitShapeChanged("plane", this.plane.translateTo(value));
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
    constructor(document, plane, dx, dy, dz) {
        super(document);
        this.setPrivateValue("plane", plane);
        this.setPrivateValue("dx", dx);
        this.setPrivateValue("dy", dy);
        this.setPrivateValue("dz", dz);
    }
    generateShape() {
        return this.document.application.shapeFactory.box(this.plane, this.dx, this.dy, this.dz);
    }
};
__decorate([Serializer.serialze()], BoxNode.prototype, "plane", null);
__decorate([Property.define("common.location")], BoxNode.prototype, "location", null);
__decorate([Serializer.serialze(), Property.define("box.dx")], BoxNode.prototype, "dx", null);
__decorate([Serializer.serialze(), Property.define("box.dy")], BoxNode.prototype, "dy", null);
__decorate([Serializer.serialze(), Property.define("box.dz")], BoxNode.prototype, "dz", null);
BoxNode = __decorate([Serializer.register(["document", "plane", "dx", "dy", "dz"])], BoxNode);
export { BoxNode };
