// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Config } from "../config";
import en from "./en";
import zh from "./zh-cn";
import ptBr from "./pt-br";
const I18nId = "chili18n";
const I18nArgs = new WeakMap();
export class Localize {
    key;
    constructor(key) {
        this.key = key;
    }
    set(e, path) {
        I18n.set(e, path, this.key);
    }
}
export var I18n;
(function (I18n) {
    I18n.languages = new Map([
        ["en", en],
        ["zh-CN", zh],
        ["pt-BR", ptBr],
    ]);
    let _currentLanguage = undefined;
    function currentLanguage() {
        _currentLanguage ??= Array.from(I18n.languages.keys())[Config.instance.languageIndex];
        return _currentLanguage;
    }
    I18n.currentLanguage = currentLanguage;
    function defaultLanguageIndex() {
        return navigator.language.toLowerCase() === "zh-cn" ? 1 : 0;
    }
    I18n.defaultLanguageIndex = defaultLanguageIndex;
    function combineTranslation(language, translations) {
        let local = I18n.languages.get(language);
        if (local) {
            local.translation = {
                ...local.translation,
                ...translations,
            };
        }
    }
    I18n.combineTranslation = combineTranslation;
    function translate(key, ...args) {
        let language = I18n.languages.get(currentLanguage());
        let text = language.translation[key] ?? I18n.languages.get("zh-CN").translation[key];
        if (args.length > 0) {
            text = text.replace(/\{(\d+)\}/g, (_, index) => args[index]);
        }
        return text;
    }
    I18n.translate = translate;
    function isI18nKey(key) {
        return key in I18n.languages.get("zh-CN").translation;
    }
    I18n.isI18nKey = isI18nKey;
    const LINK_KEY = "_:_";
    function set(dom, path, key, ...args) {
        dom[path] = translate(key, ...args);
        dom.dataset[I18nId] = `${key}${LINK_KEY}${path}`;
        if (args.length > 0) {
            I18nArgs.set(dom, args);
        }
    }
    I18n.set = set;
    function changeLanguage(index) {
        if (index < 0 || index >= I18n.languages.size) return;
        let newLanguage = Array.from(I18n.languages.keys())[index];
        if (newLanguage === _currentLanguage) return;
        _currentLanguage = newLanguage;
        document.querySelectorAll(`[data-${I18nId}]`).forEach((e) => {
            let html = e;
            let data = html?.dataset[I18nId]?.split(LINK_KEY);
            if (data?.length !== 2) return;
            let args = I18nArgs.get(html) ?? [];
            html[data[1]] = translate(data[0], ...args);
        });
        Config.instance.languageIndex = index;
    }
    I18n.changeLanguage = changeLanguage;
})(I18n || (I18n = {}));
