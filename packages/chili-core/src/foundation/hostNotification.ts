import { IDocument } from "../document";
import { INode, INodeLinkedList } from "../model";
import { IPropertyChanged, PropertyChangedHandler } from "./observer";
import { NodeAction, NodeRecord, INodeChangedObserver } from "./history";
import { PubSub } from "./pubsub";
import { debounce } from "./utils/debounce";

export type Chili3DNotificationEventType =
    | "selectionChanged"
    | "propertyChanged"
    | "nodeChanged"
    | "batch"
    | "error";

export type Chili3DNotificationMessage =
    | {
          protocol: "chili3d";
          version: 1;
          eventType: "selectionChanged";
          timestamp: number;
          documentId: string;
          ids: string[];
      }
    | {
          protocol: "chili3d";
          version: 1;
          eventType: "propertyChanged";
          timestamp: number;
          documentId: string;
          entityId: string;
          propertyName: string;
          oldValue: unknown;
          newValue: unknown;
      }
    | {
          protocol: "chili3d";
          version: 1;
          eventType: "nodeChanged";
          timestamp: number;
          documentId: string;
          action: "add" | "remove" | "move" | "transfer" | "insertAfter" | "insertBefore";
          entityId: string;
          oldParentId?: string;
          oldPreviousId?: string;
          newParentId?: string;
          newPreviousId?: string;
      }
    | {
          protocol: "chili3d";
          version: 1;
          eventType: "batch";
          timestamp: number;
          documentId: string;
          events: Chili3DNotificationMessage[];
      }
    | {
          protocol: "chili3d";
          version: 1;
          eventType: "error";
          timestamp: number;
          documentId: string;
          message: string;
          detail?: unknown;
      };

export interface Chili3DNotificationTransport {
    send(message: Chili3DNotificationMessage): void | Promise<void>;
}

export class PostMessageTransport implements Chili3DNotificationTransport {
    constructor(
        private readonly targetWindow: Window,
        private readonly targetOrigin: string = "*",
    ) {}

    send(message: Chili3DNotificationMessage) {
        this.targetWindow.postMessage(message, this.targetOrigin);
    }
}

export class CustomEventTransport implements Chili3DNotificationTransport {
    constructor(
        private readonly target: EventTarget,
        private readonly eventName: string = "chili3d:notify",
    ) {}

    send(message: Chili3DNotificationMessage) {
        this.target.dispatchEvent(new CustomEvent(this.eventName, { detail: message }));
    }
}

export type NotificationScheduleMode = "debounce" | "throttle";

export interface Chili3DNotificationServiceOptions {
    transports?: Chili3DNotificationTransport[];
    scheduleMode?: NotificationScheduleMode;
    scheduleMs?: number;
    emitSelectionChanged?: boolean;
    emitNodeChanged?: boolean;
    emitPropertyChanged?: boolean;
}

export class Chili3DNotificationService implements INodeChangedObserver {
    private readonly transports: Chili3DNotificationTransport[];
    private readonly propertyHandlers = new WeakMap<IPropertyChanged, PropertyChangedHandler<any, any>>();
    private readonly scheduleMode: NotificationScheduleMode;
    private readonly scheduleMs: number;
    private readonly emitSelectionChanged: boolean;
    private readonly emitNodeChanged: boolean;
    private readonly emitPropertyChanged: boolean;
    private readonly pending: Chili3DNotificationMessage[] = [];
    private disposed = false;
    private throttling = false;
    private flushTimer?: number;

    private readonly flushDebounced: () => void;

    constructor(
        readonly document: IDocument,
        options: Chili3DNotificationServiceOptions = {},
    ) {
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

    handleNodeChanged(records: NodeRecord[]): void {
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

    private readonly handleSelectionChanged = (document: IDocument, selected: INode[]) => {
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

    private attachTree(node: INode) {
        for (const n of this.iterateTree(node)) {
            this.attachNode(n);
        }
    }

    private detachTree(node: INode) {
        for (const n of this.iterateTree(node)) {
            this.detachNode(n);
        }
    }

    private attachNode(node: INode) {
        if (!this.emitPropertyChanged) return;
        if (this.propertyHandlers.has(node)) return;
        const handler: PropertyChangedHandler<any, any> = (property, source, oldValue) => {
            if (this.disposed) return;
            const propertyName = String(property);
            const newValue = (source as any)[property as any];
            this.enqueue({
                protocol: "chili3d",
                version: 1,
                eventType: "propertyChanged",
                timestamp: Date.now(),
                documentId: this.document.id,
                entityId: (source as INode).id,
                propertyName,
                oldValue: toJsonCompatible(oldValue),
                newValue: toJsonCompatible(newValue),
            });
        };
        node.onPropertyChanged(handler as any);
        this.propertyHandlers.set(node, handler);
    }

    private detachNode(node: INode) {
        const handler = this.propertyHandlers.get(node);
        if (!handler) return;
        node.removePropertyChanged(handler as any);
        this.propertyHandlers.delete(node);
    }

    private iterateTree(node: INode): INode[] {
        const result: INode[] = [];
        const stack: INode[] = [node];
        while (stack.length) {
            const current = stack.pop()!;
            result.push(current);
            if (isLinkedListNode(current)) {
                const children: INode[] = [];
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

    private enqueue(message: Chili3DNotificationMessage) {
        this.pending.push(message);
        this.scheduleFlush();
    }

    private scheduleFlush() {
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

    private flushNow() {
        if (this.pending.length === 0) return;
        const events = this.pending.splice(0, this.pending.length);
        const message: Chili3DNotificationMessage =
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

    private safeSendError(message: string, detail?: unknown) {
        const err: Chili3DNotificationMessage = {
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

    private actionName(
        action: NodeAction,
    ): "add" | "remove" | "move" | "transfer" | "insertAfter" | "insertBefore" | undefined {
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

const isLinkedListNode = (node: INode): node is INodeLinkedList => {
    return typeof (node as any).firstChild !== "undefined" && typeof (node as any).lastChild !== "undefined";
};

const toJsonCompatible = (value: unknown): unknown => {
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
        const v = value as any;
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
