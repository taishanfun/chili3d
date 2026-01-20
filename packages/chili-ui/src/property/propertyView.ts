// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { button, div, Expander, input, label, option, select, span, textarea } from "chili-controls";
import {
    FolderNode,
    GroupNode,
    IDocument,
    INode,
    IView,
    Localize,
    Node,
    Property,
    PubSub,
    Transaction,
    VisualNode,
} from "chili-core";
import commonStyle from "./common.module.css";
import inputStyle from "./input.module.css";
import { MatrixProperty } from "./matrixProperty";
import { PropertyBase } from "./propertyBase";
import style from "./propertyView.module.css";
import { findPropertyControl } from "./utils";

export class PropertyView extends HTMLElement {
    private readonly panel = div({ className: style.panel });

    constructor(props: { className: string }) {
        super();
        this.classList.add(props.className, style.root);
        this.append(
            label({
                className: style.header,
                textContent: new Localize("properties.header"),
            }),
            this.panel,
        );
        PubSub.default.sub("showProperties", this.handleShowProperties);
        PubSub.default.sub("activeViewChanged", this.handleActiveViewChanged);
    }

    private readonly handleActiveViewChanged = (view: IView | undefined) => {
        if (view) {
            let nodes = view.document.selection.getSelectedNodes();
            this.handleShowProperties(view.document, nodes);
        }
    };

    private readonly handleShowProperties = (document: IDocument, nodes: INode[]) => {
        this.removeProperties();
        if (nodes.length === 0) return;
        this.addModel(document, nodes);
        this.addGeometry(nodes, document);
    };

    private removeProperties() {
        while (this.panel.lastElementChild) {
            this.panel.removeChild(this.panel.lastElementChild);
        }
    }

    private addModel(document: IDocument, nodes: INode[]) {
        if (nodes.length === 0) return;

        let controls: (HTMLElement | string)[] = [];
        if (nodes[0] instanceof FolderNode) {
            controls = Property.getProperties(Object.getPrototypeOf(nodes[0])).map((x) =>
                findPropertyControl(document, nodes, x),
            );
        } else if (nodes[0] instanceof Node) {
            controls = Property.getOwnProperties(Node.prototype).map((x) =>
                findPropertyControl(document, nodes, x),
            );
        }

        this.panel.append(div({ className: style.properties }, ...controls));
    }

    private addGeometry(nodes: INode[], document: IDocument) {
        const geometries = nodes.filter((x) => x instanceof VisualNode || x instanceof GroupNode);
        if (geometries.length === 0 || !this.isAllElementsOfTypeFirstElement(geometries)) return;
        this.addTransform(document, geometries);
        this.addParameters(geometries, document);
    }

    private addTransform(document: IDocument, geometries: (VisualNode | GroupNode)[]) {
        const matrix = new Expander("common.matrix");
        this.panel.append(matrix);

        matrix.contenxtPanel.append(new MatrixProperty(document, geometries, style.properties));
    }

    private addParameters(geometries: (VisualNode | GroupNode)[], document: IDocument) {
        const entities = geometries.filter((x) => x instanceof VisualNode);
        if (entities.length === 0 || !this.isAllElementsOfTypeFirstElement(entities)) return;
        const parameters = new Expander(entities[0].display());
        parameters.contenxtPanel.append(
            ...Property.getProperties(Object.getPrototypeOf(entities[0]), Node.prototype).map((x) =>
                findPropertyControl(document, entities, x),
            ),
        );
        this.panel.append(parameters);

        const custom = new Expander("common.customProperties");
        custom.contenxtPanel.append(new CustomPropertiesProperty(document, entities));
        this.panel.append(custom);
    }

    private isAllElementsOfTypeFirstElement(arr: any[]): boolean {
        if (arr.length <= 1) {
            return true;
        }
        const firstElementType = Object.getPrototypeOf(arr[0]).constructor;
        for (let i = 1; i < arr.length; i++) {
            if (Object.getPrototypeOf(arr[i]).constructor !== firstElementType) {
                return false;
            }
        }
        return true;
    }
}

class CustomPropertiesProperty extends PropertyBase {
    private data: Record<string, any> = {};
    private types: Record<string, string> = {};
    private readonly container: HTMLDivElement;
    private readonly rawBox: HTMLTextAreaElement;
    private readonly toggleModeBtn: HTMLButtonElement;
    private readonly applyBtn: HTMLButtonElement;
    private readonly formatBtn: HTMLButtonElement;
    private rawMode = false;
    private readonly defaultText: string;
    private readonly defaultTypesText: string;
    private readonly multiValue: boolean;
    private readonly supportedTypes = ["string", "number", "boolean", "object"] as const;

