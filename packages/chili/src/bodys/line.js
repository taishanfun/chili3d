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
let LineNode = class LineNode extends ParameterShapeNode {
    display() {
        return "body.line";
    }
    get start() {
        return this.getPrivateValue("start");
    }
    set start(pnt) {
        this.setPropertyEmitShapeChanged("start", pnt);
    }
    get end() {
        return this.getPrivateValue("end");
    }
    set end(pnt) {
        this.setPropertyEmitShapeChanged("end", pnt);
    }
    constructor(document, start, end) {
        super(document);
        this.setPrivateValue("start", start);
        this.setPrivateValue("end", end);
    }
    generateShape() {
        return this.document.application.shapeFactory.line(this.start, this.end);
    }
};
__decorate([Serializer.serialze(), Property.define("line.start")], LineNode.prototype, "start", null);
__decorate([Serializer.serialze(), Property.define("line.end")], LineNode.prototype, "end", null);
LineNode = __decorate([Serializer.register(["document", "start", "end"])], LineNode);
export { LineNode };
