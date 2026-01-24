// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { label, setSVGIcon, svg } from "chili-controls";
import { Binding, Transaction } from "chili-core";
import style from "./treeItem.module.css";
export class TreeItem extends HTMLElement {
    document;
    name;
    visibleIcon;
    _node;
    get node() {
        return this._node;
    }
    constructor(document, node) {
        super();
        this.document = document;
        this._node = node;
        this.draggable = true;
        this.name = label({
            className: style.name,
            textContent: new Binding(node, "name"),
        });
        this.visibleIcon = svg({
            className: style.icon,
            icon: this.getVisibleIcon(),
            onclick: this.onVisibleIconClick,
        });
        this.setVisibleStyle(node.parentVisible);
    }
    connectedCallback() {
        this.node.onPropertyChanged(this.onPropertyChanged);
    }
    disconnectedCallback() {
        this.node.removePropertyChanged(this.onPropertyChanged);
    }
    onPropertyChanged = (property, model) => {
        if (property === "visible") {
            setSVGIcon(this.visibleIcon, this.getVisibleIcon());
        } else if (property === "parentVisible") {
            this.setVisibleStyle(model[property]);
        }
    };
    setVisibleStyle(parentVisible) {
        if (parentVisible === true) {
            this.visibleIcon.classList.remove(style["parent-hidden"]);
        } else {
            this.visibleIcon.classList.add(style["parent-hidden"]);
        }
    }
    addSelectedStyle(style) {
        this.getSelectedHandler().classList.add(style);
    }
    removeSelectedStyle(style) {
        this.getSelectedHandler().classList.remove(style);
    }
    dispose() {
        this.remove();
        this.node.removePropertyChanged(this.onPropertyChanged);
        this.visibleIcon.removeEventListener("click", this.onVisibleIconClick);
        this.document = null;
        this._node = null;
    }
    getVisibleIcon() {
        return this.node.visible ? "icon-eye" : "icon-eye-slash";
    }
    onVisibleIconClick = (e) => {
        e.stopPropagation();
        Transaction.execute(this.document, "change visible", () => {
            this.node.visible = !this.node.visible;
        });
        this.document.visual.update();
    };
}
