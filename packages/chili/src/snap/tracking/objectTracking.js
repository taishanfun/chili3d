// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { VisualConfig } from "chili-core";
import { ViewUtils } from "chili-vis";
import { Axis } from "./axis";
import { TrackingBase } from "./trackingBase";
export class ObjectTracking extends TrackingBase {
    timer;
    snapping;
    trackings = new Map();
    constructor(trackingZ) {
        super(trackingZ);
    }
    clear() {
        this.clearTimer();
        super.clear();
        this.trackings.clear();
    }
    getTrackingRays(view) {
        const result = [];
        this.trackings.get(view.document)?.map((x) => {
            let plane = ViewUtils.ensurePlane(view, view.workplane);
            let axes = Axis.getAxiesAtPlane(x.snap.point, plane, this.trackingZ);
            result.push({ axes, objectName: x.snap.info });
        });
        return result;
    }
    showTrackingAtTimeout(document, snap) {
        if (snap !== undefined && this.snapping === snap) return;
        this.snapping = snap;
        this.clearTimer();
        if (!snap) return;
        this.timer = window.setTimeout(() => this.switchTrackingPoint(document, snap), 600);
    }
    clearTimer() {
        if (this.timer !== undefined) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }
    switchTrackingPoint(document, snap) {
        if (this.isCleared || snap.shapes.length === 0) return;
        if (!this.trackings.has(document)) {
            this.trackings.set(document, []);
        }
        const currentTrackings = this.trackings.get(document);
        const existingTracking = currentTrackings.find((x) => x.snap.point.isEqualTo(snap.point));
        existingTracking
            ? this.removeTrackingPoint(document, existingTracking, currentTrackings)
            : this.addTrackingPoint(snap, document, currentTrackings);
        document.visual.update();
    }
    removeTrackingPoint(document, s, snaps) {
        document.visual.context.removeMesh(s.shapeId);
        this.trackings.set(
            document,
            snaps.filter((x) => x !== s),
        );
    }
    addTrackingPoint(snap, document, snaps) {
        const pointId = this.displayPoint(
            document,
            snap,
            VisualConfig.trackingVertexSize,
            VisualConfig.trackingVertexColor,
        );
        snaps.push({ shapeId: pointId, snap });
    }
}
