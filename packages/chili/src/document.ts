// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import {
    Act,
    CollectionAction,
    CollectionChangedArgs,
    Component,
    Constants,
    FolderNode,
    History,
    I18n,
    IApplication,
    IDocument,
    INode,
    INodeChangedObserver,
    INodeLinkedList,
    ISelection,
    IVisual,
    Id,
    Layer,
    Logger,
    Material,
    NodeLinkedListHistoryRecord,
    NodeRecord,
    NodeSerializer,
    Observable,
    ObservableCollection,
    PubSub,
    Serialized,
    Serializer,
    Transaction,
} from "chili-core";
import { Selection } from "./selection";

export class Document extends Observable implements IDocument {
    readonly components: Component[] = [];
    readonly visual: IVisual;
    readonly history: History;
    readonly selection: ISelection;
    readonly acts = new ObservableCollection<Act>();
    readonly materials: ObservableCollection<Material> = new ObservableCollection();
    readonly layers: ObservableCollection<Layer> = new ObservableCollection();

    private readonly _nodeChangedObservers = new Set<INodeChangedObserver>();

    static readonly version = __DOCUMENT_VERSION__;

    get mode(): "2d" | "3d" {
        return this.getPrivateValue("mode", "3d");
    }
    set mode(value: "2d" | "3d") {
        this.setProperty("mode", value);
    }

    get name(): string {
        return this.getPrivateValue("name");
    }
    set name(name: string) {
        if (this.name === name) return;
        this.setProperty("name", name);
        if (this._rootNode) this._rootNode.name = name;
    }

    private _rootNode: INodeLinkedList | undefined;
    @Serializer.serialze()
    get rootNode(): INodeLinkedList {
        if (this._rootNode === undefined) {
            this.setRootNode(this.initRootNode());
        }
        return this._rootNode!;
    }
    set rootNode(value: INodeLinkedList) {
        this.setRootNode(value);
    }

    private setRootNode(value?: INodeLinkedList) {
        if (this._rootNode === value) return;
        this._rootNode?.removePropertyChanged(this.handleRootNodeNameChanged);
        this._rootNode = value ?? new FolderNode(this, this.name);
        this._rootNode.onPropertyChanged(this.handleRootNodeNameChanged);
    }

    private _currentNode?: INodeLinkedList;
    get currentNode(): INodeLinkedList | undefined {
        return this._currentNode;
    }
    set currentNode(value: INodeLinkedList | undefined) {
        this.setProperty("currentNode", value);
    }

    get currentLayerId(): string | undefined {
        return this.getPrivateValue("currentLayerId", this.layers.at(0)?.id);
    }
    set currentLayerId(value: string | undefined) {
        this.setProperty("currentLayerId", value);
    }

    private _layerVisibilitySnapshot?: Map<string, boolean>;

    isLayerIsolated(): boolean {
        return this._layerVisibilitySnapshot !== undefined;
    }

    isolateLayer(layerId: string): void {
        if (!this._layerVisibilitySnapshot) {
            const snapshot = new Map<string, boolean>();
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

    unisolateLayer(): void {
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

    constructor(
        readonly application: IApplication,
        name: string,
        readonly id: string = Id.generate(),
        mode: "2d" | "3d" = "3d",
    ) {
        super();
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

    private readonly handleRootNodeNameChanged = (prop: string) => {
        if (prop === "name") {
            this.name = this.rootNode.name;
        }
    };

    initRootNode() {
        return new FolderNode(this, this.name);
    }

    serialize(): Serialized {
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

    override disposeInternal(): void {
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

    static async open(application: IApplication, id: string) {
        let data = (await application.storage.get(
            Constants.DBName,
            Constants.DocumentTable,
            id,
        )) as Serialized;
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

    static async load(app: IApplication, data: Serialized): Promise<IDocument | undefined> {
        if ((data as any).version !== __DOCUMENT_VERSION__) {
            alert(
                "The file version has been upgraded, no compatibility treatment was done in the development phase",
            );
            return undefined;
        }
        let document = new Document(
            app,
            data.properties["name"],
            data.properties["id"],
            (data.properties as any)["mode"] ?? "3d",
        );
        document.history.disabled = true;
        document.layers.clear();
        document.layers.push(
            ...((data.properties as any)["layers"] ?? []).map((x: Serialized) =>
                Serializer.deserializeObject(document, x),
            ),
        );
        if (document.layers.length === 0) {
            document.layers.push(new Layer(document, "Layer 1", "#333333"));
        }
        document.materials.push(
            ...data.properties["materials"].map((x: Serialized) =>
                Serializer.deserializeObject(document, x),
            ),
        );
        document.acts.push(
            ...data.properties["acts"].map((x: Serialized) => Serializer.deserializeObject(document, x)),
        );
        document.components.push(
            ...data.properties["components"].map((x: Serialized) =>
                Serializer.deserializeObject(document, x),
            ),
        );

        const loadedCurrentLayerId = (data.properties as any)["currentLayerId"] as string | undefined;
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

    private readonly handleMaterialChanged = (args: CollectionChangedArgs) => {
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

    private readonly handleLayerChanged = (args: CollectionChangedArgs) => {
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

    addNodeObserver(observer: INodeChangedObserver) {
        this._nodeChangedObservers.add(observer);
    }

    removeNodeObserver(observer: INodeChangedObserver) {
        this._nodeChangedObservers.delete(observer);
    }

    notifyNodeChanged(records: NodeRecord[]) {
        Transaction.add(this, new NodeLinkedListHistoryRecord(records));
        this._nodeChangedObservers.forEach((x) => x.handleNodeChanged(records));
    }

    addNode(...nodes: INode[]): void {
        (this.currentNode ?? this.rootNode).add(...nodes);
    }
}
