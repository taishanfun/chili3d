// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { input, label } from "chili-controls";
import { I18n, Localize } from "chili-core";
import style from "./input.module.css";
export class Input extends HTMLElement {
    handler;
    _cancelledCallbacks = [];
    _completedCallbacks = [];
    textbox;
    tip;
    constructor(text, handler) {
        super();
        this.handler = handler;
        this.className = style.panel;
        this.textbox = input({
            value: text,
            onkeydown: this.handleKeyDown,
        });
        this.append(this.textbox);
    }
    onCancelled(callback) {
        this._cancelledCallbacks.push(callback);
    }
    onCompleted(callback) {
        this._completedCallbacks.push(callback);
    }
    get text() {
        return this.textbox.value;
    }
    focus() {
        this.textbox.focus();
    }
    dispose() {
        this._cancelledCallbacks.length = 0;
        this._completedCallbacks.length = 0;
    }
    showTip(tip) {
        if (this.tip === undefined) {
            this.tip = label({
                textContent: new Localize(tip),
                className: style.error,
            });
            this.append(this.tip);
        } else {
            I18n.set(this.tip, "textContent", tip);
        }
    }
    removeTip() {
        if (this.tip === undefined) return;
        this.removeChild(this.tip);
        this.tip = undefined;
    }
    handleKeyDown = (e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
            this.processEnterKey();
        } else if (e.key === "Escape") {
            this._cancelledCallbacks.forEach((callback) => callback());
        } else {
            this.removeTip();
        }
    };
    processEnterKey() {
        this.textbox.readOnly = true;
        const error = this.handler(this.textbox.value);
        if (error.isOk) {
            this._completedCallbacks.forEach((callback) => callback());
        } else {
            this.textbox.readOnly = false;
            this.showTip(error.error);
        }
    }
}
customElements.define("chili-input", Input);
