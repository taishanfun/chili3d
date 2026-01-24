// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Config, Navigation3D } from "chili-core";
const MOUSE_MIDDLE = 4;
export class ThreeViewHandler {
    _lastDown;
    _clearDownId;
    _offsetPoint;
    lastPointerEventMap = new Map();
    currentPointerEventMap = new Map();
    canRotate = true;
    isEnabled = true;
    dispose() {
        this.clearTimeout();
        this.lastPointerEventMap.clear();
        this.currentPointerEventMap.clear();
    }
    mouseWheel(view, event) {
        const currentNav3D = Config.instance.navigation3DIndex;
        if (
            currentNav3D === Navigation3D.Nav3DType.Solidworks ||
            currentNav3D === Navigation3D.Nav3DType.Creo
        ) {
            view.cameraController.zoom(event.offsetX, event.offsetY, -event.deltaY);
        } else {
            view.cameraController.zoom(event.offsetX, event.offsetY, event.deltaY);
        }
        view.update();
    }
    pointerMove(view, event) {
        if (event.pointerType === "mouse") {
            this.handleMouseMove(view, event);
        } else {
            this.handleTouchMove(view, event);
        }
        view.update();
    }
    handleMouseMove(view, event) {
        if (event.buttons !== MOUSE_MIDDLE) {
            return;
        }
        let dx = 0;
        let dy = 0;
        if (this._offsetPoint) {
            dx = event.offsetX - this._offsetPoint.x;
            dy = event.offsetY - this._offsetPoint.y;
            this._offsetPoint = { x: event.offsetX, y: event.offsetY };
        }
        let key = Navigation3D.getKey(event);
        const navigatioMap = Navigation3D.navigationKeyMap();
        if (navigatioMap.pan === key) {
            view.cameraController.pan(dx, dy);
        } else if (navigatioMap.rotate === key && this.canRotate) {
            view.cameraController.rotate(dx, dy);
        }
        if (dx !== 0 && dy !== 0) this._lastDown = undefined;
    }
    handleTouchMove(view, event) {
        if (!this.currentPointerEventMap.has(event.pointerId)) {
            this.currentPointerEventMap.set(event.pointerId, event);
            return;
        }
        if (this.currentPointerEventMap.size === 3 && this.lastPointerEventMap.size === 3) {
            const offset = this.getPrimaryTouchOffset();
            if (offset && this.canRotate) view.cameraController.rotate(offset.dx, offset.dy);
        } else if (this.currentPointerEventMap.size === 2 && this.lastPointerEventMap.size === 2) {
            const last = this.getCenterAndDistance(this.lastPointerEventMap);
            const current = this.getCenterAndDistance(this.currentPointerEventMap);
            const dtCenter = this.distance(current.center.x, current.center.y, last.center.x, last.center.y);
            const dtDistance = current.distance - last.distance;
            if (dtCenter > Math.abs(dtDistance) * 0.5) {
                // 0.5 no meaning, just for scale
                view.cameraController.pan(
                    current.center.x - last.center.x,
                    current.center.y - last.center.y,
                );
            } else {
                view.cameraController.zoom(current.center.x, current.center.y, -dtDistance);
            }
        }
        this.lastPointerEventMap.clear();
        this.lastPointerEventMap = this.currentPointerEventMap;
        this.currentPointerEventMap = new Map();
    }
    getPrimaryTouchOffset() {
        const findPrimary = (pointerEvents) => {
            let primary;
            for (const [, event] of pointerEvents) {
                if (event.isPrimary) {
                    primary = event;
                    break;
                }
            }
            return primary;
        };
        const last = findPrimary(this.lastPointerEventMap);
        const current = findPrimary(this.currentPointerEventMap);
        if (last && current) {
            return {
                dx: current.offsetX - last.offsetX,
                dy: current.offsetY - last.offsetY,
            };
        }
        return undefined;
    }
    getCenterAndDistance(pointerEvents) {
        const values = pointerEvents.values();
        const first = values.next().value;
        const second = values.next().value;
        const center = {
            x: (first.offsetX + second.offsetX) / 2,
            y: (first.offsetY + second.offsetY) / 2,
        };
        const distance = this.distance(first.offsetX, second.offsetX, first.offsetY, second.offsetY);
        return { center, distance };
    }
    distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }
    pointerDown(view, event) {
        this.clearTimeout();
        if (event.pointerType === "mouse") {
            this.handleMouseDown(event, view);
        } else {
            this.lastPointerEventMap.set(event.pointerId, event);
        }
    }
    handleMouseDown(event, view) {
        if (this._lastDown && this._lastDown.time + 500 > Date.now() && event.buttons === MOUSE_MIDDLE) {
            this._lastDown = undefined;
            view.cameraController.fitContent();
            view.update();
        } else if (event.buttons === MOUSE_MIDDLE) {
            if (this.canRotate) {
                view.cameraController.startRotate(event.offsetX, event.offsetY);
            }
            this._lastDown = {
                time: Date.now(),
                key: event.buttons,
            };
            this._offsetPoint = { x: event.offsetX, y: event.offsetY };
        }
    }
    clearTimeout() {
        if (this._clearDownId) {
            clearTimeout(this._clearDownId);
            this._clearDownId = undefined;
        }
    }
    pointerOut(view, event) {
        this._lastDown = undefined;
        this.lastPointerEventMap.delete(event.pointerId);
        this.currentPointerEventMap.delete(event.pointerId);
    }
    pointerUp(view, event) {
        if (event.buttons === MOUSE_MIDDLE && this._lastDown) {
            this._clearDownId = window.setTimeout(() => {
                this._lastDown = undefined;
                this._clearDownId = undefined;
            }, 500);
        }
        this._offsetPoint = undefined;
        this.lastPointerEventMap.delete(event.pointerId);
        this.currentPointerEventMap.delete(event.pointerId);
    }
    keyDown(view, event) {}
}
