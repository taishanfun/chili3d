// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { div, setSVGIcon, svg } from "chili-controls";
import { TreeItem } from "./treeItem";
import style from "./treeItemGroup.module.css";
export class TreeGroup extends TreeItem {
    _isExpanded = true;
    header;
    items = div({ className: `${style.container} ${style.left16px}` });
    expanderIcon;
    constructor(document, node) {
        super(document, node);
        this.expanderIcon = svg({
            icon: this.getExpanderIcon(),
            className: style.expanderIcon,
            onclick: this.handleExpanderClick,
        });
        this.header = div(
            { className: `${style.row} ${style.header}` },
            this.expanderIcon,
            this.name,
            this.visibleIcon,
        );
        super.append(div({ className: style.container }, this.header, this.items));
    }
    get isExpanded() {
        return this._isExpanded;
    }
    set isExpanded(value) {
        this._isExpanded = value;
        setSVGIcon(this.expanderIcon, this.getExpanderIcon());
        this.items.classList.toggle(style.hide, !this._isExpanded);
    }
    getSelectedHandler() {
        return this.header;
    }
    dispose() {
        super.dispose();
        this.header.remove();
        this.expanderIcon.removeEventListener("click", this.handleExpanderClick);
    }
    handleExpanderClick = (e) => {
        e.stopPropagation();
        this.isExpanded = !this._isExpanded;
    };
    getExpanderIcon() {
        return this._isExpanded ? "icon-angle-down" : "icon-angle-right";
    }
    appendChild(node) {
        this.items.appendChild(node);
        return node;
    }
    append(...nodes) {
        this.items.append(...nodes);
    }
    removeChild(child) {
        if (child.parentNode === this.items) this.items.removeChild(child);
        return child;
    }
    addItem(...items) {
        this.items.append(...items);
        return this;
    }
    insertAfter(item, child) {
        const referenceNode = child ? child.nextSibling : this.items.firstChild;
        this.items.insertBefore(item, referenceNode);
    }
}
customElements.define("tree-group", TreeGroup);
