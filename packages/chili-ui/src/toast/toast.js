// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { I18n } from "chili-core";
import { label } from "chili-controls";
import style from "./toast.module.css";
export class Toast {
    static _lastToast;
    static info = (message, ...args) => {
        Toast.display(style.info, I18n.translate(message, ...args));
    };
    static error = (message) => {
        Toast.display(style.error, message);
    };
    static warn = (message) => {
        Toast.display(style.warning, message);
    };
    static display(type, message) {
        if (this._lastToast) {
            clearTimeout(this._lastToast[0]);
            this._lastToast[1].remove();
        }
        const toast = label({ className: `${style.toast} ${type}`, textContent: message });
        document.body.appendChild(toast);
        this._lastToast = [
            window.setTimeout(() => {
                toast.remove();
                this._lastToast = undefined;
            }, 2000),
            toast,
        ];
    }
}
