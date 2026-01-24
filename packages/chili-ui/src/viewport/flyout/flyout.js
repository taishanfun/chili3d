// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { PubSub } from "chili-core";
import style from "./flyout.module.css";
import { Input } from "./input";
import { Tip } from "./tip";
export class Flyout extends HTMLElement {
    _tip;
    _input;
    lastFocus = null;
    constructor() {
        super();
        this.className = style.root;
    }
    connectedCallback() {
        PubSub.default.sub("showFloatTip", this.showTip);
        PubSub.default.sub("clearFloatTip", this.clearTip);
        PubSub.default.sub("showInput", this.displayInput);
        PubSub.default.sub("clearInput", this.clearInput);
    }
    disconnectedCallback() {
        PubSub.default.remove("showFloatTip", this.showTip);
        PubSub.default.remove("clearFloatTip", this.clearTip);
        PubSub.default.remove("showInput", this.displayInput);
        PubSub.default.remove("clearInput", this.clearInput);
    }
    showTip = (dom) => {
        if (dom instanceof HTMLElement) {
            this._tip?.remove();
            this._tip = dom;
            this.append(this._tip);
        } else if (this._tip instanceof Tip) {
            this._tip.set(dom.msg, dom.level);
        } else {
            this._tip?.remove();
            this._tip = new Tip(dom.msg, dom.level);
            this.append(this._tip);
        }
    };
    clearTip = () => {
        if (this._tip !== undefined) {
            this._tip.remove();
            this._tip = undefined;
        }
    };
    displayInput = (text, handler) => {
        if (this._input === undefined) {
            this.lastFocus = document.activeElement;
            this._input = new Input(text, handler);
            this._input.onCancelled(this.clearInput);
            this._input.onCompleted(this.clearInput);
            this.append(this._input);
            this._input.focus();
        }
    };
    clearInput = () => {
        if (this._input !== undefined) {
            this.removeChild(this._input);
            this._input.dispose();
            this._input = undefined;
            this.lastFocus?.focus();
        }
    };
}
customElements.define("chili-flyout", Flyout);
