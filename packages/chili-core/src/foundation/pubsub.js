// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { getCurrentApplication } from "../application";
export class PubSub {
    static default = new (class ScopedPubSub extends PubSub {
        scopes = new Map();
        globalScope = Symbol.for("chili3d.pubsub.global");
        resolveScopeFromArgs(args) {
            const first = args[0];
            if (!first || typeof first !== "object") return undefined;
            if (first.application) return first.application;
            if (first.document?.application) return first.document.application;
            if (first.view?.document?.application) return first.view.document.application;
            return undefined;
        }
        resolveScopeFromCurrent() {
            return getCurrentApplication() ?? this.globalScope;
        }
        busFor(scope) {
            const key = scope ?? this.globalScope;
            const existing = this.scopes.get(key);
            if (existing) return existing;
            const bus = new PubSub();
            this.scopes.set(key, bus);
            return bus;
        }
        dispose() {
            this.scopes.forEach((bus) => bus.dispose());
            this.scopes.clear();
        }
        sub(event, callback) {
            const scope = this.resolveScopeFromCurrent();
            this.busFor(scope).sub(event, callback);
        }
        pub(event, ...args) {
            const scope = this.resolveScopeFromArgs(args) ?? this.resolveScopeFromCurrent();
            this.busFor(scope).pub(event, ...args);
        }
        remove(event, callback) {
            const scope = this.resolveScopeFromCurrent();
            this.busFor(scope).remove(event, callback);
        }
        removeAll(event) {
            const scope = this.resolveScopeFromCurrent();
            this.busFor(scope).removeAll(event);
        }
    })();
    events = new Map();
    dispose() {
        this.events.forEach((callbacks) => callbacks.clear());
        this.events.clear();
    }
    sub(event, callback) {
        const callbacks = this.events.get(event) ?? new Set();
        callbacks.add(callback);
        this.events.set(event, callbacks);
    }
    pub(event, ...args) {
        this.events.get(event)?.forEach((callback) => callback(...args));
    }
    remove(event, callback) {
        this.events.get(event)?.delete(callback);
    }
    removeAll(event) {
        this.events.get(event)?.clear();
    }
}
