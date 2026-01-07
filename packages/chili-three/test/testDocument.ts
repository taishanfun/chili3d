// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import {
    Act,
    History,
    IApplication,
    IDocument,
    INode,
    INodeChangedObserver,
    INodeLinkedList,
    ISelection,
    ISerialize,
    IView,
    Layer,
    Material,
    NodeRecord,
    ObservableCollection,
    Serialized,
} from "chili-core";
import { Component } from "chili-core/src/model/component";
import { ThreeVisual } from "../src/threeVisual";

export class TestDocument implements IDocument, ISerialize {
    application: IApplication;
    components: Component[] = [];
    name: string;
    mode: "2d" | "3d" = "3d";
    currentNode: INodeLinkedList | undefined;
    currentLayerId: string | undefined;
    id: string;
    history: History;
    selection: ISelection;
    visual: ThreeVisual;
    rootNode: INodeLinkedList;
    activeView: IView | undefined;
    layers: ObservableCollection<Layer> = new ObservableCollection<Layer>();
    materials: ObservableCollection<Material> = new ObservableCollection<Material>();
    acts: ObservableCollection<Act> = new ObservableCollection<Act>();
    onPropertyChanged(handler: any): void {
        throw new Error("Method not implemented.");
    }
    removePropertyChanged(handler: any): void {
        throw new Error("Method not implemented.");
    }
    dispose() {
        throw new Error("Method not implemented.");
    }

    importFiles(files: File[] | FileList): Promise<void> {
        return Promise.resolve();
    }

    close(): Promise<void> {
        return Promise.resolve();
    }

    serialize(): Serialized {
        return {
            classKey: "TestDocument",
            properties: {},
        };
    }

    constructor() {
        this.name = "test";
        this.id = "test";
        this.visual = new ThreeVisual(this);
        this.history = {} as any;
        this.selection = {} as any;
        this.rootNode = {} as any;
        this.application = { views: [] } as any;
        const layer = new Layer(this, "Layer 1", "#333333");
        this.layers.push(layer);
        this.currentLayerId = layer.id;
    }
    clearPropertyChanged(): void {
        throw new Error("Method not implemented.");
    }
    addNodeObserver(observer: INodeChangedObserver): void {}
    removeNodeObserver(observer: INodeChangedObserver): void {
        throw new Error("Method not implemented.");
    }
    notifyNodeChanged(records: NodeRecord[]): void {
        throw new Error("Method not implemented.");
    }
    addNode(...nodes: INode[]): void {
        throw new Error("Method not implemented.");
    }
    save(): Promise<void> {
        return Promise.resolve();
    }
}
