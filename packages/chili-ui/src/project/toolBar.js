// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { a, button, ColorConverter, div, input, label, option, select, span, svg } from "chili-controls";
import { Binding, I18n, INode, Layer, LineType, PubSub, Transaction, VisualNode } from "chili-core";
import { Dialog } from "../dialog";
import style from "./toolBar.module.css";
import { TreeGroup } from "./tree/treeItemGroup";
export class ToolBar extends HTMLElement {
    projectView;
    constructor(projectView) {
        super();
        this.projectView = projectView;
        this.className = style.panel;
        this.render();
    }
    render() {
        const buttons = [
            { icon: "icon-folder-plus", tip: "items.tool.newFolder", command: this.newGroup },
            { icon: "icon-unexpand", tip: "items.tool.unexpandAll", command: this.unExpandAll },
            { icon: "icon-expand", tip: "items.tool.expandAll", command: this.expandAll },
            { icon: "icon-eye", tip: "layer.title", command: this.openLayers },
        ];
        buttons.forEach(({ icon, tip, command }) => this.button(icon, tip, command));
    }
    button(icon, tip, command) {
        this.append(
            a(
                { title: I18n.translate(tip) },
                svg({
                    icon,
                    className: style.svg,
                    onclick: command,
                }),
            ),
        );
    }
    newGroup = () => {
        PubSub.default.pub("executeCommand", "create.folder");
    };
    expandAll = () => {
        this.setExpand(true);
    };
    unExpandAll = () => {
        this.setExpand(false);
    };
    setExpand(expand) {
        let tree = this.projectView.activeTree();
        if (!tree) return;
        let first = this.projectView.activeDocument?.rootNode.firstChild;
        if (first) this.setNodeExpand(tree, first, expand);
    }
    setNodeExpand(tree, list, expand) {
        let item = tree.treeItem(list);
        if (item instanceof TreeGroup) {
            item.isExpanded = expand;
        }
        if (INode.isLinkedListNode(list) && list.firstChild) {
            this.setNodeExpand(tree, list.firstChild, expand);
        }
        if (list.nextSibling) {
            this.setNodeExpand(tree, list.nextSibling, expand);
        }
    }
    openLayers = () => {
        const document = this.projectView.activeDocument;
        if (!document) return;
        const content = this.createLayerDialogContent(document);
        Dialog.show("layer.title", content);
    };
    createLayerDialogContent(document) {
        const panel = div();
        const colorConverter = new ColorConverter();
        const currentLayerRadioName = `current-layer-${document.id}`;
        const render = () => {
            panel.innerHTML = "";
            const list = div();
            document.layers.forEach((layer) => {
                list.append(this.layerRow(document, layer, currentLayerRadioName, render, colorConverter));
            });
            panel.append(
                div(
                    {},
                    button({
                        textContent: I18n.translate("layer.showAll"),
                        onclick: () => {
                            document.unisolateLayer?.();
                            Transaction.execute(document, "show all layers", () => {
                                document.layers.forEach((layer) => {
                                    layer.visible = true;
                                });
                            });
                            render();
                        },
                    }),
                    button({
                        textContent: I18n.translate("layer.isolate"),
                        onclick: () => {
                            const currentLayerId = document.currentLayerId;
                            if (!currentLayerId) return;
                            document.isolateLayer?.(currentLayerId);
                            render();
                        },
                    }),
                    button({
                        textContent: I18n.translate("layer.unisolate"),
                        onclick: () => {
                            document.unisolateLayer?.();
                            render();
                        },
                    }),
                    button({
                        textContent: I18n.translate("layer.add"),
                        onclick: () => {
                            const newLayer = new Layer(
                                document,
                                `Layer ${document.layers.length + 1}`,
                                "#333333",
                            );
                            Transaction.execute(document, "add layer", () => document.layers.push(newLayer));
                            render();
                        },
                    }),
                ),
                list,
            );
        };
        render();
        return panel;
    }
    layerRow(document, layer, currentLayerRadioName, rerender, colorConverter) {
        const currentLayerRadio = input({
            type: "radio",
            name: currentLayerRadioName,
            checked: document.currentLayerId === layer.id,
            onchange: () => {
                document.currentLayerId = layer.id;
                rerender();
            },
        });
        const visibleIcon = svg({
            icon: layer.visible ? "icon-eye" : "icon-eye-slash",
            onclick: () => {
                Transaction.execute(document, "change layer visible", () => {
                    layer.visible = !layer.visible;
                });
                rerender();
            },
        });
        const lockedInput = input({
            type: "checkbox",
            checked: layer.locked,
            onchange: (e) => {
                const value = e.target.checked;
                Transaction.execute(document, "change layer locked", () => {
                    layer.locked = value;
                });
                rerender();
            },
        });
        const nameInput = input({
            type: "text",
            value: new Binding(layer, "name"),
            disabled: layer.locked,
            onkeydown: (e) => {
                if (e.key === "Enter") {
                    e.target.blur();
                }
            },
            onchange: (e) => {
                const value = e.target.value;
                Transaction.execute(document, "change layer name", () => {
                    layer.name = value;
                });
                rerender();
            },
        });
        const colorInput = input({
            type: "color",
            value: new Binding(layer, "color", colorConverter),
            disabled: layer.locked,
            onchange: (e) => {
                const value = e.target.value;
                const color = colorConverter.convertBack(value).value;
                if (color === undefined) return;
                Transaction.execute(document, "change layer color", () => {
                    layer.color = color;
                });
            },
        });
        const lineTypeSelect = select(
            {
                disabled: layer.locked,
                onchange: (e) => {
                    const value = e.target.value;
                    Transaction.execute(document, "change layer linetype", () => {
                        layer.lineType = value === String(LineType.Dash) ? LineType.Dash : LineType.Solid;
                    });
                },
            },
            option({
                value: String(LineType.Solid),
                selected: layer.lineType === LineType.Solid,
                textContent: I18n.translate("layer.lineType.solid") ?? "Solid",
            }),
            option({
                value: String(LineType.Dash),
                selected: layer.lineType === LineType.Dash,
                textContent: I18n.translate("layer.lineType.dash") ?? "Dash",
            }),
        );
        const deleteButton = button({
            textContent: I18n.translate("items.tool.delete"),
            onclick: () => {
                if (document.layers.length <= 1) return;
                const fallbackLayer = document.layers.find((l) => l !== layer) ?? document.layers.at(0);
                if (!fallbackLayer) return;
                Transaction.execute(document, "delete layer", () => {
                    this.reassignLayerId(document, layer.id, fallbackLayer.id);
                    document.layers.remove(layer);
                });
                rerender();
            },
        });
        return div(
            {},
            label({ textContent: new Binding(layer, "id") }),
            currentLayerRadio,
            span({}, visibleIcon),
            lockedInput,
            nameInput,
            colorInput,
            lineTypeSelect,
            deleteButton,
        );
    }
    reassignLayerId(document, fromLayerId, toLayerId) {
        const walk = (node) => {
            if (node instanceof VisualNode) {
                if (node.layerId === fromLayerId) {
                    node.layerId = toLayerId;
                }
            }
            if (INode.isLinkedListNode(node) && node.firstChild) {
                walk(node.firstChild);
            }
            if (node.nextSibling) {
                walk(node.nextSibling);
            }
        };
        walk(document.rootNode);
    }
}
customElements.define("chili-toolbar", ToolBar);
