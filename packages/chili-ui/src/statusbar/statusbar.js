// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { div, label } from "chili-controls";
import { Config, I18n, Navigation3D, PubSub } from "chili-core";
import { SnapConfig } from "./snapConfig";
import style from "./statusbar.module.css";
export class Statusbar extends HTMLElement {
    _isDefaultTip = true;
    tip = label({
        textContent: "",
        className: style.tip,
    });
    constructor(className) {
        super();
        this.className = `${style.panel} ${className}`;
        this.setDefaultTip();
        this.render();
        PubSub.default.sub("statusBarTip", this.statusBarTip);
        PubSub.default.sub("clearStatusBarTip", this.setDefaultTip);
        Config.instance.onPropertyChanged(this.handleConfigChanged);
    }
    handleConfigChanged = (prop) => {
        if (prop === "navigation3DIndex" && this._isDefaultTip) {
            this.setDefaultTip();
        }
    };
    render() {
        this.append(
            div({ className: style.left }, this.tip),
            div({ className: style.right }, new SnapConfig()),
        );
    }
    statusBarTip = (tip) => {
        this._isDefaultTip = false;
        I18n.set(this.tip, "textContent", tip);
    };
    setDefaultTip = () => {
        this._isDefaultTip = true;
        const { pan, rotate } = Navigation3D.navigationKeyMap();
        I18n.set(this.tip, "textContent", "prompt.default{0}{1}", pan, rotate);
    };
}
customElements.define("chili-statusbar", Statusbar);
