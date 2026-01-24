// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { INode, PubSub, ShapeType, Transaction, VisualNode } from "chili-core";
import { NodeSelectionHandler, ShapeSelectionHandler } from "chili-vis";
import style from "./tree.module.css";
import { TreeItem } from "./treeItem";
import { TreeGroup } from "./treeItemGroup";
import { TreeModel } from "./treeModel";
export class Tree extends HTMLElement {
    document;
    nodeMap = new Map();
    lastClicked;
    selectedNodes = new Set();
    dragging;
    constructor(document) {
        super();
        this.document = document;
        this.className = style.panel;
        this.initializeTree(document);
    }
    initializeTree(document) {
        this.addAllNodes(document, this, document.rootNode);
        this.addEvents(this);
    }
    connectedCallback() {
        this.document.addNodeObserver(this);
        PubSub.default.sub("selectionChanged", this.handleSelectionChanged);
    }
    disconnectedCallback() {
        this.document.removeNodeObserver(this);
        PubSub.default.remove("selectionChanged", this.handleSelectionChanged);
    }
    treeItem(node) {
        return this.nodeMap.get(node);
    }
    dispose() {
        this.lastClicked = undefined;
        this.dragging = undefined;
        this.nodeMap.forEach((x) => x.dispose());
        this.nodeMap.clear();
        this.selectedNodes.clear();
        this.removeEvents(this);
        this.document.removeNodeObserver(this);
        PubSub.default.remove("selectionChanged", this.handleSelectionChanged);
        this.document = null;
    }
    handleNodeChanged(records) {
        this.ensureHasHTML(records);
        records.forEach((record) => {
            const ele = this.nodeMap.get(record.node);
            ele?.remove();
            if (!ele || !record.newParent) return;
            let parent = this.nodeMap.get(record.newParent) || this.createAndMapParent(record.newParent);
            if (parent instanceof TreeGroup) {
                const pre = record.newPrevious ? this.nodeMap.get(record.newPrevious) : null;
                parent.insertAfter(ele, pre ?? null);
            }
        });
    }
    createAndMapParent(newParent) {
        const parent = this.createHTMLElement(this.document, newParent);
        this.nodeMap.set(newParent, parent);
        return parent;
    }
    handleSelectionChanged = (document, selected, unselected) => {
        unselected.forEach((x) => {
            this.nodeMap.get(x)?.removeSelectedStyle(style.selected);
            this.selectedNodes.delete(x);
        });
        this.setLastClickItem(undefined);
        selected.forEach((model) => {
            this.selectedNodes.add(model);
            this.nodeMap.get(model)?.addSelectedStyle(style.selected);
        });
        this.scrollToNode(selected);
    };
    ensureHasHTML(records) {
        records.forEach((record) => {
            if (!this.nodeMap.has(record.node)) {
                this.nodeMap.set(record.node, this.createHTMLElement(this.document, record.node));
            }
        });
    }
    scrollToNode(selected) {
        const node = selected.at(0);
        if (node) {
            this.expandParents(node);
            this.nodeMap.get(node)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }
    expandParents(node) {
        let parent = node.parent;
        while (parent) {
            const group = this.nodeMap.get(parent);
            if (group && !group.isExpanded) {
                group.isExpanded = true;
            }
            parent = parent.parent;
        }
    }
    addAllNodes(document, parent, node) {
        const element = this.createHTMLElement(document, node);
        this.nodeMap.set(node, element);
        parent.appendChild(element);
        const firstChild = node.firstChild;
        if (firstChild) this.addAllNodes(document, element, firstChild);
        if (node.nextSibling) this.addAllNodes(document, parent, node.nextSibling);
    }
    createHTMLElement(document, node) {
        let result;
        if (INode.isLinkedListNode(node)) result = new TreeGroup(document, node);
        else if (node instanceof VisualNode) result = new TreeModel(document, node);
        else throw new Error("unknown node");
        return result;
    }
    addEvents(item) {
        item.addEventListener("dragstart", this.onDragStart);
        item.addEventListener("dragover", this.onDragOver);
        item.addEventListener("dragleave", this.onDragLeave);
        item.addEventListener("drop", this.onDrop);
        item.addEventListener("click", this.onClick);
    }
    removeEvents(item) {
        item.removeEventListener("dragstart", this.onDragStart);
        item.removeEventListener("dragover", this.onDragOver);
        item.removeEventListener("dragleave", this.onDragLeave);
        item.removeEventListener("drop", this.onDrop);
        item.removeEventListener("click", this.onClick);
    }
    getTreeItem(item) {
        if (item === null) return undefined;
        if (item instanceof TreeItem) return item;
        return this.getTreeItem(item.parentElement);
    }
    onClick = (event) => {
        if (!this.canSelect()) return;
        const item = this.getTreeItem(event.target)?.node;
        if (!item) return;
        event.stopPropagation();
        if (event.shiftKey) {
            this.handleShiftClick(item);
        } else {
            this.document.selection.setSelection([item], event.ctrlKey);
        }
        this.setLastClickItem(item);
    };
    handleShiftClick(item) {
        if (this.lastClicked) {
            const nodes = INode.getNodesBetween(this.lastClicked, item);
            this.document.selection.setSelection(nodes, false);
        }
    }
    onDragLeave = (event) => {
        if (!this.canDrop(event)) return;
    };
    onDragOver = (event) => {
        if (!this.canDrop(event)) {
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    };
    canSelect() {
        if (this.document.visual.eventHandler instanceof NodeSelectionHandler) {
            return true;
        }
        if (this.document.visual.eventHandler instanceof ShapeSelectionHandler) {
            return this.document.visual.eventHandler.shapeType === ShapeType.Shape;
        }
        return false;
    }
    setLastClickItem(item) {
        if (this.lastClicked !== undefined) {
            this.nodeMap.get(this.lastClicked)?.removeSelectedStyle(style.current);
        }
        this.lastClicked = item;
        if (item !== undefined) {
            this.nodeMap.get(item)?.addSelectedStyle(style.current);
            this.document.currentNode = INode.isLinkedListNode(item) ? item : item.parent;
        }
    }
    canDrop(event) {
        let node = this.getTreeItem(event.target)?.node;
        if (node === undefined) return false;
        if (this.dragging?.includes(node)) return false;
        let parent = node.parent;
        while (parent !== undefined) {
            if (this.dragging?.includes(parent)) return false;
            parent = parent.parent;
        }
        return true;
    }
    onDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        let node = this.getTreeItem(event.target)?.node;
        if (node === undefined) return;
        Transaction.execute(this.document, "move node", () => {
            let isLinkList = INode.isLinkedListNode(node);
            let newParent = isLinkList ? node : node.parent;
            let target = isLinkList ? undefined : node;
            this.dragging?.forEach((x) => {
                x.parent?.move(x, newParent, target);
            });
            this.dragging = undefined;
        });
    };
    onDragStart = (event) => {
        event.stopPropagation();
        const item = this.getTreeItem(event.target)?.node;
        this.dragging = INode.findTopLevelNodes(this.selectedNodes);
        if (item && !INode.containsDescendant(this.selectedNodes, item)) {
            this.dragging.push(item);
        }
    };
}
customElements.define("ui-tree", Tree);
