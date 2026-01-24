// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { IDisposable, Logger } from "chili-core";
import { NodeSelectionHandler } from "chili-vis";
import { AmbientLight, AxesHelper, Object3D, Scene } from "three";
import { ThreeHighlighter } from "./threeHighlighter";
import { ThreeView } from "./threeView";
import { ThreeVisualContext } from "./threeVisualContext";
import { ThreeViewHandler } from "./threeViewEventHandler";
import { ThreeMeshExporter } from "./meshExporter";
Object3D.DEFAULT_UP.set(0, 0, 1);
export class ThreeVisual {
    document;
    defaultEventHandler;
    context;
    scene;
    highlighter;
    viewHandler;
    meshExporter;
    _eventHandler;
    get eventHandler() {
        return this._eventHandler;
    }
    set eventHandler(value) {
        if (this._eventHandler === value) return;
        this._eventHandler = value;
        Logger.info(`Changed EventHandler to ${Object.getPrototypeOf(value).constructor.name}`);
    }
    constructor(document) {
        this.document = document;
        this.scene = this.initScene();
        this.defaultEventHandler = this.createDefaultSelectionHandler(document);
        this.viewHandler = new ThreeViewHandler();
        this.viewHandler.canRotate = document.mode !== "2d";
        this.context = new ThreeVisualContext(this, this.scene);
        this.highlighter = new ThreeHighlighter(this.context);
        this.meshExporter = new ThreeMeshExporter(this.context);
        this._eventHandler = this.defaultEventHandler;
    }
    createDefaultSelectionHandler(document) {
        return new NodeSelectionHandler(document, true);
    }
    initScene() {
        let scene = new Scene();
        let envLight = new AmbientLight(0x888888, 4);
        let axisHelper = new AxesHelper(250);
        scene.add(envLight, axisHelper);
        return scene;
    }
    resetEventHandler() {
        this.eventHandler = this.defaultEventHandler;
    }
    isExcutingHandler() {
        return this.eventHandler !== this.defaultEventHandler;
    }
    createView(name, workplane) {
        return new ThreeView(this.document, name, workplane, this.highlighter, this.context);
    }
    update() {
        this.document.application.views.forEach((view) => {
            if (view.document === this.document) view.update();
        });
    }
    dispose() {
        this.context.dispose();
        this.defaultEventHandler.dispose();
        this._eventHandler.dispose();
        this.viewHandler.dispose();
        this.scene.traverse((x) => {
            if (IDisposable.isDisposable(x)) x.dispose();
        });
        this.scene.clear();
    }
}
