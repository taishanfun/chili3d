// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export class PubSub {
    static default = new PubSub();
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
