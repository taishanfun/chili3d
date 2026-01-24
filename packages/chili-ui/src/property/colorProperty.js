// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { ColorConverter, div, input, label } from "chili-controls";
import { Binding, Localize, PubSub, Transaction } from "chili-core";
import colorStyle from "./colorPorperty.module.css";
import commonStyle from "./common.module.css";
import { PropertyBase } from "./propertyBase";
export class ColorProperty extends PropertyBase {
    document;
    property;
    converter = new ColorConverter();
    input;
    constructor(document, objects, property) {
        super(objects);
        this.document = document;
        this.property = property;
        this.input = this.createInput(objects[0]);
        this.appendChild(this.createPanel());
    }
    createInput(object) {
        return input({
            className: colorStyle.color,
            type: "color",
            value: new Binding(object, this.property.name, this.converter),
            onchange: this.setColor,
        });
    }
    createPanel() {
        return div(
            { className: commonStyle.panel },
            label({
                className: commonStyle.propertyName,
                textContent: new Localize(this.property.display),
            }),
            this.input,
        );
    }
    disconnectedCallback() {
        this.input.removeEventListener("onchange", this.setColor);
    }
    setColor = (e) => {
        const value = e.target.value;
        const color = this.converter.convertBack(value).value;
        if (color === undefined) {
            PubSub.default.pub("showToast", "toast.converter.invalidColor");
            return;
        }
        Transaction.execute(this.document, "change color", () => {
            this.objects.forEach((x) => {
                x[this.property.name] = color;
            });
        });
    };
}
customElements.define("chili-color-property", ColorProperty);
