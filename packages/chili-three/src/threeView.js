// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { div, span, svg } from "chili-controls";
import {
    MultiShapeNode,
    Observable,
    PubSub,
    Ray,
    ShapeNode,
    ShapeType,
    ViewMode,
    XY,
    debounce,
} from "chili-core";
import {
    DirectionalLight,
    OrthographicCamera,
    PerspectiveCamera,
    Raycaster,
    Vector2,
    Vector3,
    WebGLRenderer,
} from "three";
import { SelectionBox } from "three/examples/jsm/interactive/SelectionBox";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { CameraController } from "./cameraController";
import { Constants } from "./constants";
import { ThreeGeometry } from "./threeGeometry";
import { ThreeHelper } from "./threeHelper";
import style from "./threeView.module.css";
import {
    ThreeComponentObject,
    ThreeDimensionObject,
    ThreeLeaderObject,
    ThreeMeshObject,
    ThreeTextObject,
    ThreeVisualObject,
} from "./threeVisualObject";
import { ViewGizmo } from "./viewGizmo";
export class ThreeView extends Observable {
    document;
    highlighter;
    content;
    _dom;
    _needsUpdate = false;
    _cssPixelsPerWorldUnit = 1;
    _scene;
    _renderer;
    _cssRenderer;
    _workplane;
    _gizmo;
    _resizeObserver;
    cameraController;
    dynamicLight = new DirectionalLight(0xffffff, 2);
    get name() {
        return this.getPrivateValue("name");
    }
    set name(value) {
        this.setProperty("name", value);
    }
    get dom() {
        return this._dom;
    }
    _isClosed = false;
    get isClosed() {
        return this._isClosed;
    }
    get camera() {
        return this.cameraController.camera;
    }
    get mode() {
        return this.getPrivateValue("mode", ViewMode.solidAndWireframe);
    }
    set mode(value) {
        this.setProperty("mode", value, () => {
            this.cameraController.setCameraLayer(this.camera, this.mode);
        });
    }
    constructor(document, name, workplane, highlighter, content) {
        super();
        this.document = document;
        this.highlighter = highlighter;
        this.content = content;
        this.setPrivateValue("name", name);
        this._scene = content.scene;
        this._workplane = workplane;
        let resizerObserverCallback = debounce(this._resizerObserverCallback, 100);
        this._resizeObserver = new ResizeObserver(resizerObserverCallback);
        this.cameraController = new CameraController(this);
        if (this.document.mode === "2d") {
            this.cameraController.cameraType = "orthographic";
            this.alignCameraToWorkplane(workplane);
        }
        this._renderer = this.initRenderer();
        this._cssRenderer = this.initCssRenderer();
        this._scene.add(this.dynamicLight);
        this._gizmo = this.initGizmo();
        this.setPrivateValue("mode", ViewMode.solidAndWireframe);
        this.camera.layers.enableAll();
        this.document.application.views.push(this);
        this.animate();
    }
    disposeInternal() {
        super.disposeInternal();
        this._gizmo.dispose();
        this._resizeObserver.disconnect();
    }
    close() {
        if (this._isClosed) return;
        this._isClosed = true;
        this.document.application.views.remove(this);
        let otherView = this.document.application.views.find((x) => x.document === this.document);
        if (!otherView) {
            this.document.close();
        } else if (this.document.application.activeView === this) {
            this.document.application.activeView = otherView;
        }
        this.dispose();
        PubSub.default.pub("viewClosed", this);
    }
    _resizerObserverCallback = (entries) => {
        for (const entry of entries) {
            if (entry.target === this._dom) {
                this.resize(entry.contentRect.width, entry.contentRect.height);
                return;
            }
        }
    };
    get renderer() {
        return this._renderer;
    }
    initRenderer() {
        let renderer = new WebGLRenderer({
            antialias: false,
            alpha: true,
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        return renderer;
    }
    initCssRenderer() {
        let renderer = new CSS2DRenderer();
        return renderer;
    }
    initGizmo() {
        return new ViewGizmo(this);
    }
    setDom(element) {
        if (this._dom) {
            this._resizeObserver.unobserve(this._dom);
        }
        this._dom = element;
        this._gizmo.setDom(element);
        this._renderer.domElement.remove();
        this._renderer.domElement.style.userSelect = "none";
        this._renderer.domElement.style.webkitUserSelect = "none";
        element.appendChild(this._renderer.domElement);
        this._cssRenderer.domElement.remove();
        this._cssRenderer.domElement.style.position = "absolute";
        this._cssRenderer.domElement.style.top = "0px";
        this._cssRenderer.domElement.style.userSelect = "none";
        this._cssRenderer.domElement.style.webkitUserSelect = "none";
        element.appendChild(this._cssRenderer.domElement);
        this.resize(element.clientWidth, element.clientHeight);
        this._resizeObserver.observe(element);
        this.cameraController.updateCameraPosionTarget();
    }
    htmlText(text, point, options) {
        const dispose = () => {
            options?.onDispose?.();
            this.content.cssObjects.remove(cssObject);
            cssObject.element.remove();
        };
        let cssObject = new CSS2DObject(this.htmlElement(text, dispose, options));
        cssObject.position.set(point.x, point.y, point.z);
        if (options?.center) cssObject.center.set(options.center.x, options.center.y);
        this.content.cssObjects.add(cssObject);
        return { dispose };
    }
    htmlElement(text, dispose, options) {
        const className = options?.className || style.htmlText;
        return div(
            {
                className: options?.hideDelete ? `${className} ${style.noEvent}` : className,
            },
            span({ textContent: text, style: { color: "inherit" } }),
            options?.hideDelete === true
                ? ""
                : svg({
                      className: style.delete,
                      icon: "icon-times",
                      onclick: (e) => {
                          e.stopPropagation();
                          dispose();
                      },
                  }),
        );
    }
    toImage() {
        this._renderer.render(this._scene, this.camera);
        return this.renderer.domElement.toDataURL();
    }
    get workplane() {
        return this._workplane;
    }
    set workplane(value) {
        this.setProperty("workplane", value, () => {
            if (this.document.mode === "2d") {
                this.cameraController.cameraType = "orthographic";
                this.alignCameraToWorkplane(value);
                this.update();
            }
        });
    }
    update() {
        this._needsUpdate = true;
    }
    animate() {
        if (this._isClosed) {
            return;
        }
        requestAnimationFrame(() => {
            this.animate();
        });
        if (!this._needsUpdate) return;
        this.updateCssPixelsPerWorldUnit();
        let dir = this.camera.position.clone().sub(this.cameraController.target);
        this.dynamicLight.position.copy(dir);
        this._renderer.render(this._scene, this.camera);
        this._cssRenderer.render(this._scene, this.camera);
        this._gizmo?.update();
        this._needsUpdate = false;
    }
    updateCssPixelsPerWorldUnit() {
        const heightPx = Math.max(1, this.height);
        let pxPerWorldUnit = 1;
        if (this.camera instanceof PerspectiveCamera) {
            const distance = Math.max(1e-6, this.camera.position.distanceTo(this.cameraController.target));
            const fovRad = (this.camera.fov * Math.PI) / 180;
            const viewHeightWorldAtTarget = 2 * Math.tan(fovRad / 2) * distance;
            pxPerWorldUnit = heightPx / Math.max(1e-6, viewHeightWorldAtTarget);
        } else if (this.camera instanceof OrthographicCamera) {
            const frustumHeightWorld = this.camera.top - this.camera.bottom;
            pxPerWorldUnit = heightPx / Math.max(1e-6, frustumHeightWorld);
        }
        pxPerWorldUnit = Math.max(1e-4, Math.min(1e4, pxPerWorldUnit));
        if (Math.abs(pxPerWorldUnit - this._cssPixelsPerWorldUnit) < 1e-9) return;
        this._cssPixelsPerWorldUnit = pxPerWorldUnit;
        this._cssRenderer.domElement.style.setProperty("--c3d-px-per-world-unit", String(pxPerWorldUnit));
    }
    resize(width, height) {
        if (height < 0.00001) {
            return;
        }
        if (this.camera instanceof PerspectiveCamera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        } else if (this.camera instanceof OrthographicCamera) {
            this.camera.updateProjectionMatrix();
        }
        this._renderer.setSize(width, height);
        this._cssRenderer.setSize(width, height);
        this.cameraController.setSize(width, height);
        this.updateCssPixelsPerWorldUnit();
        this.update();
    }
    get width() {
        return this._dom?.clientWidth ?? 1;
    }
    get height() {
        return this._dom?.clientHeight ?? 1;
    }
    screenToCameraRect(mx, my) {
        return new Vector2((mx / this.width) * 2 - 1, -(my / this.height) * 2 + 1);
    }
    rayAt(mx, my) {
        const { x, y } = this.screenToCameraRect(mx, my);
        const origin = new Vector3();
        const direction = new Vector3(x, y, 0.5);
        if (this.camera instanceof PerspectiveCamera) {
            origin.setFromMatrixPosition(this.camera.matrixWorld);
            direction.unproject(this.camera).sub(origin).normalize();
        } else if (this.camera instanceof OrthographicCamera) {
            const z = (this.camera.near + this.camera.far) / (this.camera.near - this.camera.far);
            origin.set(x, y, z).unproject(this.camera);
            direction.set(0, 0, -1).transformDirection(this.camera.matrixWorld);
        } else {
            console.error("Unsupported camera type: " + this.camera);
        }
        return new Ray(ThreeHelper.toXYZ(origin), ThreeHelper.toXYZ(direction));
    }
    screenToWorld(mx, my) {
        if (this.document.mode === "2d") {
            const ray = this.rayAt(mx, my);
            const point = this.workplane.intersect(ray);
            if (point) return point;
        }
        return ThreeHelper.toXYZ(this.mouseToWorld(mx, my));
    }
    worldToScreen(point) {
        let cx = this.width / 2;
        let cy = this.height / 2;
        let vec = new Vector3(point.x, point.y, point.z).project(this.camera);
        return new XY(Math.round(cx * vec.x + cx), Math.round(-cy * vec.y + cy));
    }
    direction() {
        const vec = new Vector3();
        this.camera.getWorldDirection(vec);
        return ThreeHelper.toXYZ(vec);
    }
    up() {
        return ThreeHelper.toXYZ(this.camera.up);
    }
    mouseToWorld(mx, my, z = 0.5) {
        let { x, y } = this.screenToCameraRect(mx, my);
        return new Vector3(x, y, z).unproject(this.camera);
    }
    alignCameraToWorkplane(plane) {
        const distance = 1500;
        this.cameraController.lookAt(
            plane.origin.add(plane.normal.multiply(distance)),
            plane.origin,
            plane.yvec,
        );
    }
    detectVisual(x, y, nodeFilter) {
        let visual = [];
        let detecteds = this.findIntersectedNodes(x, y);
        for (const detected of detecteds) {
            let threeObject = detected.object.parent;
            if (!threeObject) continue;
            let node = this.getNodeFromObject(threeObject);
            if (node === undefined) continue;
            if (nodeFilter !== undefined && !nodeFilter.allow(node)) {
                continue;
            }
            visual.push(threeObject);
        }
        return visual;
    }
    detectVisualRect(mx1, my1, mx2, my2, nodeFilter) {
        const selectionBox = this.initSelectionBox(mx1, my1, mx2, my2);
        let visual = new Set();
        for (const obj of selectionBox.select()) {
            let threeObject = obj.parent;
            if (!threeObject?.visible) continue;
            let node = this.getNodeFromObject(threeObject);
            if (node === undefined) continue;
            if (nodeFilter !== undefined && !nodeFilter.allow(node)) {
                continue;
            }
            visual.add(threeObject);
        }
        return Array.from(visual);
    }
    getNodeFromObject(threeObject) {
        let node;
        if (threeObject instanceof ThreeMeshObject) {
            node = threeObject.meshNode;
        } else if (threeObject instanceof ThreeGeometry) {
            node = threeObject.geometryNode;
        } else if (threeObject instanceof ThreeComponentObject) {
            node = threeObject.componentNode;
        } else if (threeObject instanceof ThreeTextObject) {
            node = threeObject.textNode;
        } else if (threeObject instanceof ThreeLeaderObject) {
            node = threeObject.leaderNode;
        } else if (threeObject instanceof ThreeDimensionObject) {
            node = threeObject.dimensionNode;
        }
        return node;
    }
    initSelectionBox(mx1, my1, mx2, my2) {
        const selectionBox = new SelectionBox(this.camera, this._scene);
        const start = this.screenToCameraRect(mx1, my1);
        const end = this.screenToCameraRect(mx2, my2);
        selectionBox.startPoint.set(start.x, start.y, 0.5);
        selectionBox.endPoint.set(end.x, end.y, 0.5);
        return selectionBox;
    }
    detectShapesRect(shapeType, mx1, my1, mx2, my2, shapeFilter, nodeFilter) {
        const selectionBox = this.initSelectionBox(mx1, my1, mx2, my2);
        let detecteds = [];
        let containsCache = new Set();
        for (const obj of selectionBox.select()) {
            this.addDetectedShape(detecteds, containsCache, shapeType, obj, shapeFilter, nodeFilter);
        }
        return detecteds;
    }
    addDetectedShape(detecteds, cache, shapeType, obj, shapeFilter, nodeFilter) {
        const node = this.getParentNode(obj);
        const shape = node?.shape.unchecked();
        if (shape === undefined || cache.has(shape)) return;
        const addShape = (indexes) => {
            detecteds.push({
                shape,
                transform: ThreeHelper.toMatrix(obj.parent.matrixWorld),
                owner: obj.parent,
                indexes,
            });
            cache.add(shape);
        };
        if (shapeType === ShapeType.Shape) {
            addShape([]);
            return;
        }
        if ((shape.shapeType & shapeType) === 0) return;
        if ((shapeFilter && !shapeFilter.allow(shape)) || (nodeFilter && !nodeFilter.allow(node))) return;
        let groups = obj instanceof LineSegments2 ? shape.mesh.edges?.range : shape.mesh.faces?.range;
        addShape([...Array(groups?.length).keys()]);
    }
    getParentNode(obj) {
        if (!obj.parent?.visible || !(obj.parent instanceof ThreeGeometry)) return undefined;
        return obj.parent.geometryNode;
    }
    detectShapes(shapeType, mx, my, shapeFilter, nodeFilter) {
        let intersections = this.findIntersectedShapes(shapeType, mx, my);
        return ShapeType.isWhole(shapeType)
            ? this.detectThreeShapes(intersections, shapeFilter, nodeFilter)
            : this.detectSubShapes(shapeType, intersections, shapeFilter, nodeFilter);
    }
    detectThreeShapes(intersections, shapeFilter, nodeFilter) {
        for (const element of intersections) {
            const parent = element.object.parent;
            if (!(parent instanceof ThreeGeometry)) continue;
            let shape;
            if (parent.geometryNode instanceof ShapeNode) {
                shape = parent.geometryNode.shape.unchecked();
            } else if (parent.geometryNode instanceof MultiShapeNode) {
                shape = this.findShapeAndIndex(parent, element).shape;
            }
            if (
                !shape ||
                (shapeFilter && !shapeFilter.allow(shape)) ||
                (nodeFilter && !nodeFilter.allow(parent.geometryNode))
            ) {
                continue;
            }
            return [
                {
                    owner: parent,
                    shape,
                    transform: parent.worldTransform(),
                    point: ThreeHelper.toXYZ(element.pointOnLine ?? element.point),
                    indexes: [],
                },
            ];
        }
        return [];
    }
    detectSubShapes(shapeType, intersections, shapeFilter, nodeFilter) {
        let result = [];
        for (const intersected of intersections) {
            const visualShape = intersected.object.parent;
            if (visualShape instanceof ThreeVisualObject) {
                let { shape, indexes, transform } = this.getSubShapeFromInsection(
                    shapeType,
                    visualShape,
                    intersected,
                );
                if (
                    !shape ||
                    (shapeFilter && !shapeFilter.allow(shape)) ||
                    (nodeFilter && !nodeFilter.allow(visualShape.node))
                ) {
                    continue;
                }
                const nodeWorldTransform = visualShape.worldTransform();
                result.push({
                    owner: visualShape,
                    shape,
                    transform: transform ? nodeWorldTransform.multiply(transform) : nodeWorldTransform,
                    point: ThreeHelper.toXYZ(intersected.pointOnLine ?? intersected.point),
                    indexes,
                });
            }
        }
        return result;
    }
    getSubShapeFromInsection(shapeType, parent, intersection) {
        let { shape, subShape, index, groups, transform } = this.findShapeAndIndex(parent, intersection);
        if (!subShape || !shape) return { shape: undefined, indexes: [] };
        if (ShapeType.hasSolid(shapeType) && subShape.shapeType === ShapeType.Face) {
            let solid = this.getAncestorAndIndex(ShapeType.Solid, subShape, shape, groups);
            if (solid.shape) return solid;
        }
        if (ShapeType.hasShell(shapeType) && subShape.shapeType === ShapeType.Face) {
            let shell = this.getAncestorAndIndex(ShapeType.Shell, subShape, shape, groups);
            if (shell.shape) return shell;
        }
        if (ShapeType.hasWire(shapeType) && subShape.shapeType === ShapeType.Edge) {
            let wire = this.getAncestorAndIndex(ShapeType.Wire, subShape, shape, groups);
            if (wire.shape) return wire;
        }
        if (!ShapeType.hasFace(shapeType) && subShape.shapeType === ShapeType.Face) {
            return { shape: undefined, indexes: [index] };
        }
        if (!ShapeType.hasEdge(shapeType) && subShape.shapeType === ShapeType.Edge) {
            return { shape: undefined, indexes: [index] };
        }
        return { shape: subShape, indexes: [index], transform };
    }
    getAncestorAndIndex(type, subShape, shape, groups) {
        let ancestor = subShape.findAncestor(type, shape).at(0);
        if (!ancestor) return { shape: undefined, indexes: [] };
        let indexes = [];
        for (const sub of ancestor.findSubShapes(subShape.shapeType)) {
            this.findIndex(groups, sub, indexes);
        }
        return { shape: ancestor, indexes, subShape, transform: groups.at(0)?.transform };
    }
    findIndex(groups, shape, indexes) {
        for (let i = 0; i < groups.length; i++) {
            if (shape.isEqual(groups[i].shape)) {
                indexes.push(i);
            }
        }
    }
    findShapeAndIndex(parent, element) {
        let type = "edge";
        let subVisualIndex = element.faceIndex * 2;
        if (!element.pointOnLine) {
            type = "face";
            subVisualIndex = element.faceIndex * 3;
        }
        return parent.getSubShapeAndIndex(type, subVisualIndex);
    }
    findIntersectedNodes(mx, my) {
        let visuals = [];
        this.document.visual.context.visuals().forEach((x) => {
            if (!x.visible) return;
            if (x instanceof ThreeVisualObject) {
                visuals.push(...x.wholeVisual());
            }
        });
        return this.initRaycaster(mx, my).intersectObjects(visuals, false);
    }
    findIntersectedShapes(shapeType, mx, my) {
        let raycaster = this.initRaycaster(mx, my);
        let shapes = this.initIntersectableShapes(shapeType);
        return raycaster.intersectObjects(shapes, false);
    }
    initIntersectableShapes(shapeType) {
        let shapes = new Array();
        this.document.visual.context.visuals().forEach((x) => {
            if (!x.visible) return;
            if (x instanceof ThreeVisualObject) shapes.push(...x.subShapeVisual(shapeType));
            // TODO: vertex
        });
        return shapes;
    }
    initRaycaster(mx, my) {
        let threshold = Constants.RaycasterThreshold;
        let { x, y } = this.screenToCameraRect(mx, my);
        let mousePos = new Vector2(x, y);
        let raycaster = new Raycaster();
        if (this.mode === ViewMode.wireframe) {
            raycaster.layers.disableAll();
            raycaster.layers.enable(Constants.Layers.Wireframe);
        } else if (this.mode === ViewMode.solid) {
            raycaster.layers.disableAll();
            raycaster.layers.enable(Constants.Layers.Solid);
        } else {
            raycaster.layers.enableAll();
        }
        raycaster.setFromCamera(mousePos, this.camera);
        raycaster.params = {
            ...raycaster.params,
            Line2: { threshold },
            Line: { threshold },
            Points: { threshold },
        };
        return raycaster;
    }
}
