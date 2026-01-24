// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Logger, PubSub } from "chili-core";
const DefaultKeyMap = {
    Delete: "modify.deleteNode",
    Backspace: "modify.deleteNode",
    " ": "special.last",
    Enter: "special.last",
    "ctrl+z": "edit.undo",
    "ctrl+y": "edit.redo",
};
export class HotkeyService {
    app;
    _keyMap = new Map();
    constructor() {
        this.addMap(DefaultKeyMap);
    }
    register(app) {
        this.app = app;
        Logger.info(`${HotkeyService.name} registed`);
    }
    start() {
        window.addEventListener("keydown", this.eventHandlerKeyDown);
        window.addEventListener("keydown", this.commandKeyDown);
        Logger.info(`${HotkeyService.name} started`);
    }
    stop() {
        window.removeEventListener("keydown", this.eventHandlerKeyDown);
        window.removeEventListener("keydown", this.commandKeyDown);
        Logger.info(`${HotkeyService.name} stoped`);
    }
    canHandleKey(e) {
        const target = e.target;
        if (!target) return true;
        const tag = target.tagName;
        if (target.isContentEditable) return false;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return false;
        return true;
    }
    eventHandlerKeyDown = (e) => {
        if (!this.canHandleKey(e)) return;
        e.preventDefault();
        let visual = this.app?.activeView?.document?.visual;
        let view = this.app?.activeView;
        if (view && visual) {
            if (visual.eventHandler.isEnabled) visual.eventHandler.keyDown(view, e);
            if (visual.viewHandler.isEnabled) visual.viewHandler.keyDown(view, e);
            if (this.app.executingCommand) e.stopImmediatePropagation();
        }
    };
    commandKeyDown = (e) => {
        if (!this.canHandleKey(e)) return;
        e.preventDefault();
        let command = this.getCommand(e);
        if (command !== undefined) {
            PubSub.default.pub("executeCommand", command);
        }
    };
    getKey(keys) {
        let key = keys.key;
        if (keys.ctrlKey) key = "ctrl+" + key;
        if (keys.shiftKey) key = "shift+" + key;
        if (keys.altKey) key = "alt+" + key;
        return key;
    }
    map(command, keys) {
        let key = this.getKey(keys);
        this._keyMap.set(key, command);
    }
    getCommand(keys) {
        let key = this.getKey(keys);
        return this._keyMap.get(key);
    }
    addMap(map) {
        let keys = Object.keys(map);
        keys.forEach((key) => {
            this._keyMap.set(key, map[key]);
        });
    }
}
