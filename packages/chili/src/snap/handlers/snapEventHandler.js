// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import {
    Config,
    IView,
    MessageType,
    PubSub,
    Result,
    ShapeType,
    VertexMeshData,
    VisualConfig,
} from "chili-core";
var SnapState;
(function (SnapState) {
    SnapState[(SnapState["Idle"] = 0)] = "Idle";
    SnapState[(SnapState["Snapping"] = 1)] = "Snapping";
    SnapState[(SnapState["Inputing"] = 2)] = "Inputing";
    SnapState[(SnapState["Cancelled"] = 3)] = "Cancelled";
    SnapState[(SnapState["Completed"] = 4)] = "Completed";
})(SnapState || (SnapState = {}));
export class SnapEventHandler {
    document;
    controller;
    snaps;
    data;
    _tempPoint;
    _tempShapes;
    showTempPoint = true;
    _snaped;
    _state = SnapState.Idle;
    facePreviewOpacity = 1;
    isEnabled = true;
    constructor(document, controller, snaps, data) {
        this.document = document;
        this.controller = controller;
        this.snaps = snaps;
        this.data = data;
        this.showTempShape(undefined);
        controller.onCancelled(() => this.handleCancel());
        controller.onCompleted(() => this.handleSuccess());
    }
    get snaped() {
        return this._snaped;
    }
    get state() {
        return this._state;
    }
    dispose() {
        this._snaped = undefined;
        this._state = SnapState.Completed;
    }
    handleSuccess() {
        if (this._state === SnapState.Completed) return;
        this._state = SnapState.Completed;
        this.controller.success();
        this.cleanupResources();
    }
    handleCancel() {
        if (this._state === SnapState.Cancelled) return;
        this._state = SnapState.Cancelled;
        this.controller.cancel();
        this.cleanupResources();
    }
    cleanupResources() {
        this.clearSnapPrompt();
        this.clearInput();
        this.removeTempVisuals();
        this.snaps.forEach((snap) => snap.clear());
    }
    clearInput() {
        PubSub.default.pub("clearInput");
    }
    pointerMove(view, event) {
        this._state = SnapState.Snapping;
        this.removeTempVisuals();
        this.updateSnapPoint(view, event);
        this.updateVisualFeedback(view);
    }
    updateSnapPoint(view, event) {
        this.setSnaped(view, event);
        if (this._snaped) {
            this.showSnapPrompt(this._snaped);
        } else {
            this.clearSnapPrompt();
        }
    }
    updateVisualFeedback(view) {
        this.showTempShape(this._snaped?.point);
        view.document.visual.update();
    }
    setSnaped(view, event) {
        this.findSnapPoint(ShapeType.Edge, view, event);
        if (view.document.mode === "2d" && this._snaped?.point) {
            this._snaped.point = view.workplane.project(this._snaped.point);
        }
        this.snaps.forEach((snap) => snap.handleSnaped?.(view.document.visual.document, this._snaped));
    }
    findNearestFeaturePoint(view, event) {
        let minDist = Number.MAX_VALUE;
        let nearest;
        for (const point of this.data.featurePoints || []) {
            if (point.when && !point.when()) continue;
            const dist = IView.screenDistance(view, event.offsetX, event.offsetY, point.point);
            if (dist < minDist) {
                minDist = dist;
                nearest = point;
            }
        }
        return minDist < Config.instance.SnapDistance ? nearest : undefined;
    }
    findSnapPoint(shapeType, view, event) {
        const featurePoint = this.findNearestFeaturePoint(view, event);
        if (featurePoint) {
            this._snaped = {
                view,
                point: featurePoint.point,
                info: featurePoint.prompt,
                shapes: [],
            };
        } else {
            const detected = this.detectShapes(shapeType, view, event);
            for (const snap of this.snaps) {
                const snaped = snap.snap(detected);
                if (snaped && this.validateSnapPoint(snaped)) {
                    this._snaped = snaped;
                    return;
                }
            }
        }
    }
    validateSnapPoint(snaped) {
        return !this.data.validator || this.data.validator(snaped.point);
    }
    detectShapes(shapeType, view, event) {
        const shapes = view.detectShapes(shapeType, event.offsetX, event.offsetY, this.data.filter);
        return { shapes, view, mx: event.offsetX, my: event.offsetY };
    }
    clearSnapPrompt() {
        PubSub.default.pub("clearFloatTip");
    }
    showSnapPrompt(snaped) {
        const prompt = this.formatSnapPrompt(snaped);
        if (!prompt) {
            this.clearSnapPrompt();
            return;
        }
        PubSub.default.pub("showFloatTip", prompt);
    }
    formatSnapPrompt(snaped) {
        let prompt = this.data.prompt?.(snaped);
        if (!prompt) {
            let distance = snaped.distance ?? snaped.refPoint?.distanceTo(snaped.point);
            if (distance) {
                prompt = this.formatSnapDistance(distance);
            }
        }
        if (!prompt && !snaped.info) {
            return undefined;
        }
        return {
            level: MessageType.info,
            msg: [snaped.info, prompt].filter((x) => x !== undefined).join(" -> "),
        };
    }
    formatSnapDistance(num) {
        return num.toFixed(2);
    }
    removeTempVisuals() {
        this.removeTempShapes();
        this.snaps.forEach((snap) => snap.removeDynamicObject());
    }
    showTempShape(point) {
        if (point && this.showTempPoint) {
            const data = VertexMeshData.from(
                point,
                VisualConfig.temporaryVertexSize,
                VisualConfig.temporaryVertexColor,
            );
            this._tempPoint = this.document.visual.context.displayMesh([data]);
        }
        this._tempShapes = this.data
            .preview?.(point)
            ?.map((shape) => this.document.visual.context.displayMesh([shape], this.facePreviewOpacity));
    }
    removeTempShapes() {
        if (this._tempPoint) {
            this.document.visual.context.removeMesh(this._tempPoint);
            this._tempPoint = undefined;
        }
        this._tempShapes?.forEach((id) => {
            this.document.visual.context.removeMesh(id);
        });
        this.document.visual.update();
        this._tempShapes = undefined;
    }
    pointerDown(view, event) {
        if (event.pointerType === "mouse" && event.button === 0) {
            if (this._snaped) {
                this.handleSuccess();
            } else {
                PubSub.default.pub("showToast", "toast.snap.notFoundValidPoint");
            }
        }
    }
    pointerUp(view, event) {
        if (event.pointerType !== "mouse" && event.isPrimary && this._snaped) {
            this.handleSuccess();
        }
    }
    pointerOut(view, event) {
        this._snaped = undefined;
    }
    mouseWheel(view, event) {
        view.update();
    }
    keyDown(view, event) {
        switch (event.key) {
            case "Escape":
                this._snaped = undefined;
                this.handleCancel();
                break;
            case "Enter":
                this._snaped = undefined;
                this.handleSuccess();
                break;
            default:
                this.handleNumericInput(view, event);
        }
    }
    handleNumericInput(view, event) {
        if (!["#", "-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(event.key)) return;
        this._state = SnapState.Inputing;
        PubSub.default.pub("showInput", event.key, (text) => {
            const error = this.inputError(text);
            if (error) return Result.err(error);
            this._snaped = this.getPointFromInput(view, text);
            this.handleSuccess();
            return Result.ok(text);
        });
    }
}
