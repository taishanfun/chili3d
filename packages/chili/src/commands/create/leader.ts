import {
    AsyncController,
    I18n,
    LeaderNode,
    MTextNode,
    Precision,
    Property,
    ShapeMeshData,
    ShapeType,
    TextNode,
    VisualNode,
    XYZ,
    command,
} from "chili-core";
import { Dimension, PointSnapData, SnapResult } from "../../snap";
import { IStep, PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";

@command({
    key: "create.leader",
    icon: "icon-toPoly",
})
export class Leader extends MultistepCommand {
    @Property.define("leader.associative")
    isAssociative = true;

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
        const start = this.stepDatas.at(0);
        const end = this.stepDatas.at(-1);
        if (!start || !end) return;

        let endPoint = end.point!;

        const endNode = end.nodes?.at(0);
        if (endNode instanceof TextNode || endNode instanceof MTextNode) {
            endPoint = endNode.worldTransform().ofPoint(XYZ.zero);
        }

        const points = this.stepDatas.map((d, i) => (i === this.stepDatas.length - 1 ? endPoint : d.point!));
        const node = LeaderNode.fromWorld(
            this.document,
            points,
            "",
            I18n.translate("command.create.leader"),
        );
        node.isAssociative = this.isAssociative;
        if (node.isAssociative) {
            this.applyAnchorFromSnap(node, start, true);
            this.applyAnchorFromSnap(node, end, false);
        }
        this.document.rootNode.add(node);
        this.document.visual.update();
    }

    private applyAnchorFromSnap(node: LeaderNode, snap: SnapResult, isStart: boolean) {
        if (!snap.point) return;

        const targetNode = this.tryGetOwnerNodeFromShapes(snap) ?? snap.nodes?.at(0);
        if (!targetNode) return;

        const anchorWorldPoint =
            targetNode instanceof TextNode || targetNode instanceof MTextNode
                ? targetNode.worldTransform().ofPoint(XYZ.zero)
                : snap.point;

        const worldInv = targetNode.worldTransform().invert();
        if (!worldInv) return;
        const localPoint = worldInv.ofPoint(anchorWorldPoint);

        const shapeType: ShapeType | undefined = snap.shapes?.[0]?.shape?.shapeType;
        const mode: "fixed" | "slide" =
            shapeType === ShapeType.Edge || shapeType === ShapeType.Face ? "slide" : "fixed";

        if (isStart) {
            node.startNodeId = targetNode.id;
            node.startShapeType = shapeType;
            node.startIndexesHint = [...(snap.shapes?.[0]?.indexes ?? [])];
            node.startLocalPoint = localPoint;
            node.startMode = mode;
        } else {
            node.endNodeId = targetNode.id;
            node.endLocalPoint = localPoint;
            node.endMode = mode;
        }
    }

    private tryGetOwnerNodeFromShapes(snap: SnapResult): VisualNode | undefined {
        const owner = snap.shapes?.at(0)?.owner;
        if (!owner) return undefined;
        const node = snap.view.document.visual.context.getNode(owner);
        return node instanceof VisualNode ? node : undefined;
    }
}
