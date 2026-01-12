// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { IDocument } from "../document";
import { Id } from "../foundation";
import { I18nKeys } from "../i18n";
import { BoundingBox, XYZ } from "../math";
import { Property } from "../property";
import { Serializer } from "../serialize";
import { TextHorizontalAlign, TextNode, TextVerticalAlign } from "./textNode";
import { VisualNode } from "./visualNode";

@Serializer.register([
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
])
export class MTextNode extends VisualNode {
    override display(): I18nKeys {
        return "body.mtextNode";
    }

    @Serializer.serialze()
    @Property.define("text.content")
    get text(): string {
        return this.getPrivateValue("text", "");
    }
    set text(value: string) {
        this.setProperty("text", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("text.height")
    get height(): number {
        return this.getPrivateValue("height", 10);
    }
    set height(value: number) {
        this.setProperty("height", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("text.color", { type: "color" })
    get color(): number {
        return this.getPrivateValue("color", 0x000000);
    }
    set color(value: number) {
        this.setProperty("color", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("mtext.lineSpacing")
    get lineSpacing(): number {
        return this.getPrivateValue("lineSpacing", 1.2);
    }
    set lineSpacing(value: number) {
        this.setProperty("lineSpacing", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("mtext.lineColors")
    get lineColors(): (number | string)[] {
        return this.getPrivateValue("lineColors", []);
    }
    set lineColors(value: (number | string)[]) {
        this.setProperty("lineColors", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("text.horizontalAlign")
    get horizontalAlign(): TextHorizontalAlign {
        return this.getPrivateValue("horizontalAlign", "left");
    }
    set horizontalAlign(value: TextHorizontalAlign) {
        this.setProperty("horizontalAlign", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("text.verticalAlign")
    get verticalAlign(): TextVerticalAlign {
        return this.getPrivateValue("verticalAlign", "bottom");
    }
    set verticalAlign(value: TextVerticalAlign) {
        this.setProperty("verticalAlign", value, () => this.document.visual.context.redrawNode([this]));
    }

    constructor(document: IDocument, text: string, name: string = "MText", id: string = Id.generate()) {
        super(document, name, id);
        this.setPrivateValue("text", text);
    }

    lines(): string[] {
        const text = this.text ?? "";
        const lines = text.split(/\r?\n/);
        return lines.length === 0 ? [""] : lines;
    }

    estimateSize(): { width: number; height: number } {
        const lines = this.lines();
        const maxChars = Math.max(0, ...lines.map((l) => l.length));
        const width = TextNode.estimateLineWidth(" ".repeat(maxChars), this.height);
        const height = this.height * this.lineSpacing * lines.length;
        return { width, height };
    }

    alignXNormalized(): number {
        switch (this.horizontalAlign) {
            case "left":
                return 0;
            case "center":
                return 0.5;
            case "right":
                return 1;
        }
    }

    alignYNormalized(): number {
        switch (this.verticalAlign) {
            case "bottom":
                return 0;
            case "middle":
                return 0.5;
            case "top":
                return 1;
        }
    }

    override boundingBox(): BoundingBox | undefined {
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

    worldPosition(): XYZ {
        return this.transform.ofPoint({ x: 0, y: 0, z: 0 });
    }
}
