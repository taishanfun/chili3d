// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { Config } from "../config";
import { IDocument } from "../document";
import { Id } from "../foundation";
import { I18nKeys } from "../i18n";
import { BoundingBox, Matrix4, XYZ } from "../math";
import { Property } from "../property";
import { Serializer } from "../serialize";
import { ShapeType } from "../shape";
import { IView } from "../visual";
import { MTextNode } from "./mtextNode";
import { TextNode } from "./textNode";
import { VisualNode } from "./visualNode";

@Serializer.register([
    "document",
    "points",
    "text",
    "height",
    "isAssociative",
    "startNodeId",
    "startShapeType",
    "startIndexesHint",
    "startLocalPoint",
    "startMode",
    "endNodeId",
    "endLocalPoint",
    "endMode",
    "name",
    "id",
])
export class LeaderNode extends VisualNode {
    override display(): I18nKeys {
        return "body.leaderNode";
    }

    @Serializer.serialze()
    get points(): XYZ[] {
        return this.getPrivateValue("points", []);
    }
    set points(value: XYZ[]) {
        this.setProperty("points", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("text.content")
    get text(): string {
        return this.getPrivateValue("text", "");
    }
    set text(value: string) {
        this.setProperty("text", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("text.height")
    get height(): number {
        return this.getPrivateValue("height", 10);
    }
    set height(value: number) {
        this.setProperty("height", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("leader.associative")
    get isAssociative(): boolean {
        return this.getPrivateValue("isAssociative", false);
    }
    set isAssociative(value: boolean) {
        const old = this.getPrivateValue("isAssociative", false);
        this.setProperty("isAssociative", value, () => {
            if (!old && value) {
                this.autoAssociateAnchors();
            }
            this.document.visual.context.redrawNode([this]);
        });
    }

    @Serializer.serialze()
    @Property.define("leader.startNodeId", { readOnly: true })
    get startNodeId(): string | undefined {
        return this.getPrivateValue("startNodeId");
    }
    set startNodeId(value: string | undefined) {
        this.setProperty("startNodeId", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("leader.startShapeType", { readOnly: true })
    get startShapeType(): ShapeType | undefined {
        return this.getPrivateValue("startShapeType");
    }
    set startShapeType(value: ShapeType | undefined) {
        this.setProperty("startShapeType", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    get startIndexesHint(): number[] {
        return this.getPrivateValue("startIndexesHint", []);
    }
    set startIndexesHint(value: number[]) {
        this.setProperty("startIndexesHint", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("leader.startLocalPoint", { readOnly: true })
    get startLocalPoint(): XYZ | undefined {
        return this.getPrivateValue("startLocalPoint");
    }
    set startLocalPoint(value: XYZ | undefined) {
        this.setProperty("startLocalPoint", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("leader.startMode", { readOnly: true })
    get startMode(): "fixed" | "slide" {
        return this.getPrivateValue("startMode", "fixed");
    }
    set startMode(value: "fixed" | "slide") {
        this.setProperty("startMode", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("leader.endNodeId", { readOnly: true })
    get endNodeId(): string | undefined {
        return this.getPrivateValue("endNodeId");
    }
    set endNodeId(value: string | undefined) {
        this.setProperty("endNodeId", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("leader.endLocalPoint", { readOnly: true })
    get endLocalPoint(): XYZ | undefined {
        return this.getPrivateValue("endLocalPoint");
    }
    set endLocalPoint(value: XYZ | undefined) {
        this.setProperty("endLocalPoint", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    @Property.define("leader.endMode", { readOnly: true })
    get endMode(): "fixed" | "slide" {
        return this.getPrivateValue("endMode", "fixed");
    }
    set endMode(value: "fixed" | "slide") {
        this.setProperty("endMode", value, () => this.document.visual.context.redrawNode([this]));
    }

    constructor(
        document: IDocument,
        points: XYZ[],
        text: string = "",
        name: string = "Leader",
        id: string = Id.generate(),
    ) {
        super(document, name, id);
        this.setPrivateValue("points", points);
        this.setPrivateValue("text", text);
        this.setPrivateValue("height", 10);
        this.setPrivateValue("isAssociative", false);
        this.setPrivateValue("startNodeId", undefined as any);
        this.setPrivateValue("startShapeType", undefined as any);
        this.setPrivateValue("startIndexesHint", []);
        this.setPrivateValue("startLocalPoint", undefined as any);
        this.setPrivateValue("startMode", "fixed");
        this.setPrivateValue("endNodeId", undefined as any);
        this.setPrivateValue("endLocalPoint", undefined as any);
        this.setPrivateValue("endMode", "fixed");
        this.onPropertyChanged(this.handleLeaderChanged);
    }

    static fromWorld(
        document: IDocument,
        pointsWorld: XYZ[],
        text: string = "",
        name?: string,
        id?: string,
    ) {
        const base = pointsWorld.at(0) ?? XYZ.zero;
        const transform = Matrix4.fromTranslation(base.x, base.y, base.z);
        const localPoints = pointsWorld.map((p) => p.sub(base));
        const node = new LeaderNode(document, localPoints, text, name ?? "Leader", id ?? Id.generate());
        node.transform = transform;
        return node;
    }

    lastPoint(): XYZ | undefined {
        return this.points.at(-1);
    }

    override boundingBox(): BoundingBox | undefined {
        if (this.points.length === 0) return undefined;
        const raw: number[] = [];
        for (const p of this.points) {
            raw.push(p.x, p.y, p.z);
        }
        const points = this.transform.ofPoints(raw);
        return BoundingBox.fromNumbers(points);
    }

    private readonly handleLeaderChanged = (property: keyof LeaderNode) => {
        if (!this.isAssociative) return;
        if (property === "points" || property === "transform") {
            if (this.startNodeId && this.endNodeId) return;
            const view = this.document.application.activeView;
            if (!view || view.document !== this.document) return;
            this.autoAssociateAnchorsInView(view);
        }
    };

    private autoAssociateAnchors() {
        const view = this.document.application.activeView;
        if (!view || view.document !== this.document) return;
        this.autoAssociateAnchorsInView(view);
    }

    private autoAssociateAnchorsInView(view: IView) {
        if (this.points.length === 0) return;

        const leaderWorld = this.worldTransform();
        const startWorld = leaderWorld.ofPoint(this.points[0] ?? XYZ.zero);
        const endWorld = leaderWorld.ofPoint(this.points.at(-1) ?? XYZ.zero);

        if (!this.startNodeId) {
            const start = this.detectShapeAnchor(view, startWorld);
            if (start) {
                this.startNodeId = start.node.id;
                this.startShapeType = start.shapeType;
                this.startIndexesHint = start.indexes;
                this.startLocalPoint = start.localPoint;
                this.startMode =
                    start.shapeType === ShapeType.Edge || start.shapeType === ShapeType.Face
                        ? "slide"
                        : "fixed";
            }
        }

        if (!this.endNodeId) {
            const endText = this.detectTextAnchor(view, endWorld);
            if (endText) {
                this.endNodeId = endText.node.id;
                this.endLocalPoint = endText.localPoint;
                this.endMode = "fixed";
                return;
            }

            const end = this.detectShapeAnchor(view, endWorld);
            if (end) {
                this.endNodeId = end.node.id;
                this.endLocalPoint = end.localPoint;
                this.endMode =
                    end.shapeType === ShapeType.Edge || end.shapeType === ShapeType.Face ? "slide" : "fixed";
            }
        }
    }

    private detectTextAnchor(view: IView, worldPoint: XYZ) {
        const xy = view.worldToScreen(worldPoint);
        const tol = this.detectTolerancePx();
        const visuals = view.detectVisualRect(xy.x - tol, xy.y - tol, xy.x + tol, xy.y + tol);
        for (const visual of visuals) {
            const node = view.document.visual.context.getNode(visual);
            if (!(node instanceof TextNode || node instanceof MTextNode)) continue;
            return { node, localPoint: XYZ.zero };
        }
        return undefined;
    }

    private detectShapeAnchor(view: IView, worldPoint: XYZ) {
        const xy = view.worldToScreen(worldPoint);
        const tol = this.detectTolerancePx();
        const shapes = view.detectShapesRect(
            ShapeType.Edge | ShapeType.Face | ShapeType.Wire | ShapeType.Shell | ShapeType.Solid,
            xy.x - tol,
            xy.y - tol,
            xy.x + tol,
            xy.y + tol,
        );
        const hit = shapes.at(0);
        if (!hit) return undefined;
        const node = view.document.visual.context.getNode(hit.owner);
        if (!(node instanceof VisualNode)) return undefined;
        const worldInv = node.worldTransform().invert();
        if (!worldInv) return undefined;
        const anchorWorldPoint = hit.point ?? worldPoint;
        const localPoint = worldInv.ofPoint(anchorWorldPoint);
        return { node, localPoint, shapeType: hit.shape.shapeType, indexes: [...hit.indexes] };
    }

    private detectTolerancePx() {
        return Math.max(4, Math.min(20, Config.instance.SnapDistance * 2));
    }
}
