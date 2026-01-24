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
import { Id } from "../foundation";
import { BoundingBox } from "../math";
import { Property } from "../property";
import { Serializer } from "../serialize";
import { TextNode } from "./textNode";
import { VisualNode } from "./visualNode";
let MTextNode = class MTextNode extends VisualNode {
    display() {
        return "body.mtextNode";
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
    get lineSpacing() {
        return this.getPrivateValue("lineSpacing", 1.2);
    }
    set lineSpacing(value) {
        this.setProperty("lineSpacing", value, () => this.document.visual.context.redrawNode([this]));
    }
    get lineColors() {
        return this.getPrivateValue("lineColors", []);
    }
    set lineColors(value) {
        this.setProperty("lineColors", value, () => this.document.visual.context.redrawNode([this]));
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
    constructor(document, text, name = "MText", id = Id.generate()) {
        super(document, name, id);
        this.setPrivateValue("text", text);
    }
    lines() {
        const text = this.text ?? "";
        const lines = text.split(/\r?\n/);
        return lines.length === 0 ? [""] : lines;
    }
    estimateSize() {
        const lines = this.lines();
        const maxChars = Math.max(0, ...lines.map((l) => l.length));
        const width = TextNode.estimateLineWidth(" ".repeat(maxChars), this.height);
        const height = this.height * this.lineSpacing * lines.length;
        return { width, height };
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
};
__decorate([Serializer.serialze(), Property.define("text.content")], MTextNode.prototype, "text", null);
__decorate([Serializer.serialze(), Property.define("text.height")], MTextNode.prototype, "height", null);
__decorate(
    [Serializer.serialze(), Property.define("text.color", { type: "color" })],
    MTextNode.prototype,
    "color",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("mtext.lineSpacing")],
    MTextNode.prototype,
    "lineSpacing",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("mtext.lineColors")],
    MTextNode.prototype,
    "lineColors",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("text.horizontalAlign")],
    MTextNode.prototype,
    "horizontalAlign",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("text.verticalAlign")],
    MTextNode.prototype,
    "verticalAlign",
    null,
);
MTextNode = __decorate(
    [
        Serializer.register([
            "document",
            "text",
            "height",
            "color",
            "lineSpacing",
            "lineColors",
            "horizontalAlign",
            "verticalAlign",
            "name",
            "id",
        ]),
    ],
    MTextNode,
);
export { MTextNode };
