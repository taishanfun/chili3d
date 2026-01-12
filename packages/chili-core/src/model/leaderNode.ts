// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { IDocument } from "../document";
import { Id } from "../foundation";
import { I18nKeys } from "../i18n";
import { BoundingBox, Matrix4, XYZ } from "../math";
import { Property } from "../property";
import { Serializer } from "../serialize";
import { VisualNode } from "./visualNode";

@Serializer.register(["document", "points", "text", "height", "isAssociative", "name", "id"])
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
        this.setProperty("isAssociative", value, () => this.document.visual.context.redrawNode([this]));
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
}
