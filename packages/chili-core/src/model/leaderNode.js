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
var LeaderNode_1;
import { Id } from "../foundation";
import { BoundingBox, Matrix4, XYZ } from "../math";
import { Property } from "../property";
import { Serializer } from "../serialize";
import { VisualNode } from "./visualNode";
let LeaderNode = (LeaderNode_1 = class LeaderNode extends VisualNode {
    display() {
        return "body.leaderNode";
    }
    get points() {
        return this.getPrivateValue("points", []);
    }
    set points(value) {
        this.setProperty("points", value, () => this.document.visual.context.redrawNode([this]));
    }
    get text() {
        return this.getPrivateValue("text", "");
    }
    set text(value) {
        this.setProperty("text", value, () => this.document.visual.context.redrawNode([this]));
    }
    get height() {
        return this.getPrivateValue("height", 10);
    }
    set height(value) {
        this.setProperty("height", value, () => this.document.visual.context.redrawNode([this]));
    }
    get isAssociative() {
        return this.getPrivateValue("isAssociative", false);
    }
    set isAssociative(value) {
        this.setProperty("isAssociative", value, () => this.document.visual.context.redrawNode([this]));
    }
    constructor(document, points, text = "", name = "Leader", id = Id.generate()) {
        super(document, name, id);
        this.setPrivateValue("points", points);
        this.setPrivateValue("text", text);
        this.setPrivateValue("height", 10);
        this.setPrivateValue("isAssociative", false);
    }
    static fromWorld(document, pointsWorld, text = "", name, id) {
        const base = pointsWorld.at(0) ?? XYZ.zero;
        const transform = Matrix4.fromTranslation(base.x, base.y, base.z);
        const localPoints = pointsWorld.map((p) => p.sub(base));
        const node = new LeaderNode_1(document, localPoints, text, name ?? "Leader", id ?? Id.generate());
        node.transform = transform;
        return node;
    }
    lastPoint() {
        return this.points.at(-1);
    }
    boundingBox() {
        if (this.points.length === 0) return undefined;
        const raw = [];
        for (const p of this.points) {
            raw.push(p.x, p.y, p.z);
        }
        const points = this.transform.ofPoints(raw);
        return BoundingBox.fromNumbers(points);
    }
});
__decorate([Serializer.serialze()], LeaderNode.prototype, "points", null);
__decorate([Serializer.serialze(), Property.define("text.content")], LeaderNode.prototype, "text", null);
__decorate([Serializer.serialze(), Property.define("text.height")], LeaderNode.prototype, "height", null);
__decorate(
    [Serializer.serialze(), Property.define("leader.associative")],
    LeaderNode.prototype,
    "isAssociative",
    null,
);
LeaderNode = LeaderNode_1 = __decorate(
    [Serializer.register(["document", "points", "text", "height", "isAssociative", "name", "id"])],
    LeaderNode,
);
export { LeaderNode };
