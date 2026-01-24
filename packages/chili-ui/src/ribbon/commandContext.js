// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { MultistepCommand } from "chili";
import {
    button,
    ColorConverter,
    div,
    input,
    label,
    option,
    select,
    svg,
    UrlStringConverter,
} from "chili-controls";
import {
    Binding,
    CancelableCommand,
    Combobox,
    Command,
    I18n,
    Localize,
    Observable,
    PathBinding,
    Property,
    PubSub,
} from "chili-core";
import style from "./commandContext.module.css";
export class CommandContext extends HTMLElement {
    command;
    propMap = new Map();
    constructor(command) {
        super();
        this.command = command;
        this.className = style.panel;
        let data = Command.getData(command);
        this.append(
            svg({ className: style.icon, icon: data.icon }),
            label({ className: style.title, textContent: new Localize(`command.${data.key}`) }, `: `),
        );
        this.initContext();
    }
    connectedCallback() {
        if (this.command instanceof Observable) {
            this.command.onPropertyChanged(this.onPropertyChanged);
        }
    }
    disconnectedCallback() {
        if (this.command instanceof Observable) {
            this.command.removePropertyChanged(this.onPropertyChanged);
        }
    }
    dispose() {
        this.propMap.clear();
    }
    onPropertyChanged = (property) => {
        if (this.propMap.has(property)) {
            const items = this.propMap.get(property);
            for (const [prop, control] of items) {
                this.setVisible(control, prop);
            }
        }
    };
    initContext() {
        const groupMap = new Map();
        Property.getProperties(this.command).forEach((property) => {
            const group = this.findGroup(groupMap, property);
            const item = this.createItem(this.command, property);
            this.setVisible(item, property);
            this.cacheDependencies(item, property);
            group.append(item);
        });
    }
    cacheDependencies(item, g) {
        if (g.dependencies) {
            for (const d of g.dependencies) {
                const items = this.propMap.get(d.property);
                this.propMap.set(d.property, [...(items ?? []), [g, item]]);
            }
        }
    }
    setVisible(control, property) {
        let visible = true;
        if (property.dependencies) {
            for (const d of property.dependencies) {
                if (this.command[d.property] !== d.value) {
                    visible = false;
                    break;
                }
            }
        }
        control.style.display = visible ? "inherit" : "none";
    }
    findGroup(groupMap, prop) {
        let group = groupMap.get(prop.group);
        if (group === undefined) {
            group = div({ className: style.group });
            groupMap.set(prop.group, group);
            this.append(group);
        }
        return group;
    }
    createItem(command, g) {
        const noType = command;
        const type = typeof noType[g.name];
        if (g.type === "materialId") {
            return this.materialEditor(g, noType);
        }
        switch (type) {
            case "function":
                return this.newButton(g, noType);
            case "boolean":
                return this.newCheckbox(g, noType);
            case "number":
                return this.newInput(g, noType, parseFloat);
            case "string":
                return this.newInput(g, noType);
            default:
                if (noType[g.name] instanceof Combobox) {
                    return this.newCombobox(noType, g);
                }
                throw new Error("暂不支持的类型");
        }
    }
    newCombobox(noType, g) {
        let combobox = noType[g.name];
        let options = combobox.items.map((item, index) => {
            return option({
                selected: index === combobox.selectedIndex,
                textContent: I18n.isI18nKey(item)
                    ? new Localize(item)
                    : (combobox.converter?.convert(item).unchecked() ?? String(item)),
            });
        });
        return div(
            label({ textContent: new Localize(g.display) }),
            select(
                {
                    className: style.select,
                    onchange: (e) => {
                        combobox.selectedIndex = e.target.selectedIndex;
                    },
                },
                ...options,
            ),
        );
    }
    newInput(g, noType, converter) {
        return div(
            label({ textContent: new Localize(g.display) }),
            input({
                type: "text",
                className: style.input,
                value: new Binding(noType, g.name),
                onblur: (e) => {
                    const input = e.target;
                    noType[g.name] = converter ? converter(input.value) : input.value;
                },
                onkeydown: (e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") {
                        const input = e.target;
                        input.blur();
                    }
                },
            }),
        );
    }
    newCheckbox(g, noType) {
        return div(
            label({ textContent: new Localize(g.display) }),
            input({
                type: "checkbox",
                checked: new Binding(noType, g.name),
                onclick: () => {
                    noType[g.name] = !noType[g.name];
                },
            }),
        );
    }
    newButton(g, noType) {
        return button({
            className: style.button,
            textContent: new Localize(g.display),
            onclick: () => noType[g.name](),
        });
    }
    materialEditor(g, noType) {
        if (!(this.command instanceof CancelableCommand)) {
            throw new Error("MaterialEditor only support CancelableCommand");
        }
        const material = this.command.document.materials.find((x) => x.id === noType[g.name]);
        const display = material.clone();
        return button({
            className: style.materialButton,
            style: {
                backgroundColor: new Binding(display, "color", new ColorConverter()),
                backgroundImage: new PathBinding(display, "map.image", new UrlStringConverter()),
                backgroundBlendMode: "multiply",
                backgroundSize: "cover",
                cursor: "pointer",
            },
            textContent: new Localize(g.display),
            onclick: () => {
                if (this.command instanceof MultistepCommand) {
                    PubSub.default.pub("editMaterial", this.command.document, material, (newMaterial) => {
                        noType[g.name] = newMaterial.id;
                        display.color = newMaterial.color;
                        display.map = newMaterial.map;
                    });
                }
            },
        });
    }
}
customElements.define("command-context", CommandContext);
