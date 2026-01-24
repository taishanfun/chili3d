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
import { Observable, PubSub } from "../foundation";
import { Property } from "../property";
export var ICommand;
(function (ICommand) {
    function isCancelableCommand(command) {
        return "cancel" in command;
    }
    ICommand.isCancelableCommand = isCancelableCommand;
})(ICommand || (ICommand = {}));
export class CancelableCommand extends Observable {
    static _propertiesCache = new Map(); // 所有命令共享
    disposeStack = new Set();
    _isCompleted = false;
    get isCompleted() {
        return this._isCompleted;
    }
    _isCanceled = false;
    get isCanceled() {
        return this._isCanceled;
    }
    _application;
    get application() {
        if (!this._application) {
            throw new Error("application is not set");
        }
        return this._application;
    }
    get document() {
        return this.application.activeView?.document;
    }
    #controller;
    get controller() {
        return this.#controller;
    }
    set controller(value) {
        if (this.#controller === value) return;
        this.#controller?.dispose();
        this.#controller = value;
    }
    async cancel() {
        this._isCanceled = true;
        this.controller?.cancel();
        while (!this._isCompleted) {
            await new Promise((r) => setTimeout(r, 30));
        }
    }
    get repeatOperation() {
        return this.getPrivateValue("repeatOperation", false);
    }
    set repeatOperation(value) {
        this.setProperty("repeatOperation", value);
    }
    _isRestarting = false;
    async restart() {
        this._isRestarting = true;
        await this.cancel();
    }
    onRestarting() {}
    async execute(application) {
        if (!application.activeView?.document) return;
        this._application = application;
        try {
            this.beforeExecute();
            await this.executeAsync();
            while (this._isRestarting || (!this.checkCanceled() && this.repeatOperation)) {
                this._isRestarting = false;
                this.onRestarting();
                await this.executeAsync();
            }
        } finally {
            this.afterExecute();
        }
    }
    checkCanceled() {
        if (this.isCanceled) {
            return true;
        }
        if (this.controller?.result?.status === "cancel") {
            return true;
        }
        return false;
    }
    beforeExecute() {
        this.readProperties();
        PubSub.default.pub("openCommandContext", this);
    }
    afterExecute() {
        this.saveProperties();
        PubSub.default.pub("closeCommandContext");
        this.controller?.dispose();
        this.disposeStack.forEach((x) => x.dispose());
        this.disposeStack.clear();
        this._isCompleted = true;
    }
    readProperties() {
        Property.getProperties(this).forEach((x) => {
            let key = this.cacheKeyOfProperty(x);
            if (CancelableCommand._propertiesCache.has(key)) {
                this.setPrivateValue(key, CancelableCommand._propertiesCache.get(key));
            }
        });
    }
    saveProperties() {
        Property.getProperties(this).forEach((x) => {
            let key = this.cacheKeyOfProperty(x);
            let prop = this[key];
            if (typeof prop === "function") return;
            CancelableCommand._propertiesCache.set(key, prop);
        });
    }
    cacheKeyOfProperty(property) {
        return property.name;
    }
}
__decorate([Property.define("common.cancel")], CancelableCommand.prototype, "cancel", null);
__decorate([Property.define("option.command.repeat")], CancelableCommand.prototype, "repeatOperation", null);
