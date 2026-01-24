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
import { AsyncController, I18n, LeaderNode, Precision, Property, command } from "chili-core";
import { Dimension } from "../../snap";
import { PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";
let Leader = class Leader extends MultistepCommand {
    isAssociative = false;
    confirm = () => {
        if (this.stepDatas.length < 2) return;
        this.controller?.success();
    };
    async executeSteps() {
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
    getSteps() {
        return [
            new PointStep("prompt.pickFistPoint"),
            new PointStep("prompt.pickNextPoint", this.getNextPointData),
        ];
    }
    getNextPointData = () => {
        return {
            refPoint: () => this.stepDatas.at(-1).point,
            dimension: Dimension.D1D2D3,
            validator: (point) => {
                return this.stepDatas.at(-1).point.distanceTo(point) > Precision.Distance;
            },
            preview: this.preview,
        };
    };
    preview = (point) => {
        const meshes = this.stepDatas.map((data) => this.meshPoint(data.point));
        for (let i = 1; i < this.stepDatas.length; i++) {
            const a = this.stepDatas[i - 1].point;
            const b = this.stepDatas[i].point;
            meshes.push(this.meshLine(a, b));
        }
        if (point && this.stepDatas.length > 0) {
            const last = this.stepDatas.at(-1).point;
            meshes.push(this.meshPoint(point));
            meshes.push(this.meshLine(last, point));
        }
        return meshes;
    };
    executeMainTask() {
        const points = this.stepDatas.map((d) => d.point);
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
};
__decorate([Property.define("leader.associative")], Leader.prototype, "isAssociative", void 0);
__decorate([Property.define("common.confirm")], Leader.prototype, "confirm", void 0);
Leader = __decorate(
    [
        command({
            key: "create.leader",
            icon: "icon-toPoly",
        }),
    ],
    Leader,
);
export { Leader };
