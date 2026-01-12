// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import {
    button,
    ColorConverter,
    div,
    input,
    NumberConverter,
    span,
    StringConverter,
    textarea,
    XYConverter,
    XYZConverter,
} from "chili-controls";
import {
    Binding,
    IConverter,
    IDocument,
    isPropertyChanged,
    Localize,
    MTextNode,
    Property,
    PubSub,
    Result,
    Transaction,
    XY,
    XYZ,
} from "chili-core";
import commonStyle from "./common.module.css";
import style from "./input.module.css";
import { PropertyBase } from "./propertyBase";

class ArrayValueConverter implements IConverter {
    constructor(
        readonly objects: any[],
        readonly property: Property,
        readonly converter?: IConverter,
    ) {}

    convert(value: any): Result<string> {
        return Result.ok(this.getDefaultValue());
    }

    convertBack?(value: string): Result<any> {
        throw new Error("Method not implemented.");
    }

    private getValueString(obj: any): string {
        const value = obj[this.property.name];
        const cvalue = this.converter?.convert(value);
        return cvalue?.isOk ? cvalue.value : String(value);
    }

    private getDefaultValue() {
        const values = this.objects.map(this.getValueString.bind(this));
        const uniqueValues = new Set(values);
        return uniqueValues.size === 1 ? values[0] : "";
    }
}

class LineColorsConverter implements IConverter<(number | string)[]> {
    private readonly color = new ColorConverter();

    convert(value: (number | string)[]): Result<string> {
        const colors = Array.isArray(value) ? value : [];
        const lines = colors.map((c) => {
            if (c === "" || c === undefined || c === null) return "";
            const result = this.color.convert(c as any);
            return result.isOk ? result.value : "";
        });
        return Result.ok(lines.join("\n"));
    }

    convertBack(value: string): Result<(number | string)[]> {
        const lines = (value ?? "").split(/\r?\n/);
        const result: (number | string)[] = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.length) {
                result.push("");
                continue;
            }
            const parsed = this.color.convertBack(trimmed);
            if (!parsed.isOk) return Result.err(parsed.error);
            result.push(parsed.value);
        }
        return Result.ok(result);
    }
}

export class InputProperty extends PropertyBase {
    readonly converter: IConverter | undefined;

    constructor(
        readonly document: IDocument,
        objects: any[],
        readonly property: Property,
        converter?: IConverter,
    ) {
        super(objects);
        this.converter = converter ?? this.getConverter();
        const arrayConverter = new ArrayValueConverter(objects, property, this.converter);
        const multiline = this.isMultiline();
        this.append(
            div(
                { className: commonStyle.panel },
                span({ className: commonStyle.propertyName, textContent: new Localize(property.display) }),
                multiline
                    ? textarea({
                          className: style.box,
                          value: new Binding(objects[0], property.name, arrayConverter),
                          readOnly: this.isReadOnly(),
                          rows: 4,
                          onkeydown: this.handleKeyDown,
                          onblur: this.handleBlur,
                      })
                    : input({
                          className: style.box,
                          value: new Binding(objects[0], property.name, arrayConverter),
                          readOnly: this.isReadOnly(),
                          onkeydown: this.handleKeyDown,
                          onblur: this.handleBlur,
                      }),
            ),
        );
    }

    private isReadOnly(): boolean {
        let des = Object.getOwnPropertyDescriptor(this.objects[0], this.property.name);
        if (!des) {
            let proto = Object.getPrototypeOf(this.objects[0]);
            while (isPropertyChanged(proto)) {
                des = Object.getOwnPropertyDescriptor(proto, this.property.name);
                if (des) break;
                proto = Object.getPrototypeOf(proto);
            }
        }
        return (
            des?.set === undefined ||
            (this.converter === undefined && typeof this.objects[0][this.property.name] !== "string")
        );
    }

    private readonly handleBlur = (e: FocusEvent) => {
        this.setValue(e.target as HTMLInputElement | HTMLTextAreaElement);
    };

    private readonly handleKeyDown = (e: KeyboardEvent) => {
        e.stopPropagation();
        if (this.isMultiline()) {
            if (this.converter && e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                this.setValue(e.target as HTMLInputElement | HTMLTextAreaElement);
            }
            return;
        }
        if (this.converter && e.key === "Enter") {
            this.setValue(e.target as HTMLInputElement | HTMLTextAreaElement);
        }
    };

