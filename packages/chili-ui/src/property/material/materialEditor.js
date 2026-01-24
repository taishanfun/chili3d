// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { button, collection, ColorConverter, div, span, svg } from "chili-controls";
import { UrlStringConverter } from "chili-controls/src/converters/urlConverter";
import { Binding, Localize, PathBinding, Property, PubSub, Result, Texture } from "chili-core";
import { findPropertyControl } from "../utils";
import style from "./materialEditor.module.css";
class ActiveStyleConverter {
    material;
    constructor(material) {
        this.material = material;
    }
    convert(value) {
        return Result.ok(this.material === value ? `${style.material} ${style.active}` : style.material);
    }
}
export class MaterialEditor extends HTMLElement {
    dataContent;
    editingControl;
    colorConverter = new ColorConverter();
    constructor(dataContent) {
        super();
        this.dataContent = dataContent;
        this.editingControl = div({ className: style.properties });
        this.initEditingControl(dataContent.editingMaterial);
        this.append(this.createEditorUI());
    }
    createEditorUI() {
        return div(
            { className: style.root },
            this.titleSection(),
            this.materialsCollection(),
            this.editingControl,
            this.buttons(),
        );
    }
    titleSection() {
        return div(
            { className: style.title },
            span({ textContent: new Localize("common.material") }),
            this.iconButton("icon-plus", () => this.dataContent.addMaterial()),
            this.iconButton("icon-clone", () => this.dataContent.copyMaterial()),
            this.iconButton("icon-trash", () => this.dataContent.deleteMaterial()),
        );
    }
    iconButton(icon, onclick) {
        return svg({ icon, onclick });
    }
    materialsCollection() {
        return collection({
            className: style.materials,
            sources: this.dataContent.document.materials,
            template: (material) => this.material(material),
        });
    }
    material(material) {
        return span({
            className: new Binding(this.dataContent, "editingMaterial", new ActiveStyleConverter(material)),
            title: material.name,
            style: {
                backgroundColor: new Binding(material, "color", this.colorConverter),
                backgroundImage: new PathBinding(material, "map.image", new UrlStringConverter()),
                backgroundBlendMode: "multiply",
                backgroundSize: "contain",
            },
            onclick: () => {
                this.dataContent.editingMaterial = material;
            },
            ondblclick: () => {
                this.dataContent.callback(material);
                this.remove();
            },
        });
    }
    buttons() {
        return div(
            { className: style.bottom },
            button({
                textContent: new Localize("common.confirm"),
                onclick: () => {
                    this.dataContent.callback(this.dataContent.editingMaterial);
                    this.remove();
                },
            }),
            button({
                textContent: new Localize("common.cancel"),
                onclick: () => this.remove(),
            }),
        );
    }
    connectedCallback() {
        this.dataContent.onPropertyChanged(this._onEditingMaterialChanged);
        PubSub.default.sub("showProperties", this._handleShowProperty);
    }
    disconnectedCallback() {
        PubSub.default.remove("showProperties", this._handleShowProperty);
    }
    _handleShowProperty = () => {
        this.remove();
    };
    _onEditingMaterialChanged = (property) => {
        if (property !== "editingMaterial") return;
        this.editingControl.firstChild?.remove();
        this.initEditingControl(this.dataContent.editingMaterial);
    };
    initEditingControl(material) {
        this.editingControl.innerHTML = "";
        const isTexture = (p) => {
            return material[p.name] instanceof Texture;
        };
        let properties = Property.getProperties(material);
        this.editingControl.append(
            ...properties
                .filter((x) => !isTexture(x))
                .map((x) => findPropertyControl(this.dataContent.document, [material], x)),
            ...properties
                .filter(isTexture)
                .map((x) => findPropertyControl(this.dataContent.document, [material], x)),
        );
    }
}
customElements.define("material-editor", MaterialEditor);
