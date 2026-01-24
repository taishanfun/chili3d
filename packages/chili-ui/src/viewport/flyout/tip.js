// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { MessageType } from "chili-core";
import style from "./tip.module.css";
export class Tip extends HTMLElement {
    color;
    constructor(msg, type) {
        super();
        this.className = style.tip;
        this.set(msg, type);
    }
    set(msg, type) {
        if (this.textContent !== msg) {
            this.textContent = msg;
        }
        let newStyle = this.getStyle(type);
        this.setStyle(newStyle);
    }
    setStyle(newStyle) {
        if (this.color !== newStyle && newStyle !== undefined) {
            if (this.color !== undefined) this.classList.remove(this.color);
            this.classList.add(newStyle);
            this.color = newStyle;
        }
    }
    getStyle(type) {
        switch (type) {
            case MessageType.error:
                return style.error;
            case MessageType.warn:
                return style.warn;
            default:
                return style.info;
        }
    }
}
customElements.define("chili-tip", Tip);