    private readonly setValue = (input: HTMLInputElement | HTMLTextAreaElement) => {
        if (this.isReadOnly()) return;

        const newValue = this.converter?.convertBack?.(input.value);
        if (!newValue?.isOk) {
            PubSub.default.pub("showToast", "error.default:{0}", newValue?.error);
            return;
        }
        Transaction.execute(this.document, "modify property", () => {
            this.objects.forEach((x) => {
                x[this.property.name] = newValue.value;
            });
            this.document.visual.update();
        });
    };

    private isMultiline(): boolean {
        return (
            this.objects[0] instanceof MTextNode &&
            (this.property.name === "text" || this.property.name === "lineColors")
        );
    }

    private getConverter(): IConverter | undefined {
        if (this.objects[0] instanceof MTextNode && this.property.name === "lineColors") {
            return new LineColorsConverter();
        }
        const name = this.objects[0][this.property.name].constructor.name;
        const converters: { [key: string]: () => IConverter } = {
            [XYZ.name]: () => new XYZConverter(),
            [XY.name]: () => new XYConverter(),
            [String.name]: () => new StringConverter(),
            [Number.name]: () => new NumberConverter(),
        };
        return converters[name]?.();
    }
}

customElements.define("chili-input-property", InputProperty);

export class MTextLinesProperty extends PropertyBase {
    private readonly mtext: MTextNode;
    private readonly labelText: Localize;
    private readonly container: HTMLDivElement;
    private isSyncing = false;

    constructor(
        private readonly document: IDocument,
        objects: any[],
        private readonly property: Property,
    ) {
        super(objects);
        this.mtext = objects[0] as MTextNode;
        this.labelText = new Localize(property.display);
        this.container = div({ style: { display: "flex", flexDirection: "column", gap: "6px" } });
        this.append(
            div(
                { className: commonStyle.panel },
                span({ className: commonStyle.propertyName, textContent: this.labelText }),
                this.container,
            ),
        );
        this.syncFromNode();
        this.mtext.onPropertyChanged(this.handleMTextChanged);
    }

    disconnectedCallback(): void {
        this.mtext.removePropertyChanged(this.handleMTextChanged);
    }

    private readonly handleMTextChanged = (prop: keyof MTextNode) => {
        if (prop === "text" || prop === "lineColors") {
            this.syncFromNode();
        }
    };

    private syncFromNode() {
        if (this.isSyncing) return;
        this.isSyncing = true;
        try {
            this.container.replaceChildren();
            const lines = this.mtext.lines();
            const colors = this.mtext.lineColors ?? [];
            for (let i = 0; i < lines.length; i++) {
                const row = this.createLineRow(i, lines[i], colors[i]);
                this.container.appendChild(row);
            }
            this.container.appendChild(
                div(
                    { style: { display: "flex", justifyContent: "flex-end" } },
                    button({
                        textContent: "+",
                        onclick: () => this.addLine(),
                    }),
                ),
            );
        } finally {
            this.isSyncing = false;
        }
    }

    private createLineRow(index: number, rawLine: string, configuredColor: number | string | undefined) {
        const parsed = this.parseInlineColoredLine(rawLine);
        const effectiveColor =
            configuredColor === "" || configuredColor === undefined ? parsed.color : configuredColor;
        const colorValue = this.toCssColorOrEmpty(effectiveColor);

        const lineIndex = span({
            textContent: String(index + 1),
            style: { width: "20px", textAlign: "right", opacity: "0.7", flex: "0 0 auto" },
        });

        const textBox = input({
            className: style.box,
            value: parsed.text,
            onkeydown: (e) => this.handleLineTextKeyDown(e, index, parsed),
            onblur: (e) => this.commitLineText(index, parsed, (e.target as HTMLInputElement).value),
        });

        const colorBox = input({
            type: "color",
            value: colorValue.length ? colorValue : "#808080",
            title: colorValue.length ? colorValue : "",
            style: { width: "38px", height: "28px", padding: "0", border: "0", background: "transparent" },
            onchange: (e) => this.commitLineColor(index, parsed, (e.target as HTMLInputElement).value),
        });

        const clearColorBtn = button({
            textContent: "×",
            title: "clear",
            style: { width: "28px", height: "28px" },
            onclick: () => this.clearLineColor(index),
        });

        const removeBtn = button({
            textContent: "−",
            title: "remove line",
            style: { width: "28px", height: "28px" },
            onclick: () => this.removeLine(index),
        });

        return div(
            { style: { display: "flex", alignItems: "center", gap: "6px" } },
            lineIndex,
            div({ style: { flex: "1 1 auto", minWidth: "0" } }, textBox),
            colorBox,
            clearColorBtn,
            removeBtn,
        );
    }

