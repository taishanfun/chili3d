// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { VisualState } from "chili-core";
import { SelectionHandler } from "./selectionEventHandler";
export class ShapeSelectionHandler extends SelectionHandler {
    shapeType;
    shapefilter;
    nodeFilter;
    _highlights;
    _detectAtMouse;
    _lockDetected;
    highlightState = VisualState.edgeHighlight;
    constructor(document, shapeType, multiMode, controller, shapefilter, nodeFilter) {
        super(document, multiMode, controller);
        this.shapeType = shapeType;
        this.shapefilter = shapefilter;
        this.nodeFilter = nodeFilter;
    }
    getDetecteds(view, event) {
        if (
            this.rect &&
            Math.abs(this.mouse.x - event.offsetX) > 3 &&
            Math.abs(this.mouse.y - event.offsetY) > 3
        ) {
            return view.detectShapesRect(
                this.shapeType,
                this.mouse.x,
                this.mouse.y,
                event.offsetX,
                event.offsetY,
                this.shapefilter,
                this.nodeFilter,
            );
        }
        this._detectAtMouse = view.detectShapes(
            this.shapeType,
            event.offsetX,
            event.offsetY,
            this.shapefilter,
            this.nodeFilter,
        );
        const detected = this.getDetecting();
        return detected ? [detected] : [];
    }
    setHighlight(view, event) {
        let detecteds = this.getDetecteds(view, event);
        this.highlightDetecteds(view, detecteds);
    }
    highlightDetecteds(view, detecteds) {
        this.cleanHighlights();
        detecteds.forEach((x) => {
            view.document.visual.highlighter.addState(
                x.owner,
                this.highlightState,
                this.shapeType,
                ...x.indexes,
            );
        });
        this._highlights = detecteds;
        view.update();
    }
    cleanHighlights() {
        this._highlights?.forEach((x) => {
            x.owner.node.document.visual.highlighter.removeState(
                x.owner,
                this.highlightState,
                this.shapeType,
                ...x.indexes,
            );
        });
        this._highlights = undefined;
    }
    highlightNext(view) {
        if (this._detectAtMouse && this._detectAtMouse.length > 1) {
            let index = this._lockDetected
                ? (this.getDetcedtingIndex() + 1) % this._detectAtMouse.length
                : 1;
            this._lockDetected = this._detectAtMouse[index].shape;
            const detected = this.getDetecting();
            if (detected) this.highlightDetecteds(view, [detected]);
        }
    }
    getDetecting() {
        if (this._detectAtMouse) {
            const index = this._lockDetected ? this.getDetcedtingIndex() : 0;
            return this._detectAtMouse[index];
        }
        return undefined;
    }
    getDetcedtingIndex() {
        return this._detectAtMouse?.findIndex((x) => this._lockDetected === x.shape) ?? -1;
    }
}
export class SubshapeSelectionHandler extends ShapeSelectionHandler {
    _shapes = new Map();
    selectedState = VisualState.edgeSelected;
    constructor(document, shapeType, multiMode, controller, filter, nodeFilter) {
        super(document, shapeType, multiMode, controller, filter, nodeFilter);
        this.showRect = false;
    }
    shapes() {
        return [...this._shapes.values()];
    }
    clearSelected(document) {
        for (const shape of this._shapes.values()) {
            this.removeSelected(shape);
        }
        this._shapes.clear();
    }
    select(view, event) {
        const document = view.document.visual.document;
        if (this.multiMode) {
            this._highlights?.forEach((x) =>
                this._shapes.has(x.shape) ? this.removeSelected(x) : this.addSelected(x),
            );
        } else {
            this.clearSelected(document);
            this._highlights?.forEach(this.addSelected.bind(this));
        }
        return this._shapes.size;
    }
    removeSelected(shape) {
        this._shapes.delete(shape.shape);
        shape.owner.node.document.visual.highlighter.removeState(
            shape.owner,
            this.selectedState,
            shape.shape.shapeType,
            ...shape.indexes,
        );
    }
    addSelected(shape) {
        shape.owner.node.document.visual.highlighter.addState(
            shape.owner,
            this.selectedState,
            this.shapeType,
            ...shape.indexes,
        );
        this._shapes.set(shape.shape, shape);
    }
}
