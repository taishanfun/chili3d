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
let FuseNode = class FuseNode extends ParameterShapeNode {
    display() {
        return "body.fuse";
    }
    get bottom() {
        return this.getPrivateValue("bottom");
    }
    set bottom(value) {
        this.setPropertyEmitShapeChanged("bottom", value);
    }
    get top() {
        return this.getPrivateValue("top");
    }
    set top(value) {
        this.setPropertyEmitShapeChanged("top", value);
    }
    constructor(document, bottom, top) {
        super(document);
        this.setPrivateValue("bottom", bottom);
        this.setPrivateValue("top", top);
    }
    generateShape() {
        return this.document.application.shapeFactory.fuse(this.bottom, this.top);
    }
};
__decorate([Serializer.serialze()], FuseNode.prototype, "bottom", null);
__decorate([Serializer.serialze()], FuseNode.prototype, "top", null);
FuseNode = __decorate([Serializer.register(["document", "bottom", "top"])], FuseNode);
export { FuseNode };
