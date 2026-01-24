import { jest } from "@jest/globals";
import {
    Chili3DNotificationService,
    NodeAction,
    Observable,
    PubSub,
    type Chili3DNotificationMessage,
} from "../src";

class TestNode extends Observable {
    readonly id: string;
    parent: any = undefined;
    previousSibling: any = undefined;
    nextSibling: any = undefined;

    constructor(id: string, name: string = "node") {
        super();
        this.id = id;
        this.setPrivateValue("name" as any, name as any);
        this.setPrivateValue("visible" as any, true as any);
        this.setPrivateValue("parentVisible" as any, true as any);
    }

    get name() {
        return this.getPrivateValue("name" as any, "node" as any) as any;
    }
    set name(v: string) {
        this.setProperty("name" as any, v as any);
    }

    get visible() {
        return this.getPrivateValue("visible" as any, true as any) as any;
    }
    set visible(v: boolean) {
        this.setProperty("visible" as any, v as any);
    }

    get parentVisible() {
        return this.getPrivateValue("parentVisible" as any, true as any) as any;
    }
    set parentVisible(v: boolean) {
        this.setProperty("parentVisible" as any, v as any);
    }

    clone(): this {
        return this;
    }
}

class TestNodeList extends TestNode {
    private readonly children: TestNode[] = [];

    get firstChild() {
        return this.children[0];
    }
    get lastChild() {
        return this.children[this.children.length - 1];
    }

    add(...items: TestNode[]): void {
        for (const item of items) {
            item.parent = this;
            const last = this.lastChild;
            if (last) {
                last.nextSibling = item;
                item.previousSibling = last;
            }
            this.children.push(item);
        }
    }

    remove(...items: TestNode[]): void {
        for (const item of items) {
            const idx = this.children.indexOf(item);
            if (idx < 0) continue;
            const prev = this.children[idx - 1];
            const next = this.children[idx + 1];
            if (prev) prev.nextSibling = next;
            if (next) next.previousSibling = prev;
            item.parent = undefined;
            item.previousSibling = undefined;
            item.nextSibling = undefined;
            this.children.splice(idx, 1);
        }
    }

    transfer(..._items: TestNode[]): void {}

    size(): number {
        return this.children.length;
    }

    insertAfter(target: TestNode | undefined, node: TestNode): void {
        if (!target) {
            this.add(node);
            return;
        }
        const idx = this.children.indexOf(target);
        if (idx < 0 || idx === this.children.length - 1) {
            this.add(node);
            return;
        }
        const next = this.children[idx + 1];
        node.parent = this;
        node.previousSibling = target;
        node.nextSibling = next;
        target.nextSibling = node;
        next.previousSibling = node;
        this.children.splice(idx + 1, 0, node);
    }

    insertBefore(target: TestNode | undefined, node: TestNode): void {
        if (!target) {
            this.add(node);
            return;
        }
        const idx = this.children.indexOf(target);
        if (idx < 0) {
            this.add(node);
            return;
        }
        const prev = this.children[idx - 1];
        node.parent = this;
        node.previousSibling = prev;
        node.nextSibling = target;
        target.previousSibling = node;
        if (prev) prev.nextSibling = node;
        this.children.splice(idx, 0, node);
    }

    move(child: TestNode, newParent: this, newPreviousSibling?: TestNode): void {
        this.remove(child);
        if (newPreviousSibling) newParent.insertAfter(newPreviousSibling, child);
        else newParent.insertBefore(newParent.firstChild, child);
    }
}

class TestDocument {
    readonly id = "doc-1";
    readonly rootNode = new TestNodeList("root", "root");
    private readonly observers = new Set<any>();

    addNodeObserver(observer: any) {
        this.observers.add(observer);
    }
    removeNodeObserver(observer: any) {
        this.observers.delete(observer);
    }
    notifyNodeChanged(records: any[]) {
        this.observers.forEach((o) => o.handleNodeChanged(records));
    }
}

class CollectTransport {
    readonly messages: Chili3DNotificationMessage[] = [];
    send(message: Chili3DNotificationMessage) {
        this.messages.push(message);
    }
}

const flatten = (messages: Chili3DNotificationMessage[]): Chili3DNotificationMessage[] => {
    const out: Chili3DNotificationMessage[] = [];
    const visit = (m: Chili3DNotificationMessage) => {
        if (m.eventType === "batch") {
            m.events.forEach(visit);
        } else {
            out.push(m);
        }
    };
    messages.forEach(visit);
    return out;
};

describe("Chili3DNotificationService", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        PubSub.default.dispose();
    });

    afterEach(() => {
        jest.useRealTimers();
        PubSub.default.dispose();
    });

    test("emits propertyChanged with old/new values", async () => {
        const doc = new TestDocument();
        const node = new TestNode("n1", "a");
        doc.rootNode.add(node);

        const transport = new CollectTransport();
        const service = new Chili3DNotificationService(doc as any, {
            transports: [transport],
            scheduleMode: "debounce",
            scheduleMs: 10,
        });

        node.name = "b";
        jest.advanceTimersByTime(20);
        await Promise.resolve();

        const events = flatten(transport.messages);
        const msg = events.find((x) => x.eventType === "propertyChanged") as any;
        expect(msg).toBeTruthy();
        expect(msg.entityId).toBe("n1");
        expect(msg.propertyName).toBe("name");
        expect(msg.oldValue).toBe("a");
        expect(msg.newValue).toBe("b");

        service.dispose();
    });

    test("emits selectionChanged for current document", async () => {
        const doc = new TestDocument();
        const node = new TestNode("n1", "a");
        doc.rootNode.add(node);

        const transport = new CollectTransport();
        const service = new Chili3DNotificationService(doc as any, {
            transports: [transport],
            scheduleMode: "debounce",
            scheduleMs: 10,
        });

        PubSub.default.pub("selectionChanged", doc as any, [node] as any, [] as any);
        jest.advanceTimersByTime(20);
        await Promise.resolve();

        const events = flatten(transport.messages);
        const msg = events.find((x) => x.eventType === "selectionChanged") as any;
        expect(msg).toBeTruthy();
        expect(msg.ids).toEqual(["n1"]);

        service.dispose();
    });

    test("emits nodeChanged and starts observing newly added nodes", async () => {
        const doc = new TestDocument();
        const transport = new CollectTransport();
        const service = new Chili3DNotificationService(doc as any, {
            transports: [transport],
            scheduleMode: "debounce",
            scheduleMs: 10,
        });

        const node = new TestNode("n2", "x");
        doc.rootNode.add(node);
        doc.notifyNodeChanged([
            {
                node,
                action: NodeAction.add,
                newParent: doc.rootNode,
                newPrevious: undefined,
            },
        ]);

        node.name = "y";
        jest.advanceTimersByTime(20);
        await Promise.resolve();

        const events = flatten(transport.messages);
        expect(events.some((x) => x.eventType === "nodeChanged")).toBe(true);
        const prop = events.find(
            (x) => x.eventType === "propertyChanged" && (x as any).entityId === "n2",
        ) as any;
        expect(prop).toBeTruthy();
        expect(prop.oldValue).toBe("x");
        expect(prop.newValue).toBe("y");

        service.dispose();
    });
});
