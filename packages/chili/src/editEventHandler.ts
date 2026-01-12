// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { IDocument, INode, IView, Matrix4, PubSub, Transaction, VisualNode, XYZ } from "chili-core";
import { NodeSelectionHandler } from "chili-vis";

export class EditEventHandler extends NodeSelectionHandler {
    private dragState:
        | {
              pointerId: number;
              startOffsetX: number;
              startOffsetY: number;
              startPoint: XYZ;
              lastPoint: XYZ;
              historyDisabledBefore: boolean;
              viewHandlerEnabledBefore: boolean;
              isActive: boolean;
              originalTransforms: Map<VisualNode, Matrix4>;
          }
        | undefined;

    constructor(
        document: IDocument,
        readonly selectedNodes: INode[],
    ) {
        super(document, true);
        PubSub.default.pub("showProperties", document, selectedNodes);
    }

    override pointerDown(view: IView, event: PointerEvent): void {
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
            (event.currentTarget as HTMLElement | undefined)?.setPointerCapture?.(event.pointerId);
        }

        super.pointerDown(view, event);
    }

    override pointerMove(view: IView, event: PointerEvent): void {
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

    override pointerUp(view: IView, event: PointerEvent): void {
        if (this.dragState?.pointerId === event.pointerId) {
            (event.currentTarget as HTMLElement | undefined)?.releasePointerCapture?.(event.pointerId);
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

    override pointerOut(view: IView, event: PointerEvent): void {
        if (this.dragState?.pointerId === event.pointerId && this.dragState.isActive) {
            this.cancelDrag();
            this.pointerEventMap.delete(event.pointerId);
            view.update();
            return;
        }
        super.pointerOut?.(view, event);
    }

    override keyDown(view: IView, event: KeyboardEvent): void {
        if (event.key === "Escape" && this.dragState?.isActive) {
            this.cancelDrag();
            view.update();
            return;
        }
        super.keyDown(view, event);
    }

    private startDrag() {
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

    private updateDrag(view: IView, event: PointerEvent) {
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

    private commitDrag() {
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

    private cancelDrag() {
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

    private getDragPoint(view: IView, event: PointerEvent): XYZ {
        const ray = view.rayAt(event.offsetX, event.offsetY);
        const pointOnPlane = view.workplane.intersect(ray);
        if (pointOnPlane) return pointOnPlane;
        return view.screenToWorld(event.offsetX, event.offsetY);
    }

    private isHitSelectedVisualNode(view: IView, event: PointerEvent): boolean {
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

    override disposeInternal() {
        PubSub.default.pub("showProperties", this.document, []);
        super.disposeInternal();
    }
}