    constructor(
        private readonly document: IDocument,
        objects: Node[],
    ) {
        super(objects);
        const defaults = this.getDefaultText();
        this.defaultText = defaults.text;
        this.defaultTypesText = defaults.typesText;
        this.multiValue = defaults.multi;
        this.container = div({ style: { display: "flex", flexDirection: "column", gap: "6px" } });
        this.rawBox = textarea({
            className: inputStyle.box,
            rows: 10,
            style: { display: "none" },
            value: "",
            onkeydown: (e) => e.stopPropagation(),
        });
        this.toggleModeBtn = button({
            textContent: "JSON",
            onclick: () => this.toggleMode(),
        });
        this.applyBtn = button({
            textContent: "Apply",
            style: { display: "none" },
            onclick: () => this.applyRaw(),
        });
        this.formatBtn = button({
            textContent: "Format",
            style: { display: "none" },
            onclick: () => this.formatRaw(),
        });
        this.parseDefault();
        this.renderRows();
        this.append(
            div(
                { className: commonStyle.panel },
                div(
                    { style: { display: "flex", alignItems: "center", gap: "8px" } },
                    span({
                        className: commonStyle.propertyName,
                        textContent: new Localize("common.customProperties"),
                    }),
                    this.multiValue
                        ? span({
                              style: { opacity: "0.6" },
                              textContent: new Localize("properties.multivalue"),
                          })
                        : "",
                    div(
                        { style: { marginLeft: "auto", display: "flex", gap: "6px", alignItems: "center" } },
                        this.toggleModeBtn,
                        this.formatBtn,
                        this.applyBtn,
                    ),
                ),
                this.container,
                this.rawBox,
            ),
        );
    }

    private getDefaultText() {
        const values = this.objects.map((x) => x.customProperties ?? "");
        const types = this.objects.map((x) => x.customPropertyTypes ?? "");
        const uniqueValues = new Set(values);
        const uniqueTypes = new Set(types);
        return {
            text: uniqueValues.size === 1 ? values[0] : "",
            typesText: uniqueTypes.size === 1 ? types[0] : "",
            multi: uniqueValues.size > 1 || uniqueTypes.size > 1,
        };
    }

    private parseDefault() {
        const text = this.defaultText.trim();
        const typesText = this.defaultTypesText.trim();
        this.data = {};
        this.types = {};

        try {
            if (text.length) {
                const parsed = JSON.parse(text);
                this.data = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
            }
        } catch {
            this.data = {};
        }

        try {
            if (typesText.length) {
                const parsed = JSON.parse(typesText);
                this.types = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
            }
        } catch {
            this.types = {};
        }

        this.normalizeTypes();
    }

    private toggleMode() {
        this.rawMode = !this.rawMode;
        if (this.rawMode) {
            this.rawBox.value = Object.keys(this.data).length ? JSON.stringify(this.data, null, 2) : "";
        }
        this.updateMode();
    }

    private updateMode() {
        if (this.rawMode) {
            this.container.style.display = "none";
            this.rawBox.style.display = "";
            this.toggleModeBtn.textContent = "List";
            this.applyBtn.style.display = "";
            this.formatBtn.style.display = "";
        } else {
            this.container.style.display = "";
            this.rawBox.style.display = "none";
            this.toggleModeBtn.textContent = "JSON";
            this.applyBtn.style.display = "none";
            this.formatBtn.style.display = "none";
        }
    }

