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
import { AsyncController, EdgeMeshDataBuilder, I18n, Precision, Property, command } from "chili-core";
import { PolygonNode } from "../../bodys";
import { Dimension } from "../../snap";
import { PointStep } from "../../step";
import { CreateFaceableCommand } from "../createCommand";
let Polygon = class Polygon extends CreateFaceableCommand {
    confirm = () => {
        this.controller?.success();
    };
    geometryNode() {
        let node = new PolygonNode(
            this.document,
            this.stepDatas.map((step) => step.point),
        );
        node.isFace = this.isFace;
        return node;
    }
    async executeSteps() {
        let steps = this.getSteps();
        let firstStep = true;
        while (true) {
            let step = firstStep ? steps[0] : steps[1];
            if (firstStep) firstStep = false;
            this.controller = new AsyncController();
            let data = await step.execute(this.document, this.controller);
            if (data === undefined) {
                return this.controller.result?.status === "success";
            }
            this.stepDatas.push(data);
            if (this.isClose(data)) {
                return true;
            }
        }
    }
    isClose(data) {
        return (
            this.stepDatas.length > 1 && this.stepDatas[0].point.distanceTo(data.point) <= Precision.Distance
        );
    }
    getSteps() {
        let firstStep = new PointStep("prompt.pickFistPoint");
        let secondStep = new PointStep("prompt.pickNextPoint", this.getNextData);
        return [firstStep, secondStep];
    }
    getNextData = () => {
        return {
            refPoint: () => this.stepDatas.at(-1).point,
            dimension: Dimension.D1D2D3,
            validator: this.validator,
            preview: this.preview,
            featurePoints: [
                {
                    point: this.stepDatas.at(0).point,
                    prompt: I18n.translate("prompt.polygon.close"),
                    when: () => this.stepDatas.length > 2,
                },
            ],
        };
    };
    preview = (point) => {
        let ps = this.stepDatas.map((data) => this.meshPoint(data.point));
        let edges = new EdgeMeshDataBuilder();
        this.stepDatas.forEach((data) => edges.addPosition(data.point.x, data.point.y, data.point.z));
        if (point) {
            edges.addPosition(point.x, point.y, point.z);
        }
        return [...ps, edges.build()];
    };
    validator = (point) => {
        for (const data of this.stepDatas) {
            if (point.distanceTo(data.point) < 0.001) {
                return false;
            }
        }
        return true;
    };
};
__decorate([Property.define("common.confirm")], Polygon.prototype, "confirm", void 0);
Polygon = __decorate(
    [
        command({
            key: "create.polygon",
            icon: "icon-toPoly",
        }),
    ],
    Polygon,
);
export { Polygon };
