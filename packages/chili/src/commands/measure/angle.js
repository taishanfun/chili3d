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
import { command, Precision, VisualConfig } from "chili-core";
import { Dimension } from "../../snap";
import { PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";
const ARC_POSITION = 0.5;
let AngleMeasure = class AngleMeasure extends MultistepCommand {
    getSteps() {
        const firstStep = new PointStep("prompt.pickFistPoint");
        const secondStep = new PointStep("prompt.pickNextPoint", this.getSecondPointData);
        const thirdStep = new PointStep("prompt.pickNextPoint", this.getThirdPointData);
        return [firstStep, secondStep, thirdStep];
    }
    getSecondPointData = () => {
        return {
            refPoint: () => this.stepDatas[0].point,
            dimension: Dimension.D1D2D3,
            validator: (point) => {
                return this.stepDatas[0].point.distanceTo(point) > Precision.Distance;
            },
            preview: this.linePreview,
        };
    };
    linePreview = (point) => {
        if (!point) {
            return [this.meshPoint(this.stepDatas[0].point)];
        }
        return [this.meshPoint(this.stepDatas[0].point), this.meshLine(this.stepDatas[0].point, point)];
    };
    getThirdPointData = () => {
        return {
            refPoint: () => this.stepDatas[0].point,
            dimension: Dimension.D1D2D3,
            prompt: (result) => this.anglePrompt(result.point),
            validator: (point) => {
                return (
                    this.stepDatas[0].point.distanceTo(point) > Precision.Distance &&
                    this.stepDatas[1].point.distanceTo(point) > Precision.Distance
                );
            },
            preview: this.arcPreview,
        };
    };
    anglePrompt = (point) => {
        const { rad } = this.arcInfo(point);
        return ((rad * 180) / Math.PI).toFixed(2) + "°";
    };
    arcPreview = (point) => {
        const meshes = [
            this.meshPoint(this.stepDatas[0].point),
            this.meshPoint(this.stepDatas[1].point),
            this.meshLine(
                this.stepDatas[0].point,
                this.stepDatas[1].point,
                VisualConfig.highlightEdgeColor,
                3,
            ),
        ];
        if (!point) return meshes;
        const { v1, rad, normal } = this.arcInfo(point);
        const angle = (rad * 180) / Math.PI;
        if (angle < Precision.Angle) return meshes;
        const line2 = this.meshLine(this.stepDatas[0].point, point, VisualConfig.highlightEdgeColor, 3);
        const arc = this.application.shapeFactory
            .arc(
                normal,
                this.stepDatas[0].point,
                this.stepDatas[0].point.add(v1.multiply(this.lineLength(point) * ARC_POSITION)),
                angle,
            )
            .unchecked()?.mesh.edges;
        arc.lineWidth = 3;
        arc.color = VisualConfig.highlightEdgeColor;
        return [line2, arc, ...meshes];
    };
    lineLength(point) {
        const d1 = this.stepDatas[0].point.distanceTo(this.stepDatas[1].point);
        if (!point) {
            return d1;
        }
        const d2 = this.stepDatas[0].point.distanceTo(point);
        return Math.min(d1, d2);
    }
    arcInfo(point) {
        const v1 = this.stepDatas[1].point.sub(this.stepDatas[0].point).normalize();
        const v2 = point.sub(this.stepDatas[0].point).normalize();
        const rad = v1.angleTo(v2);
        const normal = v1.cross(v2).normalize();
        return {
            v1,
            v2,
            rad,
            normal,
        };
    }
    executeMainTask() {
        const { v1, rad, normal } = this.arcInfo(this.stepDatas[2].point);
        const arcMid = v1
            .rotate(normal, rad * 0.5)
            .multiply(this.lineLength(this.stepDatas[2].point) * ARC_POSITION)
            .add(this.stepDatas[0].point);
        const visualId = this.document.visual.context.displayMesh([
            this.meshPoint(this.stepDatas[2].point),
            ...this.arcPreview(this.stepDatas[2].point),
        ]);
        this.application.activeView?.htmlText(((rad * 180) / Math.PI).toFixed(2) + "°", arcMid, {
            onDispose: () => {
                this.document.visual.context.removeMesh(visualId);
            },
        });
    }
};
AngleMeasure = __decorate(
    [
        command({
            key: "measure.angle",
            icon: "icon-measureAngle",
        }),
    ],
    AngleMeasure,
);
export { AngleMeasure };
