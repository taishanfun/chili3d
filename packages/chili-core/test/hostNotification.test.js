import { Chili3DNotificationService, NodeAction, Observable, PubSub } from "../src";
class TestNode extends Observable {
    id;
    parent = undefined;
    previousSibling = undefined;
    nextSibling = undefined;
    constructor(id, name = "node") {
        super();
        this.id = id;
        this.setPrivateValue("name", name);
        this.setPrivateValue("visible", true);
        this.setPrivateValue("parentVisible", true);
    }
    get name() {
        return this.getPrivateValue("name", "node");
    }
    set name(v) {
        this.setProperty("name", v);
    }
    get visible() {
        return this.getPrivateValue("visible", true);
    }
    set visible(v) {
        this.setProperty("visible", v);
    }
    get parentVisible() {
        return this.getPrivateValue("parentVisible", true);
    }
    set parentVisible(v) {
        this.setProperty("parentVisible", v);
    }
    clone() {
        return this;
    }
}
class TestNodeList extends TestNode {
    children = [];
    get firstChild() {
        return this.children[0];
    }
    get lastChild() {
        return this.children[this.children.length - 1];
    }
    add(...items) {
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
    remove(...items) {
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
    transfer(..._items) {}
    size() {
        return this.children.length;
    }
    insertAfter(target, node) {
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
    insertBefore(target, node) {
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
    move(child, newParent, newPreviousSibling) {
        this.remove(child);
        if (newPreviousSibling) newParent.insertAfter(newPreviousSibling, child);
        else newParent.insertBefore(newParent.firstChild, child);
    }
}
class TestDocument {
    id = "doc-1";
    rootNode = new TestNodeList("root", "root");
    observers = new Set();
    addNodeObserver(observer) {
        this.observers.add(observer);
    }
    removeNodeObserver(observer) {
        this.observers.delete(observer);
    }
    notifyNodeChanged(records) {
        this.observers.forEach((o) => o.handleNodeChanged(records));
    }
}
class CollectTransport {
    messages = [];
    send(message) {
        this.messages.push(message);
    }
}
const flatten = (messages) => {
    const out = [];
    const visit = (m) => {
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
        const service = new Chili3DNotificationService(doc, {
            transports: [transport],
            scheduleMode: "debounce",
            scheduleMs: 10,
        });
        node.name = "b";
        jest.advanceTimersByTime(20);
        await Promise.resolve();
        const events = flatten(transport.messages);
        const msg = events.find((x) => x.eventType === "propertyChanged");
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
        const service = new Chili3DNotificationService(doc, {
            transports: [transport],
            scheduleMode: "debounce",
            scheduleMs: 10,
        });
        PubSub.default.pub("selectionChanged", doc, [node], []);
        jest.advanceTimersByTime(20);
        await Promise.resolve();
        const events = flatten(transport.messages);
        const msg = events.find((x) => x.eventType === "selectionChanged");
        expect(msg).toBeTruthy();
        expect(msg.ids).toEqual(["n1"]);
        service.dispose();
    });
    test("emits nodeChanged and starts observing newly added nodes", async () => {
        const doc = new TestDocument();
        const transport = new CollectTransport();
        const service = new Chili3DNotificationService(doc, {
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
        const prop = events.find((x) => x.eventType === "propertyChanged" && x.entityId === "n2");
        expect(prop).toBeTruthy();
        expect(prop.oldValue).toBe("x");
        expect(prop.newValue).toBe("y");
        service.dispose();
    });
});
