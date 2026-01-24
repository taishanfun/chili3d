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
var TextNode_1;
import { Id } from "../foundation";
import { BoundingBox } from "../math";
import { Property } from "../property";
import { Serializer } from "../serialize";
import { VisualNode } from "./visualNode";
let TextNode = (TextNode_1 = class TextNode extends VisualNode {
    display() {
        return "body.textNode";
    }
    get text() {
        return this.getPrivateValue("text", "");
    }
    set text(value) {
        this.setProperty("text", value, () => this.document.visual.context.redrawNode([this]));
    }
    get height() {
        return this.getPrivateValue("height", 10);
    }
    set height(value) {
        this.setProperty("height", value, () => this.document.visual.context.redrawNode([this]));
    }
    get color() {
        return this.getPrivateValue("color", 0x000000);
    }
    set color(value) {
        this.setProperty("color", value, () => this.document.visual.context.redrawNode([this]));
    }
    get horizontalAlign() {
        return this.getPrivateValue("horizontalAlign", "left");
    }
    set horizontalAlign(value) {
        this.setProperty("horizontalAlign", value, () => this.document.visual.context.redrawNode([this]));
    }
    get verticalAlign() {
        return this.getPrivateValue("verticalAlign", "bottom");
    }
    set verticalAlign(value) {
        this.setProperty("verticalAlign", value, () => this.document.visual.context.redrawNode([this]));
    }
    constructor(document, text, name = "Text", id = Id.generate()) {
        super(document, name, id);
        this.setPrivateValue("text", text);
    }
    estimateSize() {
        const width = TextNode_1.estimateLineWidth(this.text, this.height);
        return { width, height: this.height };
    }
    alignXNormalized() {
        switch (this.horizontalAlign) {
            case "left":
                return 0;
            case "center":
                return 0.5;
            case "right":
                return 1;
        }
    }
    alignYNormalized() {
        switch (this.verticalAlign) {
            case "bottom":
                return 0;
            case "middle":
                return 0.5;
            case "top":
                return 1;
        }
    }
    boundingBox() {
        const { width, height } = this.estimateSize();
        if (width <= 0 || height <= 0) return undefined;
        const ax = this.alignXNormalized();
        const ay = this.alignYNormalized();
        const minX = -ax * width;
        const maxX = (1 - ax) * width;
        const minY = -ay * height;
        const maxY = (1 - ay) * height;
        const points = this.transform.ofPoints([minX, minY, 0, maxX, minY, 0, maxX, maxY, 0, minX, maxY, 0]);
        return BoundingBox.fromNumbers(points);
    }
    worldPosition() {
        return this.transform.ofPoint({ x: 0, y: 0, z: 0 });
    }
    static estimateLineWidth(text, height) {
        const unit = Math.max(0, height);
        return unit * 0.6 * (text?.length ?? 0);
    }
});
__decorate([Serializer.serialze(), Property.define("text.content")], TextNode.prototype, "text", null);
__decorate([Serializer.serialze(), Property.define("text.height")], TextNode.prototype, "height", null);
__decorate(
    [Serializer.serialze(), Property.define("text.color", { type: "color" })],
    TextNode.prototype,
    "color",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("text.horizontalAlign")],
    TextNode.prototype,
    "horizontalAlign",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("text.verticalAlign")],
    TextNode.prototype,
    "verticalAlign",
    null,
);
TextNode = TextNode_1 = __decorate(
    [
        Serializer.register([
            "document",
            "text",
            "height",
            "color",
            "horizontalAlign",
            "verticalAlign",
            "name",
            "id",
        ]),
    ],
    TextNode,
);
export { TextNode };
