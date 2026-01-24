// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { div, span, svg } from "chili-controls";
import { Localize } from "chili-core";
import style from "./okCancel.module.css";
export class OKCancel extends HTMLElement {
    control;
    constructor() {
        super();
        this.className = style.root;
        this.append(this.container());
    }
    container() {
        return div(
            { className: style.container },
            span({ textContent: new Localize("ribbon.group.selection") }),
            div({ className: style.spacer }),
            this.buttons(),
        );
    }
    buttons() {
        return div(
            { className: style.panel },
            this._createIcon("icon-confirm", "common.confirm", this._onConfirm),
            this._createIcon("icon-cancel", "common.cancel", this._onCancel),
        );
    }
    _createIcon(icon, text, onClick) {
        return div(
            {
                className: style.icon,
                onclick: onClick,
            },
            svg({ icon }),
            span({ textContent: new Localize(text) }),
        );
    }
    setControl(control) {
        this.control = control;
    }
    _onConfirm = () => {
        this.control?.success();
    };
    _onCancel = () => {
        this.control?.cancel();
    };
}
customElements.define("ok-cancel", OKCancel);
