// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import {
    DOCUMENT_FILE_EXTENSION,
    getCurrentApplication,
    I18n,
    Id,
    Material,
    ObservableCollection,
    Plane,
    PubSub,
    setCurrentApplication,
} from "chili-core";
import { Document } from "./document";
import { importFiles } from "./utils";
export class Application {
    dataExchange;
    visualFactory;
    shapeFactory;
    services;
    storage;
    mainWindow;
    views = new ObservableCollection();
    documents = new Set();
    executingCommand;
    _activeView;
    get activeView() {
        return this._activeView;
    }
    set activeView(value) {
        if (this._activeView === value) return;
        this._activeView = value;
        PubSub.default.pub("activeViewChanged", value);
    }
    constructor(option) {
        if (getCurrentApplication() !== undefined) {
            throw new Error("Only one application can be created");
        }
        setCurrentApplication(this);
        this.visualFactory = option.visualFactory;
        this.shapeFactory = option.shapeFactory;
        this.services = option.services;
        this.storage = option.storage;
        this.dataExchange = option.dataExchange;
        this.mainWindow = option.mainWindow;
        this.services.forEach((x) => x.register(this));
        this.services.forEach((x) => x.start());
        this.initWindowEvents();
    }
    initWindowEvents() {
        window.onbeforeunload = this.handleWindowUnload;
        this.mainWindow?.addEventListener(
            "dragstart",
            (ev) => {
                ev.preventDefault();
            },
            false,
        );
        this.mainWindow?.addEventListener(
            "dragover",
            (ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                ev.dataTransfer.dropEffect = "copy";
            },
            false,
        );
        this.mainWindow?.addEventListener(
            "drop",
            (ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                this.importFiles(ev.dataTransfer?.files);
            },
            false,
        );
    }
    handleWindowUnload = (event) => {
        if (this.activeView) {
            // Cancel the event as stated by the standard.
            event.preventDefault();
            // Chrome requires returnValue to be set.
            event.returnValue = "";
        }
    };
    async importFiles(files) {
        if (!files || files.length === 0) {
            return;
        }
        const { opens, imports } = this.groupFiles(files);
        this.loadDocumentsWithLoading(opens);
        importFiles(this, imports);
    }
    loadDocumentsWithLoading(opens) {
        PubSub.default.pub(
            "showPermanent",
            async () => {
                for (const file of opens) {
                    let json = JSON.parse(await file.text());
                    await this.loadDocument(json);
                    this.activeView?.cameraController.fitContent();
                }
            },
            "toast.excuting{0}",
            I18n.translate("command.doc.open"),
        );
    }
    groupFiles(files) {
        const opens = [];
        const imports = [];
        for (const element of files) {
            if (element.name.endsWith(DOCUMENT_FILE_EXTENSION)) {
                opens.push(element);
            } else {
                imports.push(element);
            }
        }
        return { opens, imports };
    }
    async openDocument(id) {
        const document = await Document.open(this, id);
        await this.createActiveView(document);
        return document;
    }
    async newDocument(name, mode = "3d") {
        const document = new Document(this, name, Id.generate(), mode);
        const lightGray = new Material(document, "LightGray", 0xdedede);
        const deepGray = new Material(document, "DeepGray", 0x898989);
        document.materials.push(lightGray, deepGray);
        await this.createActiveView(document);
        return document;
    }
    async loadDocument(data) {
        const document = await Document.load(this, data);
        await this.createActiveView(document);
        return document;
    }
    async createActiveView(document) {
        if (document === undefined) return undefined;
        const viewName = document.mode === "2d" ? "2d" : "3d";
        const view = document.visual.createView(viewName, Plane.XY);
        this.activeView = view;
    }
}
