// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { a, collection, div, label, span, svg } from "chili-controls";
import {
    Binding,
    ButtonSize,
    Command,
    I18n,
    Localize,
    Logger,
    Observable,
    ObservableCollection,
    PubSub,
    Result,
} from "chili-core";
import { CommandContext } from "./commandContext";
import style from "./ribbon.module.css";
import { RibbonButton } from "./ribbonButton";
import { RibbonStack } from "./ribbonStack";
export class RibbonDataContent extends Observable {
    app;
    quickCommands = new ObservableCollection();
    ribbonTabs = new ObservableCollection();
    _activeTab;
    _activeView;
    _activeMode;
    constructor(app, quickCommands, ribbonTabs) {
        super();
        this.app = app;
        this.quickCommands.push(...quickCommands);
        this.ribbonTabs.push(...ribbonTabs);
        this._activeTab = ribbonTabs[0];
        PubSub.default.sub("activeViewChanged", (v) => (this.activeView = v));
    }
    get activeTab() {
        return this._activeTab;
    }
    set activeTab(value) {
        this.setProperty("activeTab", value);
    }
    get activeView() {
        return this._activeView;
    }
    set activeView(value) {
        this.setProperty("activeView", value);
        this.activeMode = value?.document.mode;
    }
    get activeMode() {
        return this._activeMode;
    }
    set activeMode(value) {
        this.setProperty("activeMode", value);
    }
}
export const QuickButton = (command) => {
    const data = Command.getData(command);
    if (!data) {
        Logger.warn("commandData is undefined");
        return span({ textContent: "null" });
    }
    return svg({
        icon: data.icon,
        title: new Localize(`command.${data.key}`),
        onclick: () => PubSub.default.pub("executeCommand", data.key),
    });
};
class ViewActiveConverter {
    target;
    style;
    activeStyle;
    constructor(target, style, activeStyle) {
        this.target = target;
        this.style = style;
        this.activeStyle = activeStyle;
    }
    convert(value) {
        return Result.ok(this.target === value ? `${this.style} ${this.activeStyle}` : this.style);
    }
}
class ActivedRibbonTabConverter {
    tab;
    style;
    activeStyle;
    constructor(tab, style, activeStyle) {
        this.tab = tab;
        this.style = style;
        this.activeStyle = activeStyle;
    }
    convert(value) {
        return Result.ok(this.tab === value ? `${this.style} ${this.activeStyle}` : this.style);
    }
}
class DisplayConverter {
    tab;
    constructor(tab) {
        this.tab = tab;
    }
    convert(value) {
        return Result.ok(this.tab === value ? "" : "none");
    }
}
class RibbonGroupDisplayConverter {
    group;
    constructor(group) {
        this.group = group;
    }
    convert(mode) {
        if (!this.group.modes || !mode) return Result.ok("");
        return Result.ok(this.group.modes.includes(mode) ? "" : "none");
    }
}
export class Ribbon extends HTMLElement {
    dataContent;
    _commandContext = div({ className: style.commandContextPanel });
    commandContext;
    constructor(dataContent) {
        super();
        this.dataContent = dataContent;
        this.className = style.root;
        this.append(this.header(), this.ribbonTabs(), this._commandContext);
    }
    header() {
        return div({ className: style.titleBar }, this.leftPanel(), this.centerPanel(), this.rightPanel());
    }
    leftPanel() {
        return div(
            { className: style.left },
            div({ className: style.appIcon, onclick: () => PubSub.default.pub("displayHome", true) }),
            div(
                { className: style.ribbonTitlePanel },
                svg({
                    className: style.home,
                    icon: "icon-home",
                    onclick: () => PubSub.default.pub("displayHome", true),
                }),
                collection({
                    className: style.quickCommands,
                    sources: this.dataContent.quickCommands,
                    template: (command) => QuickButton(command),
                }),
                span({ className: style.split }),
                this.createRibbonHeader(),
            ),
        );
    }
    createRibbonHeader() {
        return collection({
            sources: this.dataContent.ribbonTabs,
            template: (tab) => {
                const converter = new ActivedRibbonTabConverter(tab, style.tabHeader, style.activedTab);
                return label({
                    className: new Binding(this.dataContent, "activeTab", converter),
                    textContent: new Localize(tab.tabName),
                    onclick: () => (this.dataContent.activeTab = tab),
                });
            },
        });
    }
    centerPanel() {
        return div(
            { className: style.center },
            collection({
                className: style.views,
                sources: this.dataContent.app.views,
                template: (view) => this.createViewItem(view),
            }),
            svg({
                className: style.new,
                icon: "icon-plus",
                title: I18n.translate("command.doc.new"),
                onclick: () => PubSub.default.pub("executeCommand", "doc.new"),
            }),
        );
    }
    createViewItem(view) {
        return div(
            {
                className: new Binding(
                    this.dataContent,
                    "activeView",
                    new ViewActiveConverter(view, style.tab, style.active),
                ),
                onclick: () => {
                    this.dataContent.app.activeView = view;
                },
            },
            div({ className: style.name }, span({ textContent: new Binding(view.document, "name") })),
            svg({
                className: style.close,
                icon: "icon-times",
                onclick: (e) => {
                    e.stopPropagation();
                    view.close();
                },
            }),
        );
    }
    rightPanel() {
        return div(
            { className: style.right },
            a(
                { href: "https://github.com/xiangechen/chili3d", target: "_blank" },
                svg({ title: "Github", className: style.icon, icon: "icon-github" }),
            ),
        );
    }
    ribbonTabs() {
        return collection({
            className: style.tabContentPanel,
            sources: this.dataContent.ribbonTabs,
            template: (tab) => this.ribbonTab(tab),
        });
    }
    ribbonTab(tab) {
        return collection({
            className: style.groupPanel,
            sources: tab.groups,
            style: {
                display: new Binding(this.dataContent, "activeTab", new DisplayConverter(tab)),
            },
            template: (group) => this.ribbonGroup(group),
        });
    }
    ribbonGroup(group) {
        return div(
            {
                className: style.ribbonGroup,
                style: {
                    display: new Binding(
                        this.dataContent,
                        "activeMode",
                        new RibbonGroupDisplayConverter(group),
                    ),
                },
            },
            collection({
                sources: group.items,
                className: style.content,
                template: (item) => this.ribbonButton(item),
            }),
            label({ className: style.header, textContent: new Localize(group.groupName) }),
        );
    }
    ribbonButton(item) {
        if (typeof item === "string") {
            return RibbonButton.fromCommandName(item, ButtonSize.large);
        } else if (item instanceof ObservableCollection) {
            const stack = new RibbonStack();
            item.forEach((b) => {
                const button = RibbonButton.fromCommandName(b, ButtonSize.small);
                if (button) stack.append(button);
            });
            return stack;
        } else {
            return new RibbonButton(item.display, item.icon, ButtonSize.large, item.onClick);
        }
    }
    connectedCallback() {
        PubSub.default.sub("openCommandContext", this.openContext);
        PubSub.default.sub("closeCommandContext", this.closeContext);
    }
    disconnectedCallback() {
        PubSub.default.remove("openCommandContext", this.openContext);
        PubSub.default.remove("closeCommandContext", this.closeContext);
    }
    openContext = (command) => {
        if (this.commandContext) {
            this.closeContext();
        }
        this.commandContext = new CommandContext(command);
        this._commandContext.append(this.commandContext);
    };
    closeContext = () => {
        this.commandContext?.remove();
        this.commandContext?.dispose();
        this.commandContext = undefined;
        this._commandContext.innerHTML = "";
    };
}
customElements.define("chili-ribbon", Ribbon);
