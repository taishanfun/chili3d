// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Plane } from "chili-core";
import * as THREE from "three";
import { ThreeHighlighter } from "../src/threeHighlighter";
import { ThreeView } from "../src/threeView";
class TestWebGLRenderer {
    domElement;
    constructor(domElement = document.createElement("canvas")) {
        this.domElement = domElement;
    }
    render(scene, camera) {}
    setSize(width, height, updateStyle) {}
    getPixelRatio() {
        return 1;
    }
    getViewport() {
        return new THREE.Vector4();
    }
    setViewport(v) {}
    setPixelRatio(value) {}
    getSize(target) {
        return new THREE.Vector2();
    }
    setAnimationLoop(fn) {}
    getRenderTarget() {
        return null;
    }
    setRenderTarget() {}
    clear() {}
    clearDepth() {}
    getClearColor() {}
    getClearAlpha() {}
    getContext() {
        return {
            getExtension(str) {},
        };
    }
}
export const container = document.createElement("canvas");
container.getBoundingClientRect = () => {
    return { left: 0, top: 0, width: 100, height: 100 };
};
Object.defineProperties(container, {
    clientWidth: {
        get() {
            return 100;
        },
    },
    clientHeight: {
        get() {
            return 100;
        },
    },
});
export class TestView extends ThreeView {
    constructor(document, content) {
        super(document, "test", Plane.XY, new ThreeHighlighter(content), content);
        this.setDom(container);
        this.camera.position.set(0, 0, 100);
        this.camera.lookAt(0, 0, 0);
    }
    initRenderer() {
        let render = new TestWebGLRenderer();
        render.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(render.domElement);
        return render;
    }
}
