import { NodeAction } from "./history";
import { PubSub } from "./pubsub";
import { debounce } from "./utils/debounce";
export class PostMessageTransport {
    targetWindow;
    targetOrigin;
    constructor(targetWindow, targetOrigin = "*") {
        this.targetWindow = targetWindow;
        this.targetOrigin = targetOrigin;
    }
    send(message) {
        this.targetWindow.postMessage(message, this.targetOrigin);
    }
}
export class CustomEventTransport {
    target;
    eventName;
    constructor(target, eventName = "chili3d:notify") {
        this.target = target;
        this.eventName = eventName;
    }
    send(message) {
        this.target.dispatchEvent(new CustomEvent(this.eventName, { detail: message }));
    }
}
export class Chili3DNotificationService {
    document;
    transports;
    propertyHandlers = new WeakMap();
    scheduleMode;
    scheduleMs;
    emitSelectionChanged;
    emitNodeChanged;
    emitPropertyChanged;
    pending = [];
    disposed = false;
    throttling = false;
    flushTimer;
    flushDebounced;
    constructor(document, options = {}) {
        this.document = document;
        this.transports = options.transports ?? [];
        this.scheduleMode = options.scheduleMode ?? "debounce";
        this.scheduleMs = options.scheduleMs ?? 60;
        this.emitSelectionChanged = options.emitSelectionChanged ?? true;
        this.emitNodeChanged = options.emitNodeChanged ?? true;
        this.emitPropertyChanged = options.emitPropertyChanged ?? true;
        this.flushDebounced = debounce(() => this.flushNow(), this.scheduleMs);
        this.attachTree(this.document.rootNode);
        this.document.addNodeObserver(this);
        PubSub.default.sub("selectionChanged", this.handleSelectionChanged);
    }
    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        if (this.flushTimer !== undefined) {
            clearTimeout(this.flushTimer);
            this.flushTimer = undefined;
        }
        PubSub.default.remove("selectionChanged", this.handleSelectionChanged);
        this.document.removeNodeObserver(this);
        this.detachTree(this.document.rootNode);
    }
    handleNodeChanged(records) {
        if (!this.emitNodeChanged) return;
        for (const record of records) {
            const action = this.actionName(record.action);
            if (action === undefined) continue;
            if (
                record.action === NodeAction.add ||
                record.action === NodeAction.insertAfter ||
                record.action === NodeAction.insertBefore
            ) {
                this.attachTree(record.node);
            }
            if (record.action === NodeAction.remove) {
                this.detachTree(record.node);
            }
            this.enqueue({
                protocol: "chili3d",
                version: 1,
                eventType: "nodeChanged",
                timestamp: Date.now(),
                documentId: this.document.id,
                action,
                entityId: record.node.id,
                oldParentId: record.oldParent?.id,
                oldPreviousId: record.oldPrevious?.id,
                newParentId: record.newParent?.id,
                newPreviousId: record.newPrevious?.id,
            });
        }
    }
    handleSelectionChanged = (document, selected) => {
        if (!this.emitSelectionChanged) return;
        if (document !== this.document) return;
        this.enqueue({
            protocol: "chili3d",
            version: 1,
            eventType: "selectionChanged",
            timestamp: Date.now(),
            documentId: this.document.id,
            ids: selected.map((x) => x.id),
        });
    };
    attachTree(node) {
        for (const n of this.iterateTree(node)) {
            this.attachNode(n);
        }
    }
    detachTree(node) {
        for (const n of this.iterateTree(node)) {
            this.detachNode(n);
        }
    }
    attachNode(node) {
        if (!this.emitPropertyChanged) return;
        if (this.propertyHandlers.has(node)) return;
        const handler = (property, source, oldValue) => {
            if (this.disposed) return;
            const propertyName = String(property);
            const newValue = source[property];
            this.enqueue({
                protocol: "chili3d",
                version: 1,
                eventType: "propertyChanged",
                timestamp: Date.now(),
                documentId: this.document.id,
                entityId: source.id,
                propertyName,
                oldValue: toJsonCompatible(oldValue),
                newValue: toJsonCompatible(newValue),
            });
        };
        node.onPropertyChanged(handler);
        this.propertyHandlers.set(node, handler);
    }
    detachNode(node) {
        const handler = this.propertyHandlers.get(node);
        if (!handler) return;
        node.removePropertyChanged(handler);
        this.propertyHandlers.delete(node);
    }
    iterateTree(node) {
        const result = [];
        const stack = [node];
        while (stack.length) {
            const current = stack.pop();
            result.push(current);
            if (isLinkedListNode(current)) {
                const children = [];
                for (let c = current.firstChild; c; c = c.nextSibling) {
                    children.push(c);
                }
                for (let i = children.length - 1; i >= 0; i--) {
                    stack.push(children[i]);
                }
            }
        }
        return result;
    }
    enqueue(message) {
        this.pending.push(message);
        this.scheduleFlush();
    }
    scheduleFlush() {
        if (this.scheduleMode === "debounce") {
            this.flushDebounced();
            return;
        }
        if (this.throttling) return;
        this.throttling = true;
        this.flushNow();
        this.flushTimer = window.setTimeout(() => {
            this.throttling = false;
            if (this.pending.length > 0) this.scheduleFlush();
        }, this.scheduleMs);
    }
    flushNow() {
        if (this.pending.length === 0) return;
        const events = this.pending.splice(0, this.pending.length);
        const message =
            events.length === 1
                ? events[0]
                : {
                      protocol: "chili3d",
                      version: 1,
                      eventType: "batch",
                      timestamp: Date.now(),
                      documentId: this.document.id,
                      events,
                  };
        queueMicrotask(() => {
            for (const transport of this.transports) {
                try {
                    void transport.send(message);
                } catch (e) {
                    this.safeSendError(String(e));
                }
            }
        });
    }
    safeSendError(message, detail) {
        const err = {
            protocol: "chili3d",
            version: 1,
            eventType: "error",
            timestamp: Date.now(),
            documentId: this.document.id,
            message,
            detail: detail ? toJsonCompatible(detail) : undefined,
        };
        for (const transport of this.transports) {
            try {
                void transport.send(err);
            } catch {
                return;
            }
        }
    }
    actionName(action) {
        switch (action) {
            case NodeAction.add:
                return "add";
            case NodeAction.remove:
                return "remove";
            case NodeAction.move:
                return "move";
            case NodeAction.transfer:
                return "transfer";
            case NodeAction.insertAfter:
                return "insertAfter";
            case NodeAction.insertBefore:
                return "insertBefore";
        }
    }
}
const isLinkedListNode = (node) => {
    return typeof node.firstChild !== "undefined" && typeof node.lastChild !== "undefined";
};
const toJsonCompatible = (value) => {
    if (
        value === null ||
        value === undefined ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map((v) => toJsonCompatible(v));
    }
    if (typeof value === "bigint") {
        return value.toString();
    }
    if (typeof value === "object") {
        const v = value;
        if (typeof v.toArray === "function") return toJsonCompatible(v.toArray());
        if (typeof v.toString === "function" && v.toString !== Object.prototype.toString) {
            const s = v.toString();
            if (typeof s === "string" && s.length < 200) return s;
        }
        if (
            typeof v.x === "number" &&
            typeof v.y === "number" &&
            typeof v.z === "number" &&
            Object.keys(v).every((k) => k === "x" || k === "y" || k === "z")
        ) {
            return { x: v.x, y: v.y, z: v.z };
        }
        if (value instanceof Map) {
            return Array.from(value.entries()).map(([k, val]) => [
                toJsonCompatible(k),
                toJsonCompatible(val),
            ]);
        }
        if (value instanceof Set) {
            return Array.from(value.values()).map((x) => toJsonCompatible(x));
        }
        try {
            return JSON.parse(
                JSON.stringify(value, (_k, vv) => {
                    if (typeof vv === "bigint") return vv.toString();
                    return vv;
                }),
            );
        } catch {
            return String(value);
        }
    }
    return String(value);
};
