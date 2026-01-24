// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Layer, ObservableCollection } from "chili-core";
import { ThreeVisual } from "../src/threeVisual";
export class TestDocument {
    application;
    components = [];
    name;
    mode = "3d";
    currentNode;
    currentLayerId;
    id;
    history;
    selection;
    visual;
    rootNode;
    activeView;
    layers = new ObservableCollection();
    materials = new ObservableCollection();
    acts = new ObservableCollection();
    onPropertyChanged(handler) {
        throw new Error("Method not implemented.");
    }
    removePropertyChanged(handler) {
        throw new Error("Method not implemented.");
    }
    dispose() {
        throw new Error("Method not implemented.");
    }
    importFiles(files) {
        return Promise.resolve();
    }
    close() {
        return Promise.resolve();
    }
    serialize() {
        return {
            classKey: "TestDocument",
            properties: {},
        };
    }
    constructor() {
        this.name = "test";
        this.id = "test";
        this.visual = new ThreeVisual(this);
        this.history = {};
        this.selection = {};
        this.rootNode = {};
        this.application = { views: [] };
        const layer = new Layer(this, "Layer 1", "#333333");
        this.layers.push(layer);
        this.currentLayerId = layer.id;
    }
    clearPropertyChanged() {
        throw new Error("Method not implemented.");
    }
    addNodeObserver(observer) {}
    removeNodeObserver(observer) {
        throw new Error("Method not implemented.");
    }
    notifyNodeChanged(records) {
        throw new Error("Method not implemented.");
    }
    addNode(...nodes) {
        throw new Error("Method not implemented.");
    }
    save() {
        return Promise.resolve();
    }
}
