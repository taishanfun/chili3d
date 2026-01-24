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
import { ParameterShapeNode, Serializer, ShapeType } from "chili-core";
let SweepedNode = class SweepedNode extends ParameterShapeNode {
    display() {
        return "body.sweep";
    }
    get profile() {
        return this.getPrivateValue("profile");
    }
    set profile(value) {
        this.setPropertyEmitShapeChanged("profile", value);
    }
    get path() {
        return this.getPrivateValue("path");
    }
    set path(value) {
        this.setPropertyEmitShapeChanged("path", value);
    }
    get round() {
        return this.getPrivateValue("round");
    }
    set round(value) {
        this.setPropertyEmitShapeChanged("round", value);
    }
    constructor(document, profile, path, round) {
        super(document);
        this.setPrivateValue(
            "profile",
            profile.map((p) => this.ensureWire(p)),
        );
        this.setPrivateValue("path", this.ensureWire(path));
        this.setPrivateValue("round", round);
    }
    ensureWire(path) {
        let wire = path;
        if (path.shapeType !== ShapeType.Wire) {
            wire = this.document.application.shapeFactory.wire([path]).value;
        }
        return wire;
    }
    generateShape() {
        return this.document.application.shapeFactory.sweep(this.profile, this.path, this.round);
    }
};
__decorate([Serializer.serialze()], SweepedNode.prototype, "profile", null);
__decorate([Serializer.serialze()], SweepedNode.prototype, "path", null);
__decorate([Serializer.serialze()], SweepedNode.prototype, "round", null);
SweepedNode = __decorate([Serializer.register(["document", "profile", "path", "round"])], SweepedNode);
export { SweepedNode };