    private applyRaw() {
        const text = (this.rawBox.value ?? "").trim();
        if (!text.length) {
            this.data = {};
            this.types = {};
            this.commit();
            this.renderRows();
            return;
        }
        try {
            const parsed = JSON.parse(text);
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                PubSub.default.pub(
                    "showToast",
                    "error.default:{0}",
                    "customProperties must be a JSON object",
                );
                return;
            }
            this.data = parsed;
            this.types = {};
            this.normalizeTypes(true);
            this.commit();
            this.renderRows();
            this.rawBox.value = JSON.stringify(this.data, null, 2);
        } catch (e: any) {
            PubSub.default.pub("showToast", "error.default:{0}", e?.message ?? "Invalid JSON");
        }
    }

    private formatRaw() {
        const text = (this.rawBox.value ?? "").trim();
        if (!text.length) {
            this.rawBox.value = "";
            return;
        }
        try {
            const parsed = JSON.parse(text);
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                PubSub.default.pub(
                    "showToast",
                    "error.default:{0}",
                    "customProperties must be a JSON object",
                );
                return;
            }
            this.rawBox.value = JSON.stringify(parsed, null, 2);
        } catch (e: any) {
            PubSub.default.pub("showToast", "error.default:{0}", e?.message ?? "Invalid JSON");
        }
    }

    private renderRows() {
        this.container.replaceChildren();
        Object.entries(this.data).forEach(([k, v], i) => {
            this.container.appendChild(this.createRow(k, v, i));
        });
        this.container.appendChild(
            div(
                { style: { display: "flex", justifyContent: "flex-end" } },
                button({
                    textContent: "+",
                    onclick: () => this.addRow(),
                }),
            ),
        );
    }

    private addRow() {
        let index = 1;
        let key = "key";
        while (this.data.hasOwnProperty(key)) {
            key = `key${index++}`;
        }
        this.data[key] = "";
        this.types[key] = "string";
        this.commit();
        this.renderRows();
    }

    private createRow(key: string, value: any, index: number) {
        const currentType = this.getType(key, value);
        const typeSelect = select(
            {
                className: inputStyle.box,
                style: { width: "110px", height: "28px" },
                onchange: (e) => this.changeType(key, (e.target as HTMLSelectElement).value),
                onkeydown: (e) => e.stopPropagation(),
            },
            ...this.supportedTypes.map((t) =>
                option({
                    textContent: t,
                    selected: t === currentType,
                }),
            ),
        );

        const keyBox = input({
            className: inputStyle.box,
            value: key,
            onkeydown: (e) => e.stopPropagation(),
            onblur: (e) => this.renameKey(key, (e.target as HTMLInputElement).value),
        });

        const removeBtn = button({
            textContent: "−",
            onclick: () => this.removeRow(key),
            style: { width: "28px", height: "28px" },
        });

        if (currentType === "boolean") {
            const trueBtn = button({
                textContent: "true",
                style: { width: "48px", height: "28px" },
                onclick: () => this.setEntryValue(key, true),
            });
            const falseBtn = button({
                textContent: "false",
                style: { width: "48px", height: "28px" },
                onclick: () => this.setEntryValue(key, false),
            });
            return div(
                { style: { display: "flex", alignItems: "center", gap: "6px" } },
                span({ textContent: `${index + 1}.` }),
                div({ style: { flex: "0 0 240px" } }, keyBox),
                typeSelect,
                trueBtn,
                falseBtn,
                removeBtn,
            );
        }

        if (currentType === "number") {
            const valueBox = input({
                className: inputStyle.box,
                value: String(typeof value === "number" ? value : 0),
                onkeydown: (e) => e.stopPropagation(),
                onblur: (e) => {
                    const text = (e.target as HTMLInputElement).value.trim();
                    if (!text.length) {
                        this.setEntryValue(key, 0);
                        (e.target as HTMLInputElement).value = "0";
                        return;
                    }
                    const num = Number(text);
                    if (Number.isFinite(num)) {
                        this.setEntryValue(key, num);
                    } else {
                        PubSub.default.pub("showToast", "error.default:{0}", "Invalid number");
                        (e.target as HTMLInputElement).value = String(typeof value === "number" ? value : 0);
                    }
                },
            });
            return div(
                { style: { display: "flex", alignItems: "center", gap: "6px" } },
                span({ textContent: `${index + 1}.` }),
                div({ style: { flex: "0 0 240px" } }, keyBox),
                typeSelect,
                div({ style: { flex: "1 1 auto", minWidth: "0" } }, valueBox),
                removeBtn,
            );
        }

        if (currentType === "string") {
            const valueBox = input({
                className: inputStyle.box,
                value: typeof value === "string" ? value : "",
                onkeydown: (e) => e.stopPropagation(),
                onblur: (e) => this.setEntryValue(key, (e.target as HTMLInputElement).value),
            });
            return div(
                { style: { display: "flex", alignItems: "center", gap: "6px" } },
                span({ textContent: `${index + 1}.` }),
                div({ style: { flex: "0 0 240px" } }, keyBox),
                typeSelect,
                div({ style: { flex: "1 1 auto", minWidth: "0" } }, valueBox),
                removeBtn,
            );
        }

        const valueBox = textarea({
            className: inputStyle.box,
            rows: 4,
            value: JSON.stringify(value, null, 2),
            onkeydown: (e) => e.stopPropagation(),
            onblur: (e) => {
                const text = (e.target as HTMLTextAreaElement).value.trim();
                if (!text.length) {
                    this.setEntryValue(key, {});
                    (e.target as HTMLTextAreaElement).value = "{}";
                    return;
                }
                try {
                    const parsed = JSON.parse(text);
                    this.setEntryValue(key, parsed);
                } catch (err: any) {
                    PubSub.default.pub("showToast", "error.default:{0}", err?.message ?? "Invalid JSON");
                    (e.target as HTMLTextAreaElement).value = JSON.stringify(value, null, 2);
                }
            },
        });
        return div(
            { style: { display: "flex", alignItems: "flex-start", gap: "6px" } },
            span({ textContent: `${index + 1}.` }),
            div({ style: { flex: "0 0 240px" } }, keyBox),
            typeSelect,
            div({ style: { flex: "1 1 auto", minWidth: "0" } }, valueBox),
            removeBtn,
        );
    }

    private removeRow(key: string) {
        delete this.data[key];
        delete this.types[key];
        this.commit();
        this.renderRows();
    }

    private renameKey(oldKey: string, newKey: string) {
        const trimmed = newKey.trim();
        if (!trimmed.length || oldKey === trimmed) return;
        if (this.data.hasOwnProperty(trimmed)) {
            PubSub.default.pub("showToast", "error.default:{0}", "Duplicate key");
            return;
        }
        const value = this.data[oldKey];
        const type = this.types[oldKey];
        delete this.data[oldKey];
        delete this.types[oldKey];
        this.data[trimmed] = value;
        if (type) {
            this.types[trimmed] = type;
        }
        this.commit();
        this.renderRows();
    }

    private setEntryValue(key: string, value: any) {
        this.data[key] = value;
        this.commit();
    }

    private getType(key: string, value: any): (typeof this.supportedTypes)[number] {
        const t = this.types[key];
        if (t && (this.supportedTypes as readonly string[]).includes(t)) {
            return t as (typeof this.supportedTypes)[number];
        }
        return this.inferType(value);
    }

    private inferType(value: any): (typeof this.supportedTypes)[number] {
        if (typeof value === "boolean") return "boolean";
        if (typeof value === "number") return "number";
        if (typeof value === "string") return "string";
        return "object";
    }

    private normalizeTypes(overwriteFromValues: boolean = false) {
        const keys = Object.keys(this.data);
        const normalized: Record<string, string> = {};

        for (const key of keys) {
            const inferred = this.inferType(this.data[key]);
            const existing = this.types?.[key];
            const selected =
                overwriteFromValues ||
                !existing ||
                !(this.supportedTypes as readonly string[]).includes(existing)
                    ? inferred
                    : existing;
            normalized[key] = selected;
        }

        this.types = normalized;
    }

    private changeType(key: string, type: string) {
        if (!(this.supportedTypes as readonly string[]).includes(type)) return;
        const nextType = type as (typeof this.supportedTypes)[number];
        this.types[key] = nextType;
        this.data[key] = this.convertValue(this.data[key], nextType);
        this.commit();
        this.renderRows();
        if (this.rawMode) {
            this.rawBox.value = Object.keys(this.data).length ? JSON.stringify(this.data, null, 2) : "";
        }
    }

    private convertValue(value: any, type: (typeof this.supportedTypes)[number]) {
        if (type === "string") {
            if (value === null || value === undefined) return "";
            if (typeof value === "string") return value;
            if (typeof value === "object") return JSON.stringify(value);
            return String(value);
        }

        if (type === "number") {
            if (typeof value === "number" && Number.isFinite(value)) return value;
            if (typeof value === "boolean") return value ? 1 : 0;
            if (typeof value === "string") {
                const num = Number(value.trim());
                return Number.isFinite(num) ? num : 0;
            }
            return 0;
        }

        if (type === "boolean") {
            if (typeof value === "boolean") return value;
            if (typeof value === "number") return value !== 0;
            if (typeof value === "string") {
                const t = value.trim().toLowerCase();
                if (["true", "1", "yes", "y", "on"].includes(t)) return true;
                if (["false", "0", "no", "n", "off", ""].includes(t)) return false;
                return true;
            }
            return Boolean(value);
        }

        if (type === "object") {
            if (value && typeof value === "object") return value;
            if (typeof value === "string") {
                const text = value.trim();
                if (!text.length) return {};
                try {
                    return JSON.parse(text);
                } catch {
                    return {};
                }
            }
            if (value === null) return null;
            return {};
        }
    }

    private commit() {
        Transaction.execute(this.document, "modify property", () => {
            const text = JSON.stringify(this.data, null, 2);
            const typesText = Object.keys(this.types).length ? JSON.stringify(this.types, null, 2) : "";
            this.objects.forEach((x) => {
                x.customProperties = text;
                x.customPropertyTypes = typesText;
            });
            this.document.visual.update();
        });
    }
}

customElements.define("chili-custom-properties-property", CustomPropertiesProperty);
customElements.define("chili-property-view", PropertyView);
