// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { label, svg } from "chili-controls";
import { ButtonSize, Command, I18n, Localize, Logger, PubSub, Result } from "chili-core";
import style from "./ribbonButton.module.css";
export class RibbonButton extends HTMLElement {
    onClick;
    constructor(display, icon, size, onClick) {
        super();
        this.onClick = onClick;
        this.initHTML(display, icon, size);
        this.addEventListener("click", onClick);
    }
    static fromCommandName(commandName, size) {
        const data = Command.getData(commandName);
        if (!data) {
            Logger.warn(`commandData of ${commandName} is undefined`);
            return undefined;
        }
        if (data.toggle) {
            return new RibbonToggleButton(data, size);
        }
        return new RibbonButton(`command.${data.key}`, data.icon, size, () => {
            PubSub.default.pub("executeCommand", commandName);
        });
    }
    dispose() {
        this.removeEventListener("click", this.onClick);
    }
    initHTML(display, icon, size) {
        const image = svg({ icon });
        this.className = size === ButtonSize.large ? style.normal : style.small;
        image.classList.add(size === ButtonSize.large ? style.icon : style.smallIcon);
        const text = label({
            className: size === ButtonSize.large ? style.largeButtonText : style.smallButtonText,
            textContent: new Localize(display),
        });
        I18n.set(this, "title", display);
        this.append(image, text);
    }
}
customElements.define("ribbon-button", RibbonButton);
class ToggleConverter {
    className;
    active;
    constructor(className, active) {
        this.className = className;
        this.active = active;
    }
    convert(isChecked) {
        return isChecked ? Result.ok(`${this.className} ${this.active}`) : Result.ok(this.className);
    }
}
export class RibbonToggleButton extends RibbonButton {
    constructor(data, size) {
        super(`command.${data.key}`, data.icon, size, () => {
            PubSub.default.pub("executeCommand", data.key);
        });
        if (data.toggle) {
            data.toggle.converter = new ToggleConverter(this.className, style.checked);
            data.toggle.setBinding(this, "className");
        }
    }
}
customElements.define("ribbon-toggle-button", RibbonToggleButton);
