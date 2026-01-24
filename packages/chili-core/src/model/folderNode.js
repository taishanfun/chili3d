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
var FolderNode_1;
import { Id, Logger, NodeAction } from "../foundation";
import { Serializer } from "../serialize";
import { Node } from "./node";
let FolderNode = (FolderNode_1 = class FolderNode extends Node {
    _count = 0;
    _firstChild;
    _lastChild;
    get firstChild() {
        return this._firstChild;
    }
    get lastChild() {
        return this._lastChild;
    }
    get count() {
        return this._count;
    }
    size() {
        return this._count;
    }
    constructor(document, name, id = Id.generate()) {
        super(document, name, id);
    }
    add(...items) {
        const records = items.map((item) => ({
            action: NodeAction.add,
            node: item,
            oldParent: undefined,
            oldPrevious: undefined,
            newParent: this,
            newPrevious: this._lastChild,
        }));
        items.forEach((item) => {
            if (this.initNode(item)) {
                this.addToLast(item);
            }
            this._count++;
        });
        this.document.notifyNodeChanged(records);
    }
    initNode(node) {
        node.parent = this;
        node.parentVisible = this.visible && this.parentVisible;
        if (!this._firstChild) {
            this._firstChild = this._lastChild = node;
            node.previousSibling = node.nextSibling = undefined;
            return false;
        }
        return true;
    }
    addToLast(item) {
        this._lastChild.nextSibling = item;
        item.previousSibling = this._lastChild;
        item.nextSibling = undefined;
        this._lastChild = item;
    }
    children() {
        const result = [];
        let node = this._firstChild;
        while (node) {
            result.push(node);
            node = node.nextSibling;
        }
        return result;
    }
    remove(...items) {
        const records = items
            .filter((item) => this.validateChild(item))
            .map((item) => ({
                action: NodeAction.remove,
                node: item,
                newParent: undefined,
                newPrevious: undefined,
                oldParent: this,
                oldPrevious: item.previousSibling,
            }));
        records.forEach((record) => this.removeNode(record.node, true));
        this.document.notifyNodeChanged(records);
    }
    transfer(...items) {
        const records = items
            .filter((item) => this.validateChild(item))
            .map((item) => ({
                action: NodeAction.transfer,
                node: item,
                newParent: undefined,
                newPrevious: undefined,
                oldParent: this,
                oldPrevious: item.previousSibling,
            }));
        records.forEach((record) => this.removeNode(record.node, true));
        this.document.notifyNodeChanged(records);
    }
    validateChild(item) {
        if (item.parent !== this) {
            Logger.warn(`${item.name} is not a child node of the ${this.name} node`);
            return false;
        }
        return true;
    }
    removeNode(node, nullifyParent) {
        if (nullifyParent) {
            node.parent = undefined;
            node.parentVisible = true;
        }
        if (node === this._firstChild) {
            this.removeFirstNode(node);
        } else if (node === this._lastChild) {
            this.removeLastNode(node);
        } else {
            this.removeMiddleNode(node);
        }
        this._count--;
    }
    removeFirstNode(node) {
        if (node === this._lastChild) {
            this._firstChild = this._lastChild = undefined;
        } else {
            this._firstChild = node.nextSibling;
            this._firstChild.previousSibling = undefined;
            node.nextSibling = undefined;
        }
    }
    removeLastNode(node) {
        this._lastChild = node.previousSibling;
        this._lastChild.nextSibling = undefined;
        node.previousSibling = undefined;
    }
    removeMiddleNode(node) {
        node.previousSibling.nextSibling = node.nextSibling;
        node.nextSibling.previousSibling = node.previousSibling;
        node.previousSibling = node.nextSibling = undefined;
    }
    insertBefore(target, node) {
        if (target && !this.validateChild(target)) return;
        const record = {
            action: NodeAction.insertBefore,
            node,
            oldParent: undefined,
            oldPrevious: undefined,
            newParent: this,
            newPrevious: target?.previousSibling,
        };
        if (this.initNode(node)) {
            if (!target || target === this._firstChild) {
                this.insertAsFirst(node);
            } else {
                this.insertBetweenNodes(target.previousSibling, node, target);
            }
        }
        this._count++;
        this.document.notifyNodeChanged([record]);
    }
    insertAsFirst(node) {
        this._firstChild.previousSibling = node;
        node.nextSibling = this._firstChild;
        this._firstChild = node;
    }
    insertBetweenNodes(prev, node, next) {
        prev.nextSibling = node;
        node.previousSibling = prev;
        node.nextSibling = next;
        next.previousSibling = node;
    }
    insertAfter(target, node) {
        if (target && !this.validateChild(target)) return;
        const record = {
            action: NodeAction.insertAfter,
            oldParent: undefined,
            oldPrevious: undefined,
            newParent: this,
            newPrevious: target,
            node,
        };
        if (this.initNode(node)) {
            if (!target) {
                this.insertAsFirst(node);
            } else if (target === this._lastChild) {
                this.addToLast(node);
            } else {
                this.insertBetweenNodes(target, node, target.nextSibling);
            }
        }
        this._count++;
        this.document.notifyNodeChanged([record]);
    }
    move(child, newParent, previousSibling) {
        if (previousSibling && previousSibling.parent !== newParent) {
            Logger.warn(`${previousSibling.name} is not a child node of the ${newParent.name} node`);
            return;
        }
        const record = {
            action: NodeAction.move,
            oldParent: child.parent,
            oldPrevious: child.previousSibling,
            newParent: newParent,
            newPrevious: previousSibling,
            node: child,
        };
        this.removeNode(child, false);
        if (newParent.initNode(child)) {
            if (!previousSibling) {
                newParent.insertAsFirst(child);
            } else if (previousSibling === newParent._lastChild) {
                newParent.addToLast(child);
            } else {
                newParent.insertBetweenNodes(previousSibling, child, previousSibling.nextSibling);
            }
        }
        newParent._count++;
        this.document.notifyNodeChanged([record]);
    }
    disposeInternal() {
        this.disposeNodes(this._firstChild);
        super.disposeInternal();
    }
    disposeNodes = (node) => {
        if (node instanceof FolderNode_1) {
            this.disposeNodes(node.firstChild);
        }
        let next = node?.nextSibling;
        if (node) {
            node.nextSibling = null;
        }
        while (next) {
            let cache = next.nextSibling;
            next.previousSibling = null;
            next.nextSibling = null;
            next.dispose();
            next = cache;
        }
        node?.dispose();
    };
    onVisibleChanged() {
        this.setChildrenParentVisible();
    }
    onParentVisibleChanged() {
        this.setChildrenParentVisible();
    }
    setChildrenParentVisible() {
        let child = this._firstChild;
        while (child !== undefined) {
            child.parentVisible = this.visible && this.parentVisible;
            child = child.nextSibling;
        }
    }
});
FolderNode = FolderNode_1 = __decorate([Serializer.register(["document", "name", "id"])], FolderNode);
export { FolderNode };
