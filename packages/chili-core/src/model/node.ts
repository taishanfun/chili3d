// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { IDocument } from "../document";
import { HistoryObservable, IDisposable, IPropertyChanged, Id } from "../foundation";
import { Property } from "../property";
import { Serialized, Serializer } from "../serialize";

export interface INode extends IPropertyChanged, IDisposable {
    readonly id: string;
    visible: boolean;
    parentVisible: boolean;
    name: string;
    parent: INodeLinkedList | undefined;
    previousSibling: INode | undefined;
    nextSibling: INode | undefined;
    clone(): this;
}

export interface INodeLinkedList extends INode {
    get firstChild(): INode | undefined;
    get lastChild(): INode | undefined;
    add(...items: INode[]): void;
    remove(...items: INode[]): void;
    transfer(...items: INode[]): void;
    size(): number;
    insertAfter(target: INode | undefined, node: INode): void;
    insertBefore(target: INode | undefined, node: INode): void;
    move(child: INode, newParent: this, newPreviousSibling?: INode): void;
}

export namespace INode {
    export function isLinkedListNode(node: INode): node is INodeLinkedList {
        return (node as INodeLinkedList).add !== undefined;
    }
}

export abstract class Node extends HistoryObservable implements INode {
    parent: INodeLinkedList | undefined;
    previousSibling: INode | undefined;
    nextSibling: INode | undefined;

    @Serializer.serialze()
    readonly id: string;

    constructor(document: IDocument, name: string, id: string) {
        super(document);
        this.id = id;
        this.setPrivateValue("name", name || "untitled");
    }

    @Serializer.serialze()
    @Property.define("common.name")
    get name() {
        return this.getPrivateValue("name");
    }
    set name(value: string) {
        this.setProperty("name", value);
    }

    @Serializer.serialze()
    get visible(): boolean {
        return this.getPrivateValue("visible", true);
    }
    set visible(value: boolean) {
        this.setProperty("visible", value, () => this.onVisibleChanged());
    }

    @Serializer.serialze()
    get customProperties(): string {
        return this.getPrivateValue("customProperties", "");
    }
    set customProperties(value: string) {
        this.setProperty("customProperties", value ?? "");
    }

    @Serializer.serialze()
    get customPropertyTypes(): string {
        return this.getPrivateValue("customPropertyTypes", "");
    }
    set customPropertyTypes(value: string) {
        this.setProperty("customPropertyTypes", value ?? "");
    }

    getCustomProperty(key: string): unknown {
        const data = this.getCustomPropertiesObject();
        return data?.[key];
    }

    setCustomProperty(key: string, value: unknown) {
        const data = this.getCustomPropertiesObject();
        data[key] = value;
        this.customProperties = JSON.stringify(data, null, 2);

        const types = this.getCustomPropertyTypesObject();
        if (!types[key]) {
            types[key] = this.inferCustomPropertyType(value);
            this.customPropertyTypes = JSON.stringify(types, null, 2);
        }
    }

    removeCustomProperty(key: string) {
        const data = this.getCustomPropertiesObject();
        delete data[key];
        this.customProperties = Object.keys(data).length ? JSON.stringify(data, null, 2) : "";

        const types = this.getCustomPropertyTypesObject();
        if (types[key]) {
            delete types[key];
            this.customPropertyTypes = Object.keys(types).length ? JSON.stringify(types, null, 2) : "";
        }
    }

    getCustomPropertyType(key: string): string | undefined {
        const types = this.getCustomPropertyTypesObject();
        return types?.[key];
    }

    setCustomPropertyType(key: string, type: string) {
        const types = this.getCustomPropertyTypesObject();
        types[key] = type;
        this.customPropertyTypes = JSON.stringify(types, null, 2);
    }

    removeCustomPropertyType(key: string) {
        const types = this.getCustomPropertyTypesObject();
        delete types[key];
        this.customPropertyTypes = Object.keys(types).length ? JSON.stringify(types, null, 2) : "";
    }

    protected abstract onVisibleChanged(): void;

    get parentVisible() {
        return this.getPrivateValue("parentVisible", true);
    }
    set parentVisible(value: boolean) {
        this.setProperty("parentVisible", value, () => this.onParentVisibleChanged());
    }

    override disposeInternal(): void {
        this.document.visual.context.removeNode([this]);
        super.disposeInternal();
    }

    clone(): this {
        const oldValue = this.document.history.disabled;
        try {
            this.document.history.disabled = true;
            let serialized = Serializer.serializeObject(this);
            serialized.properties["id"] = Id.generate();
            serialized.properties["name"] = `${this.name}_copy`;
            return Serializer.deserializeObject(this.document, serialized) as this;
        } finally {
            this.document.history.disabled = oldValue;
        }
    }

    protected abstract onParentVisibleChanged(): void;

