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
import { ParameterShapeNode, Result, Serializer } from "chili-core";
let BooleanNode = class BooleanNode extends ParameterShapeNode {
    display() {
        return "body.bolean";
    }
    get booleanShape() {
        return this.getPrivateValue("booleanShape");
    }
    constructor(document, shape) {
        super(document);
        this.setPrivateValue("booleanShape", shape);
    }
    generateShape() {
        return Result.ok(this.booleanShape);
    }
};
__decorate([Serializer.serialze()], BooleanNode.prototype, "booleanShape", null);
BooleanNode = __decorate([Serializer.register(["document", "booleanShape"])], BooleanNode);
export { BooleanNode };
