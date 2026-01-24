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
    EdgeMeshData,
    EditableShapeNode,
    I18n,
    LineType,
    Precision,
    VisualConfig,
    command,
} from "chili-core";
import { Dimension } from "../../snap";
import { PointStep } from "../../step";
import { CreateCommand } from "../createCommand";
let BezierCommand = class BezierCommand extends CreateCommand {
    geometryNode() {
        let bezier = this.application.shapeFactory.bezier(this.stepDatas.map((x) => x.point));
        return new EditableShapeNode(this.document, I18n.translate("command.create.bezier"), bezier.value);
    }
    async executeSteps() {
        const steps = this.getSteps();
        let firstStep = true;
        while (true) {
            const step = firstStep ? steps[0] : steps[1];
            if (firstStep) firstStep = false;
            this.controller = new AsyncController();
            const data = await step.execute(this.document, this.controller);
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
        console.log(this.stepDatas[0].point.distanceTo(data.point));
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
        let points = this.stepDatas.map((data) => data.point);
        if (point) {
            points.push(point);
        }
        if (points.length > 1) {
            ps.push(...this.previewLines(points));
            ps.push(this.meshCreatedShape("bezier", points));
        }
        return ps;
    };
    previewLines = (points) => {
        if (points.length < 2) {
            return [];
        }
        let res = [];
        for (let i = 1; i < points.length; i++) {
            res.push(this.meshHandle(points[i - 1], points[i]));
        }
        return res;
    };
    meshHandle(start, end) {
        return EdgeMeshData.from(start, end, VisualConfig.temporaryEdgeColor, LineType.Dash);
    }
    validator = (point) => {
        for (const data of this.stepDatas) {
            if (point.distanceTo(data.point) < 0.001) {
                return false;
            }
        }
        return true;
    };
};
BezierCommand = __decorate(
    [
        command({
            key: "create.bezier",
            icon: "icon-bezier",
        }),
    ],
    BezierCommand,
);
export { BezierCommand };
