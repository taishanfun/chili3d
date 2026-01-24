// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { XYZ } from "chili-core";
import { Matrix4, Vector3 } from "three";
const MOUSE_LEFT = 1;
const options = {
    size: 200,
    padding: 16,
    bubbleSizePrimary: 18,
    bubbleSizeSeconday: 10,
    showSecondary: true,
    lineWidth: 2,
    fontSize: "24px",
    fontFamily: "arial",
    fontColor: "#151515",
    fontYAdjust: 0,
    colors: {
        x: ["#f73c3c", "#942424"],
        y: ["#6ccb26", "#417a17"],
        z: ["#178cf0", "#0e5490"],
    },
};
export class ViewGizmo extends HTMLElement {
    view;
    _axes;
    _center;
    _canvas;
    _context;
    cameraController;
    _canClick = true;
    _selectedAxis;
    _mouse;
    constructor(view) {
        super();
        this.view = view;
        this.cameraController = view.cameraController;
        this._axes = this._initAxes();
        this._center = new Vector3(options.size * 0.5, options.size * 0.5, 0);
        this._canvas = this._initCanvas();
        this._context = this._canvas.getContext("2d");
        this._initStyle();
    }
    setDom(dom) {
        this.remove();
        dom.appendChild(this);
    }
    dispose() {
        this.remove();
    }
    _initStyle() {
        this.style.zIndex = "999";
        this.style.position = "absolute";
        this.style.top = "20px";
        this.style.right = "20px";
        this.style.borderRadius = "100%";
        this.style.cursor = "pointer";
        this.style.userSelect = "none";
        this.style.webkitUserSelect = "none";
    }
    _initCanvas() {
        let canvas = document.createElement("canvas");
        canvas.width = options.size;
        canvas.height = options.size;
        canvas.style.width = `${options.size * 0.5}px`;
        canvas.style.height = `${options.size * 0.5}px`;
        this.append(canvas);
        return canvas;
    }
    _initAxes() {
        return [
            {
                axis: "x",
                direction: new Vector3(1, 0, 0),
                position: new Vector3(),
                size: options.bubbleSizePrimary,
                color: options.colors.x,
                lineWidth: options.lineWidth,
                label: "X",
            },
            {
                axis: "y",
                direction: new Vector3(0, 1, 0),
                position: new Vector3(),
                size: options.bubbleSizePrimary,
                color: options.colors.y,
                lineWidth: options.lineWidth,
                label: "Y",
            },
            {
                axis: "z",
                direction: new Vector3(0, 0, 1),
                position: new Vector3(),
                size: options.bubbleSizePrimary,
                color: options.colors.z,
                lineWidth: options.lineWidth,
                label: "Z",
            },
            {
                axis: "-x",
                direction: new Vector3(-1, 0, 0),
                position: new Vector3(),
                size: options.bubbleSizeSeconday,
                color: options.colors.x,
            },
            {
                axis: "-y",
                direction: new Vector3(0, -1, 0),
                position: new Vector3(),
                size: options.bubbleSizeSeconday,
                color: options.colors.y,
            },
            {
                axis: "-z",
                direction: new Vector3(0, 0, -1),
                position: new Vector3(),
                size: options.bubbleSizeSeconday,
                color: options.colors.z,
            },
        ];
    }
    connectedCallback() {
        this._canvas.addEventListener("pointermove", this._onPointerMove);
        this._canvas.addEventListener("pointerenter", this._onPointerEnter);
        this._canvas.addEventListener("pointerout", this._onPointerOut);
        this._canvas.addEventListener("click", this._onClick);
        this._canvas.addEventListener("pointerdown", this._onPointerDown);
        this._canvas.addEventListener("pointerup", this._onPointerUp);
    }
    disconnectedCallback() {
        this._canvas.removeEventListener("pointermove", this._onPointerMove);
        this._canvas.removeEventListener("pointerenter", this._onPointerEnter);
        this._canvas.removeEventListener("pointerout", this._onPointerOut);
        this._canvas.removeEventListener("click", this._onClick);
        this._canvas.removeEventListener("pointerdown", this._onPointerDown);
        this._canvas.removeEventListener("pointerup", this._onPointerUp);
    }
    _onPointerMove = (e) => {
        e.stopPropagation();
        if (
            this.view.document.mode !== "2d" &&
            e.buttons === MOUSE_LEFT &&
            !(e.movementX === 0 && e.movementY === 0)
        ) {
            this.cameraController.rotate(e.movementX * 4, e.movementY * 4);
            this._canClick = false;
        }
        const rect = this._canvas.getBoundingClientRect();
        this._mouse = new Vector3(e.clientX - rect.left, e.clientY - rect.top, 0).multiplyScalar(2);
        this.view.update();
    };
    _onPointerDown = (e) => {
        e.stopPropagation();
        this._canvas.setPointerCapture(e.pointerId);
    };
    _onPointerUp = (e) => {
        e.stopPropagation();
        this._canvas.releasePointerCapture(e.pointerId);
    };
    _onPointerOut = (e) => {
        e.stopPropagation();
        this._mouse = undefined;
        this.style.backgroundColor = "transparent";
    };
    _onPointerEnter = (e) => {
        e.stopPropagation();
        this.style.backgroundColor = "rgba(66, 66, 66, .9)";
    };
    _onClick = (e) => {
        e.stopPropagation();
        if (this.view.document.mode === "2d") {
            return;
        }
        if (!this._canClick) {
            this._canClick = true;
            return;
        }
        if (this._selectedAxis) {
            const distance = this.cameraController.camera.position.distanceTo(this.cameraController.target);
            const position = this._selectedAxis.direction
                .clone()
                .multiplyScalar(distance)
                .add(this.cameraController.target);
            this.cameraController.camera.position.copy(position);
            let up = new XYZ(0, 0, 1);
            if (this._selectedAxis.axis === "z") up = new XYZ(0, 1, 0);
            else if (this._selectedAxis.axis === "-z") up = new XYZ(0, -1, 0);
            this.cameraController.lookAt(
                this.cameraController.camera.position,
                this.cameraController.target,
                up,
            );
            this.view.update();
        }
    };
    clear() {
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
    update() {
        this.clear();
        const invRotMat = new Matrix4()
            .makeRotationFromEuler(this.cameraController.camera.rotation)
            .invert();
        this._axes.forEach(
            (axis) =>
                (axis.position = this.getBubblePosition(axis.direction.clone().applyMatrix4(invRotMat))),
        );
        this._axes.sort((a, b) => a.position.z - b.position.z);
        this.setSelectedAxis(this._axes);
        this.drawAxes(this._axes);
    }
    setSelectedAxis(axes) {
        this._selectedAxis = undefined;
        if (this._mouse && this._canClick) {
            let closestDist = Infinity;
            for (let axis of axes) {
                const distance = this._mouse.distanceTo(axis.position);
                if (distance < closestDist && distance < axis.size) {
                    closestDist = distance;
                    this._selectedAxis = axis;
                }
            }
        }
    }
    drawAxes(axes) {
        for (let axis of axes) {
            const color = this.getAxisColor(axis);
            this.drawCircle(axis.position, axis.size, color);
            this.drawLine(this._center, axis.position, color, axis.lineWidth);
            this.drawLabel(axis);
        }
    }
    getAxisColor(axis) {
        let color;
        if (this._selectedAxis === axis) {
            color = "#FFFFFF";
        } else if (axis.position.z >= -0.01) {
            color = axis.color[0];
        } else {
            color = axis.color[1];
        }
        return color;
    }
    drawCircle(p, radius = 10, color = "#FF0000") {
        this._context.beginPath();
        this._context.arc(p.x, p.y, radius, 0, 2 * Math.PI, false);
        this._context.fillStyle = color;
        this._context.fill();
        this._context.closePath();
    }
    drawLine(p1, p2, color, width) {
        if (width) {
            this._context.beginPath();
            this._context.moveTo(p1.x, p1.y);
            this._context.lineTo(p2.x, p2.y);
            this._context.lineWidth = width;
            this._context.strokeStyle = color;
            this._context.stroke();
            this._context.closePath();
        }
    }
    drawLabel(axis) {
        if (axis.label) {
            this._context.font = [options.fontSize, options.fontFamily].join(" ");
            this._context.fillStyle = options.fontColor;
            this._context.textBaseline = "middle";
            this._context.textAlign = "center";
            this._context.fillText(axis.label, axis.position.x, axis.position.y + options.fontYAdjust);
        }
    }
    getBubblePosition(vector) {
        return new Vector3(
            vector.x * (this._center.x - options.bubbleSizePrimary / 2 - options.padding) + this._center.x,
            this._center.y - vector.y * (this._center.y - options.bubbleSizePrimary / 2 - options.padding),
            vector.z,
        );
    }
}
customElements.define("view-gizmo", ViewGizmo);
