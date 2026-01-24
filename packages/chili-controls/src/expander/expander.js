// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Localize } from "chili-core";
import style from "./expander.module.css";
import { div, label, setSVGIcon, svg } from "../controls";
export class Expander extends HTMLElement {
    _isExpanded = true;
    expanderIcon;
    headerPanel = div({ className: style.headerPanel });
    contenxtPanel = div({ className: style.contextPanel });
    constructor(header) {
        super();
        this.className = style.rootPanel;
        this.expanderIcon = svg({
            icon: this.getExpanderIcon(),
            className: style.expanderIcon,
            onclick: this._handleExpanderClick,
        });
        const text = label({
            textContent: new Localize(header),
            className: style.headerText,
        });
        this.headerPanel.append(this.expanderIcon, text);
        super.append(this.headerPanel, this.contenxtPanel);
    }
    appendChild(node) {
        return this.contenxtPanel.appendChild(node);
    }
    append(...nodes) {
        this.contenxtPanel.append(...nodes);
    }
    removeChild(child) {
        return this.contenxtPanel.removeChild(child);
    }
    addItem(...nodes) {
        this.append(...nodes);
        return this;
    }
    getExpanderIcon() {
        return this._isExpanded ? "icon-angle-down" : "icon-angle-right";
    }
    _handleExpanderClick = (e) => {
        e.stopPropagation();
        this._isExpanded = !this._isExpanded;
        setSVGIcon(this.expanderIcon, this.getExpanderIcon());
        this.contenxtPanel.classList.toggle(style.hidden, !this._isExpanded);
    };
}
customElements.define("chili-expander", Expander);
