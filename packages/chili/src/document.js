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
import {
    CollectionAction,
    Constants,
    FolderNode,
    History,
    I18n,
    Id,
    Layer,
    Logger,
    NodeLinkedListHistoryRecord,
    NodeSerializer,
    Observable,
    ObservableCollection,
    PubSub,
    Serializer,
    Transaction,
} from "chili-core";
import { Selection } from "./selection";
export class Document extends Observable {
    application;
    id;
    components = [];
    visual;
    history;
    selection;
    acts = new ObservableCollection();
    materials = new ObservableCollection();
    layers = new ObservableCollection();
    _nodeChangedObservers = new Set();
    static version = __DOCUMENT_VERSION__;
    get mode() {
        return this.getPrivateValue("mode", "3d");
    }
    set mode(value) {
        this.setProperty("mode", value);
    }
    get name() {
        return this.getPrivateValue("name");
    }
    set name(name) {
        if (this.name === name) return;
        this.setProperty("name", name);
        if (this._rootNode) this._rootNode.name = name;
    }
    _rootNode;
    get rootNode() {
        if (this._rootNode === undefined) {
            this.setRootNode(this.initRootNode());
        }
        return this._rootNode;
    }
    set rootNode(value) {
        this.setRootNode(value);
    }
    setRootNode(value) {
        if (this._rootNode === value) return;
        this._rootNode?.removePropertyChanged(this.handleRootNodeNameChanged);
        this._rootNode = value ?? new FolderNode(this, this.name);
        this._rootNode.onPropertyChanged(this.handleRootNodeNameChanged);
    }
    _currentNode;
    get currentNode() {
        return this._currentNode;
    }
    set currentNode(value) {
        this.setProperty("currentNode", value);
    }
    get currentLayerId() {
        return this.getPrivateValue("currentLayerId", this.layers.at(0)?.id);
    }
    set currentLayerId(value) {
        this.setProperty("currentLayerId", value);
    }
    _layerVisibilitySnapshot;
    isLayerIsolated() {
        return this._layerVisibilitySnapshot !== undefined;
    }
    isolateLayer(layerId) {
        if (!this._layerVisibilitySnapshot) {
            const snapshot = new Map();
            this.layers.forEach((layer) => snapshot.set(layer.id, layer.visible));
            this._layerVisibilitySnapshot = snapshot;
        }
        const oldDisabled = this.history.disabled;
        this.history.disabled = true;
        try {
            this.layers.forEach((layer) => {
                layer.visible = layer.id === layerId;
            });
        } finally {
            this.history.disabled = oldDisabled;
        }
    }
    unisolateLayer() {
        if (!this._layerVisibilitySnapshot) return;
        const snapshot = this._layerVisibilitySnapshot;
        const oldDisabled = this.history.disabled;
        this.history.disabled = true;
        try {
            this.layers.forEach((layer) => {
                const v = snapshot.get(layer.id);
                if (v !== undefined) {
                    layer.visible = v;
                }
            });
        } finally {
            this.history.disabled = oldDisabled;
            this._layerVisibilitySnapshot = undefined;
        }
    }
    constructor(application, name, id = Id.generate(), mode = "3d") {
        super();
        this.application = application;
        this.id = id;
        this.setPrivateValue("name", name);
        this.setPrivateValue("mode", mode);
        this.history = new History();
        this.visual = application.visualFactory.create(this);
        this.selection = new Selection(this);
        this.materials.onCollectionChanged(this.handleMaterialChanged);
        this.layers.onCollectionChanged(this.handleLayerChanged);
        application.documents.add(this);
        const defaultLayer = new Layer(this, "Layer 1", "#333333");
        this.layers.push(defaultLayer);
        this.setPrivateValue("currentLayerId", defaultLayer.id);
        Logger.info(`new document: ${name}`);
    }
    handleRootNodeNameChanged = (prop) => {
        if (prop === "name") {
            this.name = this.rootNode.name;
        }
    };
    initRootNode() {
        return new FolderNode(this, this.name);
    }
    serialize() {
        let serialized = {
            classKey: "Document",
            version: __DOCUMENT_VERSION__,
            properties: {
                id: this.id,
                name: this.name,
                mode: this.mode,
                currentLayerId: this.currentLayerId,
                components: this.components.map((x) => Serializer.serializeObject(x)),
                nodes: NodeSerializer.serialize(this.rootNode),
                layers: this.layers.map((x) => Serializer.serializeObject(x)),
                materials: this.materials.map((x) => Serializer.serializeObject(x)),
                acts: this.acts.map((x) => Serializer.serializeObject(x)),
            },
        };
        return serialized;
    }
    disposeInternal() {
        super.disposeInternal();
        this._nodeChangedObservers.clear();
        this._rootNode?.removePropertyChanged(this.handleRootNodeNameChanged);
        this._rootNode?.dispose();
        this.visual.dispose();
        this.history.dispose();
        this.selection.dispose();
        this.materials.forEach((x) => x.dispose());
        this.materials.clear();
        this.acts.forEach((x) => x.dispose());
        this.acts.clear();
        this._rootNode = undefined;
        this._currentNode = undefined;
    }
    async save() {
        const data = this.serialize();
        await this.application.storage.put(Constants.DBName, Constants.DocumentTable, this.id, data);
        const image = this.application.activeView?.toImage();
        await this.application.storage.put(Constants.DBName, Constants.RecentTable, this.id, {
            id: this.id,
            name: this.name,
            date: Date.now(),
            image,
        });
    }
    async close() {
        if (window.confirm(I18n.translate("prompt.saveDocument{0}", this.name))) {
            await this.save();
        }
        let views = this.application.views.filter((x) => x.document === this);
        this.application.views.remove(...views);
        this.application.activeView = this.application.views.at(0);
        this.application.documents.delete(this);
        this.materials.removeCollectionChanged(this.handleMaterialChanged);
        this.layers.removeCollectionChanged(this.handleLayerChanged);
        PubSub.default.pub("documentClosed", this);
        Logger.info(`document: ${this.name} closed`);
        this.dispose();
    }
    static async open(application, id) {
        let data = await application.storage.get(Constants.DBName, Constants.DocumentTable, id);
        if (data === undefined) {
            Logger.warn(`document: ${id} not find`);
            return;
        }
        let document = await this.load(application, data);
        if (document !== undefined) {
            Logger.info(`document: ${document.name} opened`);
        }
        return document;
    }
    static async load(app, data) {
        if (data.version !== __DOCUMENT_VERSION__) {
            alert(
                "The file version has been upgraded, no compatibility treatment was done in the development phase",
            );
            return undefined;
        }
        let document = new Document(
            app,
            data.properties["name"],
            data.properties["id"],
            data.properties["mode"] ?? "3d",
        );
        document.history.disabled = true;
        document.layers.clear();
        document.layers.push(
            ...(data.properties["layers"] ?? []).map((x) => Serializer.deserializeObject(document, x)),
        );
        if (document.layers.length === 0) {
            document.layers.push(new Layer(document, "Layer 1", "#333333"));
        }
        document.materials.push(
            ...data.properties["materials"].map((x) => Serializer.deserializeObject(document, x)),
        );
        document.acts.push(...data.properties["acts"].map((x) => Serializer.deserializeObject(document, x)));
        document.components.push(
            ...data.properties["components"].map((x) => Serializer.deserializeObject(document, x)),
        );
        const loadedCurrentLayerId = data.properties["currentLayerId"];
        if (loadedCurrentLayerId && document.layers.find((l) => l.id === loadedCurrentLayerId)) {
            document.currentLayerId = loadedCurrentLayerId;
        } else {
            document.currentLayerId = document.layers.at(0)?.id;
        }
        const rootNode = await NodeSerializer.deserialize(document, data.properties["nodes"]);
        document.setRootNode(rootNode);
        document.history.disabled = false;
        return document;
    }
    handleMaterialChanged = (args) => {
        if (args.action === CollectionAction.add) {
            Transaction.add(this, {
                name: "MaterialChanged",
                dispose() {},
                undo: () => this.materials.remove(...args.items),
                redo: () => this.materials.push(...args.items),
            });
        } else if (args.action === CollectionAction.remove) {
            Transaction.add(this, {
                name: "MaterialChanged",
                dispose() {},
                undo: () => this.materials.push(...args.items),
                redo: () => this.materials.remove(...args.items),
            });
        }
    };
    handleLayerChanged = (args) => {
        if (args.action === CollectionAction.add) {
            Transaction.add(this, {
                name: "LayerChanged",
                dispose() {},
                undo: () => this.layers.remove(...args.items),
                redo: () => this.layers.push(...args.items),
            });
            if (!this.currentLayerId) {
                this.currentLayerId = this.layers.at(0)?.id;
            }
        } else if (args.action === CollectionAction.remove) {
            Transaction.add(this, {
                name: "LayerChanged",
                dispose() {},
                undo: () => this.layers.push(...args.items),
                redo: () => this.layers.remove(...args.items),
            });
            if (this.currentLayerId && !this.layers.find((l) => l.id === this.currentLayerId)) {
                this.currentLayerId = this.layers.at(0)?.id;
            }
        }
    };
    addNodeObserver(observer) {
        this._nodeChangedObservers.add(observer);
    }
    removeNodeObserver(observer) {
        this._nodeChangedObservers.delete(observer);
    }
    notifyNodeChanged(records) {
        Transaction.add(this, new NodeLinkedListHistoryRecord(records));
        this._nodeChangedObservers.forEach((x) => x.handleNodeChanged(records));
    }
    addNode(...nodes) {
        (this.currentNode ?? this.rootNode).add(...nodes);
    }
}
__decorate([Serializer.serialze()], Document.prototype, "rootNode", null);
