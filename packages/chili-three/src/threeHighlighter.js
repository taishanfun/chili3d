// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { IDisposable, ShapeMeshData, ShapeType, VisualState } from "chili-core";
import { MeshUtils } from "chili-geo";
import { Group, Mesh, Points } from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry";
import {
    faceColoredMaterial,
    faceTransparentMaterial,
    hilightEdgeMaterial,
    selectedEdgeMaterial,
} from "./common";
import { ThreeGeometry } from "./threeGeometry";
import { ThreeGeometryFactory } from "./threeGeometryFactory";
import { ThreeMeshObject } from "./threeVisualObject";
import { IHighlightable } from "./highlightable";
export class GeometryState {
    highlighter;
    visual;
    _states = new Map();
    constructor(highlighter, visual) {
        this.highlighter = highlighter;
        this.visual = visual;
    }
    getState(type, index) {
        const key = this.state_key(type, index);
        return this._states.get(key)?.[0];
    }
    state_key(type, index) {
        return `${type}_${index}`;
    }
    addState(state, type, index) {
        this.updateState("add", state, type, index);
    }
    removeState(state, type, index) {
        this.updateState("remove", state, type, index);
    }
    updateState(method, state, type, index) {
        if (ShapeType.isWhole(type)) {
            this.setWholeState(method, state, type);
        } else if (index.length > 0) {
            this.setSubGeometryState(method, state, type, index);
        }
    }
    setWholeState(method, state, type) {
        const key = this.state_key(type);
        let [_oldState, newState] = this.updateStates(key, method, state);
        if (this.visual instanceof ThreeGeometry) {
            if (newState === VisualState.normal) {
                this.visual.removeTemperaryMaterial();
            } else if (VisualState.hasState(newState, VisualState.edgeHighlight)) {
                this.visual.setEdgesMateiralTemperary(hilightEdgeMaterial);
            } else if (VisualState.hasState(newState, VisualState.edgeSelected)) {
                this.visual.setEdgesMateiralTemperary(selectedEdgeMaterial);
            } else if (VisualState.hasState(newState, VisualState.faceTransparent)) {
                this.visual.removeTemperaryMaterial();
                this.visual.setFacesMateiralTemperary(faceTransparentMaterial);
            } else if (VisualState.hasState(newState, VisualState.faceColored)) {
                this.visual.removeTemperaryMaterial();
                this.visual.setFacesMateiralTemperary(faceColoredMaterial);
            }
        } else if (IHighlightable.is(this.visual)) {
            if (newState !== VisualState.normal) {
                this.visual.highlight();
            } else {
                this.visual.unhighlight();
            }
        }
        this._states.set(key, [newState, undefined]);
    }
    updateStates(key, method, state) {
        let oldState = this._states.get(key)?.[0];
        let newState = oldState;
        if (newState === undefined) {
            if (method === "remove") return [undefined, VisualState.normal];
            newState = state;
        } else {
            let func = method === "add" ? VisualState.addState : VisualState.removeState;
            newState = func(newState, state);
        }
        return [oldState, newState];
    }
    resetState() {
        this.highlighter.container.children.forEach((x) => {
            x.geometry?.dispose();
        });
        this.highlighter.container.clear();
        if (this.visual instanceof ThreeGeometry) {
            this.visual.removeTemperaryMaterial();
        } else if (this.visual instanceof ThreeMeshObject) {
            this.visual.unhighlight();
        }
        this._states.clear();
    }
    setSubGeometryState(method, state, type, index) {
        const shouldRemoved = [];
        index.forEach((i) => {
            const key = this.state_key(type, i);
            const [oldState, newState] = this.updateStates(key, method, state);
            if (oldState !== undefined && newState === VisualState.normal) {
                shouldRemoved.push(key);
            } else {
                this.addSubEdgeState(type, key, i, newState);
            }
        });
        shouldRemoved.forEach((key) => {
            const item = this._states.get(key)?.[1];
            if (item) {
                this.highlighter.container.remove(item);
                item.geometry?.dispose();
                this._states.delete(key);
            }
        });
    }
    addSubEdgeState(type, key, i, newState) {
        const geometry = this.getOrCloneGeometry(type, key, i);
        if (geometry && "material" in geometry) {
            let material = VisualState.hasState(newState, VisualState.edgeHighlight)
                ? hilightEdgeMaterial
                : selectedEdgeMaterial;
            geometry.material = material;
            this._states.set(key, [newState, geometry]);
        }
    }
    getOrCloneGeometry(type, key, index) {
        if (!(this.visual instanceof ThreeGeometry)) return undefined;
        const geometry = this._states.get(key)?.[1];
        if (geometry) return geometry;
        let points = undefined;
        if (ShapeType.hasFace(type) || ShapeType.hasShell(type)) {
            points = MeshUtils.subFaceOutlines(this.visual.geometryNode.mesh.faces, index);
        }
        if (points === undefined && (ShapeType.hasEdge(type) || ShapeType.hasWire(type))) {
            points = MeshUtils.subEdge(this.visual.geometryNode.mesh.edges, index);
        }
        if (!points) {
            console.warn(`Invalid type ${type} for ${key}`);
            return undefined;
        }
        const lineGeometry = new LineSegmentsGeometry();
        lineGeometry.setPositions(points);
        const segment = new LineSegments2(lineGeometry);
        this.highlighter.container.add(segment);
        segment.applyMatrix4(this.visual.matrixWorld);
        return segment;
    }
}
export class ThreeHighlighter {
    content;
    _stateMap = new Map();
    container;
    constructor(content) {
        this.content = content;
        this.container = new Group();
        this.container.name = "highlighter";
        this.content.scene.add(this.container);
    }
    clear() {
        this._stateMap.forEach((v, k) => {
            this.resetState(k);
        });
        this._stateMap.clear();
    }
    resetState(geometry) {
        if (!this._stateMap.has(geometry)) return;
        let geometryState = this._stateMap.get(geometry);
        geometryState.resetState();
        this._stateMap.delete(geometry);
    }
    getState(shape, type, index) {
        if (this._stateMap.has(shape)) {
            return this._stateMap.get(shape).getState(type, index);
        }
        return undefined;
    }
    addState(geometry, state, type, ...index) {
        let geometryState = this.getOrInitState(geometry);
        geometryState.addState(state, type, index);
    }
    removeState(geometry, state, type, ...index) {
        let geometryState = this.getOrInitState(geometry);
        geometryState.removeState(state, type, index);
    }
    getOrInitState(geometry) {
        let geometryState = this._stateMap.get(geometry);
        if (!geometryState) {
            geometryState = new GeometryState(this, geometry);
            this._stateMap.set(geometry, geometryState);
        }
        return geometryState;
    }
    highlightMesh(...datas) {
        let group = new Group();
        datas.forEach((data) => {
            if (ShapeMeshData.isVertex(data)) {
                group.add(ThreeGeometryFactory.createVertexGeometry(data));
            } else if (ShapeMeshData.isEdge(data)) {
                group.add(ThreeGeometryFactory.createEdgeGeometry(data));
            } else if (ShapeMeshData.isFace(data)) {
                group.add(ThreeGeometryFactory.createFaceGeometry(data));
            }
        });
        this.container.add(group);
        return group.id;
    }
    removeHighlightMesh(id) {
        let shape = this.container.getObjectById(id);
        if (shape === undefined) return;
        shape.children.forEach((x) => {
            if (x instanceof Mesh || x instanceof LineSegments2 || x instanceof Points) {
                x.geometry.dispose();
                x.material.dispose();
            }
            if (IDisposable.isDisposable(x)) {
                x.dispose();
            }
        });
        shape.children.length = 0;
        this.container.remove(shape);
    }
}
