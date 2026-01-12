import { command, DimensionNode, I18n, Precision, VisualConfig, XYZ } from "chili-core";
import { Dimension, PointSnapData } from "../../snap";
import { IStep, PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";

@command({
    key: "dimension.vertical",
    icon: "icon-measureLength",
})
export class VerticalDimension extends MultistepCommand {
    protected override getSteps(): IStep[] {
        return [
            new PointStep("prompt.pickFistPoint"),
            new PointStep("prompt.pickNextPoint", this.getSecondPointData),
            new PointStep("prompt.pickDimensionLocation", this.getThirdPointData),
        ];
    }

    private readonly getSecondPointData = (): PointSnapData => {
        return {
            refPoint: () => this.stepDatas[0].point!,
            dimension: Dimension.D1D2D3,
            validator: (point: XYZ) => {
                return this.stepDatas[0].point!.distanceTo(point) > Precision.Distance;
            },
            preview: this.secondPointPreview,
        };
    };

    private readonly getThirdPointData = (): PointSnapData => {
        return {
            refPoint: () => this.stepDatas[1].point!,
            dimension: Dimension.D1D2D3,
            preview: this.dimensionPreview,
        };
    };

    private readonly secondPointPreview = (point: XYZ | undefined) => {
        if (!point) {
            return [this.meshPoint(this.stepDatas[0].point!)];
        }
        return [this.meshPoint(this.stepDatas[0].point!), this.meshLine(this.stepDatas[0].point!, point)];
    };

    private readonly dimensionPreview = (point: XYZ | undefined) => {
        const p1 = this.stepDatas[0].point!;
        const p2 = this.stepDatas[1].point!;
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

    private verticalResult(location: XYZ): {
        value: number;
        p1: XYZ;
        p2: XYZ;
        dimStart: XYZ;
        dimEnd: XYZ;
        text: XYZ;
    } {
        const view = this.stepDatas[0].view;
        const plane = view.workplane;

        try {
            const wasmDimension = (globalThis as any).wasm?.Dimension;
            if (wasmDimension?.vertical) {
                return wasmDimension.vertical(
                    {
                        location: plane.origin,
                        direction: plane.normal,
                        xDirection: plane.xvec,
                    },
                    this.stepDatas[0].point!,
                    this.stepDatas[1].point!,
                    location,
                );
            }
        } catch {}

        return this.verticalResultFallback(
            plane,
            this.stepDatas[0].point!,
            this.stepDatas[1].point!,
            location,
        );
    }

    private verticalResultFallback(
        plane: { origin: XYZ; xvec: XYZ; yvec: XYZ },
        p1: XYZ,
        p2: XYZ,
        p3: XYZ,
    ): {
        value: number;
        p1: XYZ;
        p2: XYZ;
        dimStart: XYZ;
        dimEnd: XYZ;
        text: XYZ;
    } {
        const toXY = (p: XYZ) => {
            const v = p.sub(plane.origin);
            return { x: v.dot(plane.xvec), y: v.dot(plane.yvec) };
        };

        const fromXY = (x: number, y: number) => {
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

    protected override executeMainTask(): void {
        const p1 = this.stepDatas[0].point!;
        const p2 = this.stepDatas[1].point!;
        const location = this.stepDatas[2].point!;
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
}
