// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { IDocument } from "../document";
import { Id } from "../foundation";
import { I18nKeys } from "../i18n";
import { BoundingBox, Matrix4, XYZ } from "../math";
import { Serializer } from "../serialize";
import { VisualNode } from "./visualNode";

export type DimensionType = "horizontal" | "vertical" | "aligned";

export type DimensionComputed = {
    value: number;
    p1: XYZ;
    p2: XYZ;
    dimStart: XYZ;
    dimEnd: XYZ;
    text: XYZ;
};

@Serializer.register([
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
])
export class DimensionNode extends VisualNode {
    override display(): I18nKeys {
        return "body.dimensionNode";
    }

    @Serializer.serialze()
    get type(): DimensionType {
        return this.getPrivateValue("type", "horizontal");
    }
    set type(value: DimensionType) {
        this.setProperty("type", value, () => this.document.visual.context.redrawNode([this]));
    }

    @Serializer.serialze()
    get p1(): XYZ {
        return this.getPrivateValue("p1", XYZ.zero);
    }
    set p1(value: XYZ) {
        this.setProperty("p1", value, () => this.document.visual.context.redrawNode([this]), {
            equals: (l, r) => l.isEqualTo(r),
        });
    }

    @Serializer.serialze()
    get p2(): XYZ {
        return this.getPrivateValue("p2", XYZ.zero);
    }
    set p2(value: XYZ) {
        this.setProperty("p2", value, () => this.document.visual.context.redrawNode([this]), {
            equals: (l, r) => l.isEqualTo(r),
        });
    }

    @Serializer.serialze()
    get location(): XYZ {
        return this.getPrivateValue("location", XYZ.zero);
    }
    set location(value: XYZ) {
        this.setProperty("location", value, () => this.document.visual.context.redrawNode([this]), {
            equals: (l, r) => l.isEqualTo(r),
        });
    }

    @Serializer.serialze()
    get planeOrigin(): XYZ {
        return this.getPrivateValue("planeOrigin", XYZ.zero);
    }
    set planeOrigin(value: XYZ) {
        this.setProperty("planeOrigin", value, () => this.document.visual.context.redrawNode([this]), {
            equals: (l, r) => l.isEqualTo(r),
        });
    }

    @Serializer.serialze()
    get planeX(): XYZ {
        return this.getPrivateValue("planeX", XYZ.unitX);
    }
    set planeX(value: XYZ) {
        this.setProperty("planeX", value, () => this.document.visual.context.redrawNode([this]), {
            equals: (l, r) => l.isEqualTo(r),
        });
    }

    @Serializer.serialze()
    get planeY(): XYZ {
        return this.getPrivateValue("planeY", XYZ.unitY);
    }
    set planeY(value: XYZ) {
        this.setProperty("planeY", value, () => this.document.visual.context.redrawNode([this]), {
            equals: (l, r) => l.isEqualTo(r),
        });
    }

    @Serializer.serialze()
    get planeNormal(): XYZ {
        return this.getPrivateValue("planeNormal", XYZ.unitZ);
    }
    set planeNormal(value: XYZ) {
        this.setProperty("planeNormal", value, () => this.document.visual.context.redrawNode([this]), {
            equals: (l, r) => l.isEqualTo(r),
        });
    }

    @Serializer.serialze()
    get precision(): number {
        return this.getPrivateValue("precision", 2);
    }
    set precision(value: number) {
        this.setProperty("precision", value, () => this.document.visual.context.redrawNode([this]));
    }

    constructor(
        document: IDocument,
        type: DimensionType,
        p1: XYZ,
        p2: XYZ,
        location: XYZ,
        planeOrigin: XYZ,
        planeX: XYZ,
        planeY: XYZ,
        planeNormal: XYZ,
        name: string = "Dimension",
        id: string = Id.generate(),
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

    static fromWorld(
        document: IDocument,
        type: DimensionType,
        p1World: XYZ,
        p2World: XYZ,
        locationWorld: XYZ,
        plane: { origin: XYZ; xvec: XYZ; yvec: XYZ; normal: XYZ },
        name?: string,
        id?: string,
    ) {
        const transform = Matrix4.fromTranslation(p1World.x, p1World.y, p1World.z);
        const node = new DimensionNode(
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

    formatValue(value: number = this.compute().value): string {
        return value.toFixed(this.precision);
    }

    compute(): DimensionComputed {
        const origin = this.planeOrigin;
        const xvec = this.planeX;
        const yvec = this.planeY;

        const toXY = (p: XYZ) => {
            const v = p.sub(origin);
            return { x: v.dot(xvec), y: v.dot(yvec) };
        };

        const fromXY = (x: number, y: number) => {
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

    override boundingBox(): BoundingBox | undefined {
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
}
