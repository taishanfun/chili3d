// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
var __decorate =
    (this && this.__decorate) ||
    function (decorators, target, key, desc) {
        var c = arguments.length,
            r =
                c < 3
                    ? target
                    : desc === null
                      ? (desc = Object.getOwnPropertyDescriptor(target, key))
                      : desc,
            d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if ((d = decorators[i]))
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
import { ObjectStorage, Observable } from "./foundation";
import { I18n } from "./i18n";
import { Serializer } from "./serialize";
import { ObjectSnapType } from "./snapType";
export class VisualItemConfig extends Observable {
    defaultFaceColor = 0xdedede;
    highlightEdgeColor = 0x33ff33;
    highlightFaceColor = 0x99ff00;
    selectedEdgeColor = 0x33ff33;
    selectedFaceColor = 0x33ff33;
    editVertexSize = 7;
    editVertexColor = 0x33ff33;
    hintVertexSize = 5;
    hintVertexColor = 0x33ff33;
    trackingVertexSize = 7;
    trackingVertexColor = 0x33ff33;
    temporaryVertexSize = 5;
    temporaryVertexColor = 0x33ff33;
    temporaryEdgeColor = 0x33ff33;
    get defaultEdgeColor() {
        return this.getPrivateValue("defaultEdgeColor", 0x333333);
    }
    set defaultEdgeColor(value) {
        this.setProperty("defaultEdgeColor", value);
    }
    setTheme(theme) {
        this.defaultEdgeColor = theme === "light" ? 0x333333 : 0xeeeeee;
    }
}
export const VisualConfig = new VisualItemConfig();
const CONFIG_STORAGE_KEY = "config";
export class Config extends Observable {
    static #instance;
    static get instance() {
        this.#instance ??= new Config();
        return this.#instance;
    }
    SnapDistance = 5;
    get snapType() {
        return this.getPrivateValue(
            "snapType",
            ObjectSnapType.midPoint |
                ObjectSnapType.endPoint |
                ObjectSnapType.center |
                ObjectSnapType.perpendicular |
                ObjectSnapType.intersection |
                ObjectSnapType.nearest,
        );
    }
    set snapType(snapType) {
        this.setProperty("snapType", snapType);
    }
    get enableSnapTracking() {
        return this.getPrivateValue("enableSnapTracking", true);
    }
    set enableSnapTracking(value) {
        this.setProperty("enableSnapTracking", value);
    }
    get enableSnap() {
        return this.getPrivateValue("enableSnap", true);
    }
    set enableSnap(value) {
        this.setProperty("enableSnap", value);
    }
    get dynamicWorkplane() {
        return this.getPrivateValue("dynamicWorkplane", true);
    }
    set dynamicWorkplane(value) {
        this.setProperty("dynamicWorkplane", value);
    }
    get languageIndex() {
        return this.getPrivateValue("languageIndex");
    }
    set languageIndex(value) {
        this.setProperty("languageIndex", value, () => {
            I18n.changeLanguage(value);
            this.saveToStorage();
        });
    }
    get navigation3DIndex() {
        return this.getPrivateValue("navigation3DIndex");
    }
    set navigation3DIndex(value) {
        this.setProperty("navigation3DIndex", value, () => {
            this.saveToStorage();
        });
    }
    get themeMode() {
        return this.getPrivateValue("themeMode", "system");
    }
    set themeMode(value) {
        this.setProperty("themeMode", value, () => {
            this.applyTheme();
            this.saveToStorage();
        });
    }
    applyTheme() {
        const themeMode = this.themeMode;
        let theme;
        if (themeMode === "system") {
            theme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        } else {
            theme = themeMode;
        }
        document.documentElement.setAttribute("theme", theme);
        VisualConfig.setTheme(theme);
    }
    saveToStorage() {
        const json = Serializer.serializeProperties(this);
        ObjectStorage.default.setValue(CONFIG_STORAGE_KEY, json);
    }
    constructor() {
        super();
        this.init();
    }
    init() {
        const properties = ObjectStorage.default.value(CONFIG_STORAGE_KEY);
        if (properties) {
            for (const key in properties) {
                const thisKey = key;
                this.setPrivateValue(thisKey, properties[thisKey]);
            }
        } else {
            this.setPrivateValue("languageIndex", I18n.defaultLanguageIndex());
            this.setPrivateValue("navigation3DIndex", 0);
            this.setPrivateValue("themeMode", "system");
        }
        // Apply theme on startup
        this.applyTheme();
        // Listen for system theme changes
        window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener("change", () => {
            if (this.themeMode === "system") {
                this.applyTheme();
            }
        });
    }
}
__decorate([Serializer.serialze()], Config.prototype, "languageIndex", null);
__decorate([Serializer.serialze()], Config.prototype, "navigation3DIndex", null);
__decorate([Serializer.serialze()], Config.prototype, "themeMode", null);
