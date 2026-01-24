// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
var __decorate =
    (this && this.__decorate) ||
    function (decorators, target, key, desc) {
        var c = arguments.length,
            r =
                c < 3
                    ? target
                    : desc === null
                      ? (desc = Object.getOwnPropertyDescriptor(target, key))
                      : desc,
            d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if ((d = decorators[i]))
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
import {
    AsyncController,
    BoundingBox,
    ComponentNode,
    EdgeMeshData,
    GeometryNode,
    LineType,
    MeshNode,
    Property,
    PubSub,
    Transaction,
    VisualConfig,
    VisualNode,
} from "chili-core";
import { MultistepCommand } from "../multistepCommand";
export class TransformedCommand extends MultistepCommand {
    models;
    positions;
    get isClone() {
        return this.getPrivateValue("isClone", false);
    }
    set isClone(value) {
        this.setProperty("isClone", value);
    }
    transformPreview = (point) => {
        const transform = this.transfrom(point);
        const positions = transform.ofPoints(this.positions);
        return {
            position: new Float32Array(positions),
            lineType: LineType.Solid,
            color: VisualConfig.defaultEdgeColor,
            range: [],
        };
    };
    async ensureSelectedModels() {
        this.models = this.document.selection.getSelectedNodes().filter((x) => x instanceof VisualNode);
        if (this.models.length > 0) return true;
        this.controller = new AsyncController();
        this.models = await this.document.selection.pickNode("prompt.select.models", this.controller, true);
        if (this.models.length > 0) return true;
        if (this.controller.result?.status === "success") {
            PubSub.default.pub("showToast", "toast.select.noSelected");
        }
        return false;
    }
    async canExcute() {
        if (!(await this.ensureSelectedModels())) return false;
        this.positions = this.models.flatMap((model) => {
            if (model instanceof MeshNode) {
                return model.mesh.position ? model.transform.ofPoints(model.mesh.position) : [];
            } else if (model instanceof GeometryNode) {
                return model.mesh.edges?.position ? model.transform.ofPoints(model.mesh.edges.position) : [];
            } else if (model instanceof ComponentNode) {
                return Array.from(BoundingBox.wireframe(model.boundingBox()).position);
            }
            return [];
        });
        return true;
    }
    getTempLineData(start, end) {
        return EdgeMeshData.from(start, end, VisualConfig.temporaryEdgeColor, LineType.Solid);
    }
    executeMainTask() {
        Transaction.execute(this.document, `excute ${Object.getPrototypeOf(this).data.name}`, () => {
            const transform = this.transfrom(this.stepDatas.at(-1).point);
            if (this.isClone) {
                this.models?.forEach((x) => {
                    const clone = x.clone();
                    clone.transform = x.transform.multiply(transform);
                    x.parent?.insertAfter(x, clone);
                });
            } else {
                this.models?.forEach((x) => {
                    x.transform = x.transform.multiply(transform);
                });
            }
            this.document.visual.update();
        });
    }
}
__decorate([Property.define("common.clone")], TransformedCommand.prototype, "isClone", null);