    private getCustomPropertiesObject(): Record<string, any> {
        const text = this.customProperties?.trim();
        if (!text) return {};
        try {
            const parsed = JSON.parse(text);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed as Record<string, any>;
            }
            return {};
        } catch {
            return {};
        }
    }

    private getCustomPropertyTypesObject(): Record<string, string> {
        const text = this.customPropertyTypes?.trim();
        if (!text) return {};
        try {
            const parsed = JSON.parse(text);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed as Record<string, string>;
            }
            return {};
        } catch {
            return {};
        }
    }

    private inferCustomPropertyType(value: unknown): string {
        if (typeof value === "boolean") return "boolean";
        if (typeof value === "number") return "number";
        if (typeof value === "string") return "string";
        return "object";
    }
}

export namespace INode {
    export function getNodesBetween(node1: INode, node2: INode): INode[] {
        if (node1 === node2) return [node1];
        let nodes: INode[] = [];
        let prePath = getPathToRoot(node1);
        let curPath = getPathToRoot(node2);
        let index = getCommonParentIndex(prePath, curPath);
        let parent = prePath.at(1 - index) as INodeLinkedList;
        if (parent === curPath[0] || parent === prePath[0]) {
            let child = parent === curPath[0] ? prePath[0] : curPath[0];
            getNodesFromParentToChild(nodes, parent, child);
        } else if (currentAtBack(prePath.at(-index)!, curPath.at(-index)!)) {
            getNodesFromPath(nodes, prePath, curPath, index);
        } else {
            getNodesFromPath(nodes, curPath, prePath, index);
        }
        return nodes;
    }

    function getNodesFromPath(nodes: INode[], path1: INode[], path2: INode[], commonIndex: number) {
        nodeOrChildrenAppendToNodes(nodes, path1[0]);
        path1ToCommonNodes(nodes, path1, commonIndex);
        commonToPath2Nodes(nodes, path1, path2, commonIndex);
    }

    function path1ToCommonNodes(nodes: INode[], path1: INode[], commonIndex: number) {
        for (let i = 0; i < path1.length - commonIndex; i++) {
            let next = path1[i].nextSibling;
            while (next !== undefined) {
                INode.nodeOrChildrenAppendToNodes(nodes, next);
                next = next.nextSibling;
            }
        }
    }

    function commonToPath2Nodes(nodes: INode[], path1: INode[], path2: INode[], commonIndex: number) {
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

    export function nodeOrChildrenAppendToNodes(nodes: INode[], node: INode) {
        if (INode.isLinkedListNode(node)) {
            getNodesFromParentToChild(nodes, node);
        } else {
            nodes.push(node);
        }
    }

    export function findTopLevelNodes(nodes: Set<INode>) {
        let result: INode[] = [];
        for (const node of nodes) {
            if (!containsDescendant(nodes, node)) {
                result.push(node);
            }
        }
        return result;
    }

    export function containsDescendant(nodes: Set<INode>, node: INode): boolean {
        if (node.parent === undefined) return false;
        if (nodes.has(node.parent)) return true;
        return containsDescendant(nodes, node.parent);
    }

    function getNodesFromParentToChild(nodes: INode[], parent: INodeLinkedList, until?: INode): boolean {
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

    function currentAtBack(preNode: INode, curNode: INode) {
        while (preNode.nextSibling !== undefined) {
            if (preNode.nextSibling === curNode) return true;
            preNode = preNode.nextSibling;
        }
        return false;
    }

    function getCommonParentIndex(prePath: INode[], curPath: INode[]) {
        let index = 1;
        for (index; index <= Math.min(prePath.length, curPath.length); index++) {
            if (prePath.at(-index) !== curPath.at(-index)) break;
        }
        if (prePath.at(1 - index) !== curPath.at(1 - index)) throw new Error("can not find a common parent");
        return index;
    }

    function getPathToRoot(node: INode): INode[] {
        let path: INode[] = [];
        let parent: INode | undefined = node;
        while (parent !== undefined) {
            path.push(parent);
            parent = parent.parent;
        }
        return path;
    }
}

export namespace NodeSerializer {
    export function serialize(node: INode) {
        let nodes: Serialized[] = [];
        serializeNodeToArray(nodes, node, undefined);
        return nodes;
    }

    function serializeNodeToArray(nodes: Serialized[], node: INode, parentId: string | undefined) {
        let serialized: any = Serializer.serializeObject(node);
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

    export async function deserialize(document: IDocument, nodes: Serialized[]) {
        let nodeMap: Map<string, INodeLinkedList> = new Map();
        nodes.forEach((n) => {
            let node = Serializer.deserializeObject(document, n);
            if (INode.isLinkedListNode(node)) {
                nodeMap.set(n.properties["id"], node);
            }
            let parentId = (n as any)["parentId"];
            if (!parentId) return;
            if (nodeMap.has(parentId)) {
                nodeMap.get(parentId)!.add(node);
            } else {
                console.warn("parent not found: " + parentId);
            }
        });
        return Promise.resolve(nodeMap.get(nodes[0].properties["id"]));
    }
}
