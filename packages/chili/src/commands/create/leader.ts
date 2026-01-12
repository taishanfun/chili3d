import {
    AsyncController,
    I18n,
    LeaderNode,
    Precision,
    Property,
    ShapeMeshData,
    XYZ,
    command,
} from "chili-core";
import { Dimension, PointSnapData } from "../../snap";
import { IStep, PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";

@command({
    key: "create.leader",
    icon: "icon-toPoly",
})
export class Leader extends MultistepCommand {
    @Property.define("leader.associative")
    isAssociative = false;

    @Property.define("common.confirm")
    readonly confirm = () => {
        if (this.stepDatas.length < 2) return;
        this.controller?.success();
    };

    protected override async executeSteps(): Promise<boolean> {
        const [firstStep, nextStep] = this.getSteps();
        let isFirst = true;
        while (true) {
            const step = isFirst ? firstStep : nextStep;
            if (isFirst) isFirst = false;

            this.controller = new AsyncController();
            const data = await step.execute(this.document, this.controller);
            if (data === undefined) {
                return this.controller.result?.status === "success" && this.stepDatas.length >= 2;
            }
            this.stepDatas.push(data);
        }
    }

    protected override getSteps(): IStep[] {
        return [
            new PointStep("prompt.pickFistPoint"),
            new PointStep("prompt.pickNextPoint", this.getNextPointData),
        ];
    }

    private readonly getNextPointData = (): PointSnapData => {
        return {
            refPoint: () => this.stepDatas.at(-1)!.point!,
            dimension: Dimension.D1D2D3,
            validator: (point: XYZ) => {
                return this.stepDatas.at(-1)!.point!.distanceTo(point) > Precision.Distance;
            },
            preview: this.preview,
        };
    };

    private readonly preview = (point: XYZ | undefined): ShapeMeshData[] => {
        const meshes: ShapeMeshData[] = this.stepDatas.map((data) => this.meshPoint(data.point!));
        for (let i = 1; i < this.stepDatas.length; i++) {
            const a = this.stepDatas[i - 1].point!;
            const b = this.stepDatas[i].point!;
            meshes.push(this.meshLine(a, b));
        }
        if (point && this.stepDatas.length > 0) {
            const last = this.stepDatas.at(-1)!.point!;
            meshes.push(this.meshPoint(point));
            meshes.push(this.meshLine(last, point));
        }
        return meshes;
    };

    protected override executeMainTask(): void {
        const points = this.stepDatas.map((d) => d.point!);
        const node = LeaderNode.fromWorld(
            this.document,
            points,
            "",
            I18n.translate("command.create.leader"),
        );
        node.isAssociative = this.isAssociative;
        this.document.rootNode.add(node);
        this.document.visual.update();
    }
}
