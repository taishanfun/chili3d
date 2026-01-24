// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Logger, PubSub, ShapeNode, ShapeType, VisualNode, VisualState } from "chili-core";
import { NodeSelectionHandler, SubshapeSelectionHandler } from "chili-vis";
export class Selection {
    document;
    _selectedNodes = [];
    _unselectedNodes = [];
    shapeType = ShapeType.Shape;
    shapeFilter;
    nodeFilter;
    constructor(document) {
        this.document = document;
    }
    async pickShape(
        prompt,
        controller,
        multiMode,
        selectedState = VisualState.edgeSelected,
        highlightState = VisualState.edgeHighlight,
    ) {
        const handler = new SubshapeSelectionHandler(
            this.document,
            this.shapeType,
            multiMode,
            controller,
            this.shapeFilter,
            this.nodeFilter,
        );
        handler.selectedState = selectedState;
        handler.highlightState = highlightState;
        await this.pickAsync(handler, prompt, controller, multiMode);
        return handler.shapes();
    }
    async pickNode(prompt, controller, multiMode) {
        const handler = new NodeSelectionHandler(this.document, multiMode, controller, this.nodeFilter);
        await this.pickAsync(handler, prompt, controller, multiMode);
        return handler.nodes();
    }
    async pickAsync(handler, prompt, controller, showControl, cursor = "select.default") {
        const oldHandler = this.document.visual.eventHandler;
        this.document.visual.eventHandler = handler;
        PubSub.default.pub("viewCursor", cursor);
        PubSub.default.pub("statusBarTip", prompt);
        if (showControl) PubSub.default.pub("showSelectionControl", controller);
        try {
            await new Promise((resolve, reject) => {
                controller.onCompleted(resolve);
                controller.onCancelled(reject);
            });
        } catch (e) {
            Logger.debug("pick status: ", e);
        } finally {
            if (showControl) PubSub.default.pub("clearSelectionControl");
            PubSub.default.pub("clearStatusBarTip");
            this.document.visual.eventHandler = oldHandler;
            PubSub.default.pub("viewCursor", "default");
        }
    }
    dispose() {
        this._selectedNodes.length = 0;
        this._unselectedNodes.length = 0;
    }
    getSelectedNodes() {
        return this._selectedNodes;
    }
    setSelection(nodes, toggle) {
        nodes = nodes.filter(this.shapeNodeFilter);
        if (toggle) {
            this.toggleSelectPublish(nodes, true);
        } else {
            this.removeSelectedPublish(this._selectedNodes, false);
            this.addSelectPublish(nodes, true);
        }
        return this._selectedNodes.length;
    }
    shapeNodeFilter = (x) => {
        if (x instanceof VisualNode) {
            const layerId = x.layerId;
            const layer = this.document.layers.find((l) => l.id === layerId);
            if (layer?.locked) return false;
        }
        if (x instanceof ShapeNode) {
            let shape = x.shape.value;
            if (!shape || !this.shapeFilter) return true;
            return this.shapeFilter.allow(shape);
        }
        if (this.nodeFilter) {
            return this.nodeFilter.allow(x);
        }
        return true;
    };
    deselect(nodes) {
        this.removeSelectedPublish(nodes, true);
    }
    clearSelection() {
        this.removeSelectedPublish(this._selectedNodes, true);
    }
    updateSelection() {
        this.document.visual.update();
        PubSub.default.pub("selectionChanged", this.document, this._selectedNodes, this._unselectedNodes);
    }
    toggleSelectPublish(nodes, publish) {
        const selected = nodes.filter((m) => this._selectedNodes.includes(m));
        const unSelected = nodes.filter((m) => !this._selectedNodes.includes(m));
        this.removeSelectedPublish(selected, false);
        this.addSelectPublish(unSelected, publish);
    }
    addSelectPublish(nodes, publish) {
        nodes.forEach((m) => {
            if (m instanceof VisualNode) {
                const visual = this.document.visual.context.getVisual(m);
                if (visual)
                    this.document.visual.highlighter.addState(
                        visual,
                        VisualState.edgeSelected,
                        ShapeType.Shape,
                    );
            }
        });
        this._selectedNodes.push(...nodes);
        if (publish) this.updateSelection();
    }
    removeSelectedPublish(nodes, publish) {
        for (const node of nodes) {
            if (node instanceof VisualNode) {
                let visual = this.document.visual.context.getVisual(node);
                if (visual)
                    this.document.visual.highlighter.removeState(
                        visual,
                        VisualState.edgeSelected,
                        ShapeType.Shape,
                    );
            }
        }
        this._selectedNodes = this._selectedNodes.filter((m) => !nodes.includes(m));
        this._unselectedNodes = nodes;
        if (publish) this.updateSelection();
    }
}