    private handleLineTextKeyDown(
        e: KeyboardEvent,
        index: number,
        parsed: { text: string; color?: string },
    ) {
        e.stopPropagation();
        if (e.key === "Enter") {
            this.commitLineText(index, parsed, (e.target as HTMLInputElement).value);
        }
    }

    private commitLineText(index: number, parsed: { text: string; color?: string }, nextText: string) {
        Transaction.execute(this.document, "modify mtext line", () => {
            this.objects.forEach((obj) => {
                const node = obj as MTextNode;
                const rawLines = node.text.split(/\r?\n/);
                while (rawLines.length <= index) rawLines.push("");
                rawLines[index] = nextText ?? "";
                node.text = rawLines.join("\n");

                if (node.lineColors?.[index] === undefined && parsed.color) {
                    const nextColors = [...(node.lineColors ?? [])];
                    while (nextColors.length <= index) nextColors.push("");
                    nextColors[index] = parsed.color;
                    node.lineColors = nextColors;
                }
            });
            this.document.visual.update();
        });
    }

    private commitLineColor(index: number, parsed: { text: string; color?: string }, cssColor: string) {
        const normalized = this.toCssColor(cssColor);
        Transaction.execute(this.document, "modify mtext line color", () => {
            this.objects.forEach((obj) => {
                const node = obj as MTextNode;
                const nextColors = [...(node.lineColors ?? [])];
                while (nextColors.length <= index) nextColors.push("");
                nextColors[index] = normalized;
                node.lineColors = nextColors;

                if (parsed.color) {
                    const rawLines = node.text.split(/\r?\n/);
                    while (rawLines.length <= index) rawLines.push("");
                    rawLines[index] = parsed.text;
                    node.text = rawLines.join("\n");
                }
            });
            this.document.visual.update();
        });
    }

    private clearLineColor(index: number) {
        Transaction.execute(this.document, "clear mtext line color", () => {
            this.objects.forEach((obj) => {
                const node = obj as MTextNode;
                const nextColors = [...(node.lineColors ?? [])];
                if (index < nextColors.length) {
                    nextColors[index] = "";
                    while (
                        nextColors.length > 0 &&
                        (nextColors.at(-1) === "" || nextColors.at(-1) === undefined)
                    ) {
                        nextColors.pop();
                    }
                    node.lineColors = nextColors;
                }
            });
            this.document.visual.update();
        });
    }

    private addLine() {
        Transaction.execute(this.document, "add mtext line", () => {
            this.objects.forEach((obj) => {
                const node = obj as MTextNode;
                node.text = (node.text ?? "").length ? `${node.text}\n` : "";
            });
            this.document.visual.update();
        });
    }

    private removeLine(index: number) {
        Transaction.execute(this.document, "remove mtext line", () => {
            this.objects.forEach((obj) => {
                const node = obj as MTextNode;
                const rawLines = node.text.split(/\r?\n/);
                if (index < 0 || index >= rawLines.length) return;
                rawLines.splice(index, 1);
                node.text = rawLines.join("\n");

                const nextColors = [...(node.lineColors ?? [])];
                if (index < nextColors.length) {
                    nextColors.splice(index, 1);
                    while (
                        nextColors.length > 0 &&
                        (nextColors.at(-1) === "" || nextColors.at(-1) === undefined)
                    ) {
                        nextColors.pop();
                    }
                    node.lineColors = nextColors;
                }
            });
            this.document.visual.update();
        });
    }

    private parseInlineColoredLine(line: string): { text: string; color?: string } {
        const match = /^\s*\[(#[0-9A-Fa-f]{6}|[0-9A-Fa-f]{6})\]\s*/.exec(line);
        if (!match) return { text: line };
        const raw = match[1];
        const normalized = raw.startsWith("#") ? raw : `#${raw}`;
        return { text: line.slice(match[0].length), color: normalized };
    }

    private toCssColorOrEmpty(value: number | string | undefined) {
        if (value === "" || value === undefined || value === null) return "";
        return this.toCssColor(value);
    }

    private toCssColor(value: number | string): string {
        if (typeof value === "number" && Number.isFinite(value)) {
            return `#${value.toString(16).padStart(6, "0")}`;
        }
        if (typeof value === "string") {
            const v = value.trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v;
            if (/^[0-9A-Fa-f]{6}$/.test(v)) return `#${v}`;
            return v.length ? v : "#808080";
        }
        return "#808080";
    }
}

customElements.define("chili-mtext-lines-property", MTextLinesProperty);
