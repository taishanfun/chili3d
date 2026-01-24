// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { ShapeType, VisualState } from "chili-core";
import { SelectionHandler } from "./selectionEventHandler";
export class NodeSelectionHandler extends SelectionHandler {
    filter;
    _highlights;
    _detectAtMouse;
    _lockDetected; // 用于切换捕获的对象
    highlighState = VisualState.edgeHighlight;
    nodes() {
        return this.document.selection.getSelectedNodes();
    }
    constructor(document, multiMode, controller, filter) {
        super(document, multiMode, controller);
        this.filter = filter;
    }
    select(view, event) {
        if (!this._highlights?.length) {
            this.clearSelected(this.document);
            return 0;
        }
        const models = this._highlights
            .map((x) => view.document.visual.context.getNode(x))
            .filter((x) => x !== undefined);
        this.document.selection.setSelection(models, this.toggleSelect(event));
        return models.length;
    }
    toggleSelect(event) {
        return event.shiftKey;
    }
    getDetecteds(view, event) {
        if (
            this.rect &&
            Math.abs(this.mouse.x - event.offsetX) > 3 &&
            Math.abs(this.mouse.y - event.offsetY) > 3
        ) {
            return view.detectVisualRect(
                this.mouse.x,
                this.mouse.y,
                event.offsetX,
                event.offsetY,
                this.filter,
            );
        }
        this._detectAtMouse = view.detectVisual(event.offsetX, event.offsetY, this.filter);
        const detected = this.getDetecting();
        return detected ? [detected] : [];
    }
    getDetecting() {
        if (!this._detectAtMouse) return undefined;
        const index = this._lockDetected ? this.getDetcedtingIndex() : 0;
        return this._detectAtMouse[index] || undefined;
    }
    getDetcedtingIndex() {
        if (!this._detectAtMouse) return -1;
        for (let i = 0; i < this._detectAtMouse.length; i++) {
            if (this._lockDetected === this._detectAtMouse[i]) {
                return i;
            }
        }
        return -1;
    }
    setHighlight(view, event) {
        let detecteds = this.getDetecteds(view, event);
        this.highlightDetecteds(view, detecteds);
    }
    highlightDetecteds(view, detecteds) {
        this.cleanHighlights();
        detecteds.forEach((x) => {
            view.document.visual.highlighter.addState(x, this.highlighState, ShapeType.Shape);
        });
        this._highlights = detecteds;
        view.update();
    }
    cleanHighlights() {
        this._highlights?.forEach((x) => {
            this.document.visual.highlighter.removeState(x, this.highlighState, ShapeType.Shape);
        });
        this._highlights = undefined;
    }
    highlightNext(view) {
        if (this._detectAtMouse && this._detectAtMouse.length > 1) {
            const index = this._lockDetected
                ? (this.getDetcedtingIndex() + 1) % this._detectAtMouse.length
                : 1;
            this._lockDetected = this._detectAtMouse[index];
            const detected = this.getDetecting();
            if (detected) this.highlightDetecteds(view, [detected]);
        }
    }
    clearSelected(document) {
        document.selection.clearSelection();
    }
}
