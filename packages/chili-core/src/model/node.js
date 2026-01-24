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
import { HistoryObservable, Id } from "../foundation";
import { Property } from "../property";
import { Serializer } from "../serialize";
export var INode;
(function (INode) {
    function isLinkedListNode(node) {
        return node.add !== undefined;
    }
    INode.isLinkedListNode = isLinkedListNode;
})(INode || (INode = {}));
export class Node extends HistoryObservable {
    parent;
    previousSibling;
    nextSibling;
    id;
    constructor(document, name, id) {
        super(document);
        this.id = id;
        this.setPrivateValue("name", name || "untitled");
    }
    get name() {
        return this.getPrivateValue("name");
    }
    set name(value) {
        this.setProperty("name", value);
    }
    get rev() {
        return this.getPrivateValue("rev", 0);
    }
    set rev(value) {
        this.setProperty("rev", value);
    }
    get customProperties() {
        return this.getPrivateValue("customProperties", "{}");
    }
    set customProperties(value) {
        this.setProperty("customProperties", value);
    }
    get customPropertyTypes() {
        return this.getPrivateValue("customPropertyTypes", "{}");
    }
    set customPropertyTypes(value) {
        this.setProperty("customPropertyTypes", value);
    }
    get visible() {
        return this.getPrivateValue("visible", true);
    }
    set visible(value) {
        this.setProperty("visible", value, () => this.onVisibleChanged());
    }
    get parentVisible() {
        return this.getPrivateValue("parentVisible", true);
    }
    set parentVisible(value) {
        this.setProperty("parentVisible", value, () => this.onParentVisibleChanged());
    }
    disposeInternal() {
        this.document.visual.context.removeNode([this]);
        super.disposeInternal();
    }
    setCustomProperty(key, value) {
        let props = {};
        try {
            props = JSON.parse(this.customProperties || "{}");
        } catch {
            props = {};
        }
        props[key] = value;
        this.customProperties = JSON.stringify(props);
    }
    clone() {
        const oldValue = this.document.history.disabled;
        try {
            this.document.history.disabled = true;
            let serialized = Serializer.serializeObject(this);
            serialized.properties["id"] = Id.generate();
            serialized.properties["name"] = `${this.name}_copy`;
            return Serializer.deserializeObject(this.document, serialized);
        } finally {
            this.document.history.disabled = oldValue;
        }
    }
}
__decorate([Serializer.serialze()], Node.prototype, "id", void 0);
__decorate([Serializer.serialze(), Property.define("common.name")], Node.prototype, "name", null);
__decorate([Serializer.serialze()], Node.prototype, "rev", null);
__decorate([Serializer.serialze()], Node.prototype, "customProperties", null);
__decorate([Serializer.serialze()], Node.prototype, "customPropertyTypes", null);
__decorate([Serializer.serialze()], Node.prototype, "visible", null);
(function (INode) {
    function getNodesBetween(node1, node2) {
        if (node1 === node2) return [node1];
        let nodes = [];
        let prePath = getPathToRoot(node1);
        let curPath = getPathToRoot(node2);
        let index = getCommonParentIndex(prePath, curPath);
        let parent = prePath.at(1 - index);
        if (parent === curPath[0] || parent === prePath[0]) {
            let child = parent === curPath[0] ? prePath[0] : curPath[0];
            getNodesFromParentToChild(nodes, parent, child);
        } else if (currentAtBack(prePath.at(-index), curPath.at(-index))) {
            getNodesFromPath(nodes, prePath, curPath, index);
        } else {
            getNodesFromPath(nodes, curPath, prePath, index);
        }
        return nodes;
    }
    INode.getNodesBetween = getNodesBetween;
    function getNodesFromPath(nodes, path1, path2, commonIndex) {
        nodeOrChildrenAppendToNodes(nodes, path1[0]);
        path1ToCommonNodes(nodes, path1, commonIndex);
        commonToPath2Nodes(nodes, path1, path2, commonIndex);
    }
    function path1ToCommonNodes(nodes, path1, commonIndex) {
        for (let i = 0; i < path1.length - commonIndex; i++) {
            let next = path1[i].nextSibling;
            while (next !== undefined) {
                INode.nodeOrChildrenAppendToNodes(nodes, next);
                next = next.nextSibling;
            }
        }
    }
    function commonToPath2Nodes(nodes, path1, path2, commonIndex) {
        let nextParent = path1.at(-commonIndex)?.nextSibling;
        while (nextParent) {
            if (nextParent === path2[0]) {
                nodes.push(path2[0]);
                return;
            }
            if (INode.isLinkedListNode(nextParent)) {
                if (getNodesFromParentToChild(nodes, nextParent, path2[0])) {
                    return;
                }
            } else {
                nodes.push(nextParent);
            }
            nextParent = nextParent.nextSibling;
        }
    }
    function nodeOrChildrenAppendToNodes(nodes, node) {
        if (INode.isLinkedListNode(node)) {
            getNodesFromParentToChild(nodes, node);
        } else {
            nodes.push(node);
        }
    }
    INode.nodeOrChildrenAppendToNodes = nodeOrChildrenAppendToNodes;
    function findTopLevelNodes(nodes) {
        let result = [];
        for (const node of nodes) {
            if (!containsDescendant(nodes, node)) {
                result.push(node);
            }
        }
        return result;
    }
    INode.findTopLevelNodes = findTopLevelNodes;
    function containsDescendant(nodes, node) {
        if (node.parent === undefined) return false;
        if (nodes.has(node.parent)) return true;
        return containsDescendant(nodes, node.parent);
    }
    INode.containsDescendant = containsDescendant;
    function getNodesFromParentToChild(nodes, parent, until) {
        nodes.push(parent);
        let node = parent.firstChild;
        while (node !== undefined) {
            if (until === node) {
                nodes.push(node);
                return true;
            }
            if (INode.isLinkedListNode(node)) {
                if (getNodesFromParentToChild(nodes, node, until)) return true;
            } else {
                nodes.push(node);
            }
            node = node.nextSibling;
        }
        return false;
    }
    function currentAtBack(preNode, curNode) {
        while (preNode.nextSibling !== undefined) {
            if (preNode.nextSibling === curNode) return true;
            preNode = preNode.nextSibling;
        }
        return false;
    }
    function getCommonParentIndex(prePath, curPath) {
        let index = 1;
        for (index; index <= Math.min(prePath.length, curPath.length); index++) {
            if (prePath.at(-index) !== curPath.at(-index)) break;
        }
        if (prePath.at(1 - index) !== curPath.at(1 - index)) throw new Error("can not find a common parent");
        return index;
    }
    function getPathToRoot(node) {
        let path = [];
        let parent = node;
        while (parent !== undefined) {
            path.push(parent);
            parent = parent.parent;
        }
        return path;
    }
})(INode || (INode = {}));
export var NodeSerializer;
(function (NodeSerializer) {
    function serialize(node) {
        let nodes = [];
        serializeNodeToArray(nodes, node, undefined);
        return nodes;
    }
    NodeSerializer.serialize = serialize;
    function serializeNodeToArray(nodes, node, parentId) {
        let serialized = Serializer.serializeObject(node);
        if (parentId) serialized["parentId"] = parentId;
        nodes.push(serialized);
        if (INode.isLinkedListNode(node) && node.firstChild) {
            serializeNodeToArray(nodes, node.firstChild, node.id);
        }
        if (node.nextSibling) {
            serializeNodeToArray(nodes, node.nextSibling, parentId);
        }
        return nodes;
    }
    async function deserialize(document, nodes) {
        let nodeMap = new Map();
        nodes.forEach((n) => {
            let node = Serializer.deserializeObject(document, n);
            if (INode.isLinkedListNode(node)) {
                nodeMap.set(n.properties["id"], node);
            }
            let parentId = n["parentId"];
            if (!parentId) return;
            if (nodeMap.has(parentId)) {
                nodeMap.get(parentId).add(node);
            } else {
                console.warn("parent not found: " + parentId);
            }
        });
        return Promise.resolve(nodeMap.get(nodes[0].properties["id"]));
    }
    NodeSerializer.deserialize = deserialize;
})(NodeSerializer || (NodeSerializer = {}));
