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
import { command, DimensionNode, I18n, Precision, VisualConfig } from "chili-core";
import { Dimension } from "../../snap";
import { PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";
let VerticalDimension = class VerticalDimension extends MultistepCommand {
    getSteps() {
        return [
            new PointStep("prompt.pickFistPoint"),
            new PointStep("prompt.pickNextPoint", this.getSecondPointData),
            new PointStep("prompt.pickDimensionLocation", this.getThirdPointData),
        ];
    }
    getSecondPointData = () => {
        return {
            refPoint: () => this.stepDatas[0].point,
            dimension: Dimension.D1D2D3,
            validator: (point) => {
                return this.stepDatas[0].point.distanceTo(point) > Precision.Distance;
            },
            preview: this.secondPointPreview,
        };
    };
    getThirdPointData = () => {
        return {
            refPoint: () => this.stepDatas[1].point,
            dimension: Dimension.D1D2D3,
            preview: this.dimensionPreview,
        };
    };
    secondPointPreview = (point) => {
        if (!point) {
            return [this.meshPoint(this.stepDatas[0].point)];
        }
        return [this.meshPoint(this.stepDatas[0].point), this.meshLine(this.stepDatas[0].point, point)];
    };
    dimensionPreview = (point) => {
        const p1 = this.stepDatas[0].point;
        const p2 = this.stepDatas[1].point;
        const m1 = this.meshPoint(p1);
        const m2 = this.meshPoint(p2);
        if (!point) return [m1, m2, this.meshLine(p1, p2)];
        const result = this.verticalResult(point);
        return [
            m1,
            m2,
            this.meshLine(result.p1, result.dimStart),
            this.meshLine(result.p2, result.dimEnd),
            this.meshLine(result.dimStart, result.dimEnd, VisualConfig.highlightEdgeColor, 3),
        ];
    };
    verticalResult(location) {
        const view = this.stepDatas[0].view;
        const plane = view.workplane;
        try {
            const wasmDimension = globalThis.wasm?.Dimension;
            if (wasmDimension?.vertical) {
                return wasmDimension.vertical(
                    {
                        location: plane.origin,
                        direction: plane.normal,
                        xDirection: plane.xvec,
                    },
                    this.stepDatas[0].point,
                    this.stepDatas[1].point,
                    location,
                );
            }
        } catch {}
        return this.verticalResultFallback(
            plane,
            this.stepDatas[0].point,
            this.stepDatas[1].point,
            location,
        );
    }
    verticalResultFallback(plane, p1, p2, p3) {
        const toXY = (p) => {
            const v = p.sub(plane.origin);
            return { x: v.dot(plane.xvec), y: v.dot(plane.yvec) };
        };
        const fromXY = (x, y) => {
            return plane.origin.add(plane.xvec.multiply(x)).add(plane.yvec.multiply(y));
        };
        const a = toXY(p1);
        const b = toXY(p2);
        const c = toXY(p3);
        const dimX = c.x;
        const dimY1 = a.y;
        const dimY2 = b.y;
        return {
            value: Math.abs(dimY2 - dimY1),
            p1: fromXY(a.x, a.y),
            p2: fromXY(b.x, b.y),
            dimStart: fromXY(dimX, dimY1),
            dimEnd: fromXY(dimX, dimY2),
            text: fromXY(dimX, (dimY1 + dimY2) * 0.5),
        };
    }
    executeMainTask() {
        const p1 = this.stepDatas[0].point;
        const p2 = this.stepDatas[1].point;
        const location = this.stepDatas[2].point;
        const plane = this.stepDatas[0].view.workplane;
        const node = DimensionNode.fromWorld(
            this.document,
            "vertical",
            p1,
            p2,
            location,
            {
                origin: plane.origin,
                normal: plane.normal,
                xvec: plane.xvec,
                yvec: plane.yvec,
            },
            I18n.translate("command.dimension.vertical"),
        );
        this.document.rootNode.add(node);
        this.document.visual.update();
    }
};
VerticalDimension = __decorate(
    [
        command({
            key: "dimension.vertical",
            icon: "icon-measureLength",
        }),
    ],
    VerticalDimension,
);
export { VerticalDimension };
