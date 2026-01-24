// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import {
    AsyncController,
    CancelableCommand,
    Config,
    EdgeMeshData,
    LineType,
    Result,
    VertexMeshData,
    VisualConfig,
} from "chili-core";
import { ViewUtils } from "chili-vis";
export class MultistepCommand extends CancelableCommand {
    stepDatas = [];
    canExcute() {
        return Promise.resolve(true);
    }
    onRestarting() {
        this.resetStepDatas();
    }
    async executeAsync() {
        if (!(await this.canExcute()) || !(await this.executeSteps())) {
            return;
        }
        this.executeMainTask();
    }
    async executeSteps() {
        let steps = this.getSteps();
        try {
            while (this.stepDatas.length < steps.length) {
                this.controller = new AsyncController();
                let data = await steps[this.stepDatas.length].execute(this.document, this.controller);
                if (data === undefined || this.controller.result?.status !== "success") {
                    return false;
                }
                this.stepDatas.push(data);
            }
            return true;
        } finally {
            if (!this._isRestarting) {
                this.document.selection.clearSelection();
                this.document.visual.highlighter.clear();
            }
        }
    }
    resetStepDatas() {
        this.stepDatas.length = 0;
    }
    meshPoint(point) {
        return VertexMeshData.from(point, VisualConfig.editVertexSize, VisualConfig.editVertexColor);
    }
    meshLine(start, end, color = VisualConfig.defaultEdgeColor, lineWith) {
        const data = EdgeMeshData.from(start, end, color, LineType.Solid);
        if (lineWith !== undefined) {
            data.lineWidth = lineWith;
        }
        return data;
    }
    meshCreatedShape(method, ...args) {
        const shape = this.application.shapeFactory[method](...args);
        return this.meshShape(shape);
    }
    meshShape(shape, disposeShape = true) {
        if (shape instanceof Result && !shape.isOk) {
            throw shape.error;
        }
        const s = shape instanceof Result ? shape.value : shape;
        const edgeMesh = s.edgesMeshPosition();
        if (disposeShape) {
            s.dispose();
        }
        return edgeMesh;
    }
    findPlane = (view, origin, point) => {
        if (point === undefined || !Config.instance.dynamicWorkplane) {
            return view.workplane.translateTo(origin);
        }
        return ViewUtils.raycastClosestPlane(view, origin, point);
    };
    transformdFirstShape(step, shouldDispose = true) {
        const shape = step.shapes[0].shape.transformedMul(step.shapes[0].transform);
        if (shouldDispose) this.disposeStack.add(shape);
        return shape;
    }
    transformdShapes(step, shouldDispose = true) {
        return step.shapes.map((s) => {
            const shape = s.shape.transformedMul(s.transform);
            if (shouldDispose) this.disposeStack.add(shape);
            return shape;
        });
    }
}
