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
var DimensionNode_1;
import { Id } from "../foundation";
import { BoundingBox, Matrix4, XYZ } from "../math";
import { Serializer } from "../serialize";
import { VisualNode } from "./visualNode";
let DimensionNode = (DimensionNode_1 = class DimensionNode extends VisualNode {
    display() {
        return "body.dimensionNode";
    }
    get type() {
        return this.getPrivateValue("type", "horizontal");
    }
    set type(value) {
        this.setProperty("type", value, () => this.document.visual.context.redrawNode([this]));
    }
    get p1() {
        return this.getPrivateValue("p1", XYZ.zero);
    }
    set p1(value) {
        this.setProperty("p1", value, () => this.document.visual.context.redrawNode([this]), {
            equals: (l, r) => l.isEqualTo(r),
        });
    }
    get p2() {
        return this.getPrivateValue("p2", XYZ.zero);
    }
    set p2(value) {
        this.setProperty("p2", value, () => this.document.visual.context.redrawNode([this]), {
            equals: (l, r) => l.isEqualTo(r),
        });
    }
    get location() {
        return this.getPrivateValue("location", XYZ.zero);
    }
    set location(value) {
        this.setProperty("location", value, () => this.document.visual.context.redrawNode([this]), {
            equals: (l, r) => l.isEqualTo(r),
        });
    }
    get planeOrigin() {
        return this.getPrivateValue("planeOrigin", XYZ.zero);
    }
    set planeOrigin(value) {
        this.setProperty("planeOrigin", value, () => this.document.visual.context.redrawNode([this]), {
            equals: (l, r) => l.isEqualTo(r),
        });
    }
    get planeX() {
        return this.getPrivateValue("planeX", XYZ.unitX);
    }
    set planeX(value) {
        this.setProperty("planeX", value, () => this.document.visual.context.redrawNode([this]), {
            equals: (l, r) => l.isEqualTo(r),
        });
    }
    get planeY() {
        return this.getPrivateValue("planeY", XYZ.unitY);
    }
    set planeY(value) {
        this.setProperty("planeY", value, () => this.document.visual.context.redrawNode([this]), {
            equals: (l, r) => l.isEqualTo(r),
        });
    }
    get planeNormal() {
        return this.getPrivateValue("planeNormal", XYZ.unitZ);
    }
    set planeNormal(value) {
        this.setProperty("planeNormal", value, () => this.document.visual.context.redrawNode([this]), {
            equals: (l, r) => l.isEqualTo(r),
        });
    }
    get precision() {
        return this.getPrivateValue("precision", 2);
    }
    set precision(value) {
        this.setProperty("precision", value, () => this.document.visual.context.redrawNode([this]));
    }
    constructor(
        document,
        type,
        p1,
        p2,
        location,
        planeOrigin,
        planeX,
        planeY,
        planeNormal,
        name = "Dimension",
        id = Id.generate(),
    ) {
        super(document, name, id);
        this.setPrivateValue("type", type);
        this.setPrivateValue("p1", p1);
        this.setPrivateValue("p2", p2);
        this.setPrivateValue("location", location);
        this.setPrivateValue("planeOrigin", planeOrigin);
        this.setPrivateValue("planeX", planeX);
        this.setPrivateValue("planeY", planeY);
        this.setPrivateValue("planeNormal", planeNormal);
        this.setPrivateValue("precision", 2);
    }
    static fromWorld(document, type, p1World, p2World, locationWorld, plane, name, id) {
        const transform = Matrix4.fromTranslation(p1World.x, p1World.y, p1World.z);
        const node = new DimensionNode_1(
            document,
            type,
            XYZ.zero,
            p2World.sub(p1World),
            locationWorld.sub(p1World),
            plane.origin.sub(p1World),
            plane.xvec,
            plane.yvec,
            plane.normal,
            name ?? "Dimension",
            id ?? Id.generate(),
        );
        node.transform = transform;
        return node;
    }
    formatValue(value = this.compute().value) {
        return value.toFixed(this.precision);
    }
    compute() {
        const origin = this.planeOrigin;
        const xvec = this.planeX;
        const yvec = this.planeY;
        const toXY = (p) => {
            const v = p.sub(origin);
            return { x: v.dot(xvec), y: v.dot(yvec) };
        };
        const fromXY = (x, y) => {
            return origin.add(xvec.multiply(x)).add(yvec.multiply(y));
        };
        const a = toXY(this.p1);
        const b = toXY(this.p2);
        const c = toXY(this.location);
        if (this.type === "horizontal") {
            const dimY = c.y;
            const dimX1 = a.x;
            const dimX2 = b.x;
            return {
                value: Math.abs(dimX2 - dimX1),
                p1: fromXY(a.x, a.y),
                p2: fromXY(b.x, b.y),
                dimStart: fromXY(dimX1, dimY),
                dimEnd: fromXY(dimX2, dimY),
                text: fromXY((dimX1 + dimX2) * 0.5, dimY),
            };
        }
        if (this.type === "vertical") {
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
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len <= 1e-9) {
            return {
                value: 0,
                p1: fromXY(a.x, a.y),
                p2: fromXY(b.x, b.y),
                dimStart: fromXY(a.x, a.y),
                dimEnd: fromXY(b.x, b.y),
                text: fromXY((a.x + b.x) * 0.5, (a.y + b.y) * 0.5),
            };
        }
        const ux = dx / len;
        const uy = dy / len;
        const vx = -uy;
        const vy = ux;
        const offset = (c.x - a.x) * vx + (c.y - a.y) * vy;
        const dimStart = { x: a.x + vx * offset, y: a.y + vy * offset };
        const dimEnd = { x: b.x + vx * offset, y: b.y + vy * offset };
        const text = { x: (dimStart.x + dimEnd.x) * 0.5, y: (dimStart.y + dimEnd.y) * 0.5 };
        return {
            value: len,
            p1: fromXY(a.x, a.y),
            p2: fromXY(b.x, b.y),
            dimStart: fromXY(dimStart.x, dimStart.y),
            dimEnd: fromXY(dimEnd.x, dimEnd.y),
            text: fromXY(text.x, text.y),
        };
    }
    boundingBox() {
        const r = this.compute();
        const points = this.transform.ofPoints([
            r.p1.x,
            r.p1.y,
            r.p1.z,
            r.p2.x,
            r.p2.y,
            r.p2.z,
            r.dimStart.x,
            r.dimStart.y,
            r.dimStart.z,
            r.dimEnd.x,
            r.dimEnd.y,
            r.dimEnd.z,
            r.text.x,
            r.text.y,
            r.text.z,
        ]);
        return BoundingBox.fromNumbers(points);
    }
});
__decorate([Serializer.serialze()], DimensionNode.prototype, "type", null);
__decorate([Serializer.serialze()], DimensionNode.prototype, "p1", null);
__decorate([Serializer.serialze()], DimensionNode.prototype, "p2", null);
__decorate([Serializer.serialze()], DimensionNode.prototype, "location", null);
__decorate([Serializer.serialze()], DimensionNode.prototype, "planeOrigin", null);
__decorate([Serializer.serialze()], DimensionNode.prototype, "planeX", null);
__decorate([Serializer.serialze()], DimensionNode.prototype, "planeY", null);
__decorate([Serializer.serialze()], DimensionNode.prototype, "planeNormal", null);
__decorate([Serializer.serialze()], DimensionNode.prototype, "precision", null);
DimensionNode = DimensionNode_1 = __decorate(
    [
        Serializer.register([
            "document",
            "type",
            "p1",
            "p2",
            "location",
            "planeOrigin",
            "planeX",
            "planeY",
            "planeNormal",
            "name",
            "id",
        ]),
    ],
    DimensionNode,
);
export { DimensionNode };
