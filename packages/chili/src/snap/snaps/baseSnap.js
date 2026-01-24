// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { VisualState } from "chili-core";
export class BaseSnap {
    referencePoint;
    _tempMeshIds = new Map();
    _highlightedShapes = [];
    constructor(referencePoint) {
        this.referencePoint = referencePoint;
    }
    removeDynamicObject() {
        this.clearTempMeshes();
        this.unhighlight();
    }
    clear() {
        this.removeDynamicObject();
    }
    clearTempMeshes() {
        this._tempMeshIds.forEach((ids, view) => {
            ids.forEach((id) => view.document.visual.context.removeMesh(id));
        });
        this._tempMeshIds.clear();
    }
    addTempMesh(view, meshId) {
        let ids = this._tempMeshIds.get(view);
        if (!ids) {
            ids = [];
            this._tempMeshIds.set(view, ids);
        }
        ids.push(meshId);
    }
    highlight(shapes) {
        shapes.forEach((shape) => {
            const highlighter = shape.owner.node.document.visual.highlighter;
            highlighter.addState(
                shape.owner,
                VisualState.edgeHighlight,
                shape.shape.shapeType,
                ...shape.indexes,
            );
        });
        this._highlightedShapes.push(...shapes);
    }
    unhighlight() {
        this._highlightedShapes.forEach((shape) => {
            const highlighter = shape.owner.node.document.visual.highlighter;
            highlighter.removeState(
                shape.owner,
                VisualState.edgeHighlight,
                shape.shape.shapeType,
                ...shape.indexes,
            );
        });
        this._highlightedShapes.length = 0;
    }
    calculateDistance(point) {
        return this.referencePoint ? this.referencePoint().distanceTo(point) : undefined;
    }
}
