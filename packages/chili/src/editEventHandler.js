// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { INode, Matrix4, PubSub, Transaction, VisualNode } from "chili-core";
import { NodeSelectionHandler } from "chili-vis";
export class EditEventHandler extends NodeSelectionHandler {
    selectedNodes;
    dragState;
    constructor(document, selectedNodes) {
        super(document, true);
        this.selectedNodes = selectedNodes;
        PubSub.default.pub("showProperties", document, selectedNodes);
    }
    pointerDown(view, event) {
        const canDrag =
            event.button === 0 &&
            event.isPrimary &&
            !event.shiftKey &&
            this.isHitSelectedVisualNode(view, event);
        if (canDrag) {
            this.showRect = false;
            const point = this.getDragPoint(view, event);
            this.dragState = {
                pointerId: event.pointerId,
                startOffsetX: event.offsetX,
                startOffsetY: event.offsetY,
                startPoint: point,
                lastPoint: point,
                historyDisabledBefore: this.document.history.disabled,
                viewHandlerEnabledBefore: this.document.visual.viewHandler.isEnabled,
                isActive: false,
                originalTransforms: new Map(),
            };
            event.currentTarget?.setPointerCapture?.(event.pointerId);
        }
        super.pointerDown(view, event);
    }
    pointerMove(view, event) {
        if (this.dragState?.pointerId === event.pointerId) {
            const dx = Math.abs(event.offsetX - this.dragState.startOffsetX);
            const dy = Math.abs(event.offsetY - this.dragState.startOffsetY);
            if (!this.dragState.isActive) {
                if (dx < 3 && dy < 3) return;
                this.startDrag();
            }
            this.updateDrag(view, event);
            return;
        }
        super.pointerMove(view, event);
    }
    pointerUp(view, event) {
        if (this.dragState?.pointerId === event.pointerId) {
            event.currentTarget?.releasePointerCapture?.(event.pointerId);
            if (this.dragState.isActive) {
                this.commitDrag();
                this.pointerEventMap.delete(event.pointerId);
                view.update();
                return;
            }
            this.dragState = undefined;
            this.showRect = true;
        }
        super.pointerUp(view, event);
    }
    pointerOut(view, event) {
        if (this.dragState?.pointerId === event.pointerId && this.dragState.isActive) {
            this.cancelDrag();
            this.pointerEventMap.delete(event.pointerId);
            view.update();
            return;
        }
        super.pointerOut?.(view, event);
    }
    keyDown(view, event) {
        if (event.key === "Escape" && this.dragState?.isActive) {
            this.cancelDrag();
            view.update();
            return;
        }
        super.keyDown(view, event);
    }
    startDrag() {
        if (!this.dragState || this.dragState.isActive) return;
        this.dragState.isActive = true;
        const selected = this.document.selection.getSelectedNodes().filter((x) => x instanceof VisualNode);
        const topLevel = INode.findTopLevelNodes(new Set(selected)).filter((x) => x instanceof VisualNode);
        for (const node of topLevel) {
            this.dragState.originalTransforms.set(node, node.transform);
        }
        this.document.history.disabled = true;
        this.document.visual.viewHandler.isEnabled = false;
    }
    updateDrag(view, event) {
        if (!this.dragState) return;
        const point = this.getDragPoint(view, event);
        this.dragState.lastPoint = point;
        const delta = point.sub(this.dragState.startPoint);
        const transform = Matrix4.fromTranslation(delta.x, delta.y, delta.z);
        for (const [node, original] of this.dragState.originalTransforms.entries()) {
            node.transform = original.multiply(transform);
        }
        this.document.visual.update();
    }
    commitDrag() {
        const state = this.dragState;
        if (!state) return;
        const delta = state.lastPoint.sub(state.startPoint);
        const transform = Matrix4.fromTranslation(delta.x, delta.y, delta.z);
        this.document.history.disabled = true;
        for (const [node, original] of state.originalTransforms.entries()) {
            node.transform = original;
        }
        this.document.history.disabled = state.historyDisabledBefore;
        Transaction.execute(this.document, "drag move", () => {
            for (const [node, original] of state.originalTransforms.entries()) {
                node.transform = original.multiply(transform);
            }
        });
        this.document.visual.viewHandler.isEnabled = state.viewHandlerEnabledBefore;
        this.showRect = true;
        this.dragState = undefined;
        this.document.visual.update();
    }
    cancelDrag() {
        const state = this.dragState;
        if (!state) return;
        this.document.history.disabled = true;
        for (const [node, original] of state.originalTransforms.entries()) {
            node.transform = original;
        }
        this.document.history.disabled = state.historyDisabledBefore;
        this.document.visual.viewHandler.isEnabled = state.viewHandlerEnabledBefore;
        this.showRect = true;
        this.dragState = undefined;
        this.document.visual.update();
    }
    getDragPoint(view, event) {
        const ray = view.rayAt(event.offsetX, event.offsetY);
        const pointOnPlane = view.workplane.intersect(ray);
        if (pointOnPlane) return pointOnPlane;
        return view.screenToWorld(event.offsetX, event.offsetY);
    }
    isHitSelectedVisualNode(view, event) {
        const detected = view.detectVisual(event.offsetX, event.offsetY);
        if (!detected.length) return false;
        const selected = new Set(this.document.selection.getSelectedNodes());
        for (const visual of detected) {
            const node = view.document.visual.context.getNode(visual);
            if (node && selected.has(node)) {
                return node instanceof VisualNode;
            }
        }
        return false;
    }
    disposeInternal() {
        PubSub.default.pub("showProperties", this.document, []);
        super.disposeInternal();
    }
}
