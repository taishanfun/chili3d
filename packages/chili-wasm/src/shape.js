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
var OccShape_1, OccEdge_1;
import {
    gc,
    Id,
    IDisposable,
    LineType,
    Logger,
    MathUtils,
    Plane,
    Ray,
    Result,
    Serializer,
    VisualConfig,
} from "chili-core";
import { OccShapeConverter } from "./converter";
import { OccCurve, OccTrimmedCurve } from "./curve";
import { OcctHelper } from "./helper";
import { Mesher } from "./mesher";
let OccShape = (OccShape_1 = class OccShape {
    static serialize(target) {
        return {
            shape: new OccShapeConverter().convertToBrep(target).value,
            id: target.id,
        };
    }
    static deserialize(shape, id) {
        let tshape = new OccShapeConverter().convertFromBrep(shape).value;
        tshape._id = id;
        return tshape;
    }
    shapeType;
    _mesh;
    get mesh() {
        this._mesh ??= new Mesher(this);
        return this._mesh;
    }
    _shape;
    get shape() {
        return this._shape;
    }
    _id;
    get id() {
        return this._id;
    }
    get matrix() {
        return gc((c) => {
            return OcctHelper.convertToMatrix(c(c(this.shape.getLocation()).transformation()));
        });
    }
    set matrix(matrix) {
        gc((c) => {
            let location = c(new wasm.TopLoc_Location(c(OcctHelper.convertFromMatrix(matrix))));
            this._shape.setLocation(location, false);
            this.onTransformChanged();
        });
    }
    constructor(shape, id) {
        this._id = id ?? Id.generate();
        this._shape = shape;
        this.shapeType = OcctHelper.getShapeType(shape);
    }
    transformed(matrix) {
        return gc((c) => {
            const location = c(new wasm.TopLoc_Location(c(OcctHelper.convertFromMatrix(matrix))));
            const shape = this._shape.located(location, false); // TODO: check if this is correct
            return OcctHelper.wrapShape(shape);
        });
    }
    transformedMul(matrix) {
        return gc((c) => {
            const location = c(new wasm.TopLoc_Location(c(OcctHelper.convertFromMatrix(matrix))));
            const shape = this._shape.moved(location, false); // TODO: check if this is correct
            return OcctHelper.wrapShape(shape);
        });
    }
    onTransformChanged() {
        if (this._mesh) {
            Logger.warn("Shape matrix changed, mesh will be recreated");
            this._mesh = undefined;
        }
    }
    edgesMeshPosition() {
        const occMesher = new wasm.Mesher(this.shape, 0.005);
        const position = occMesher.edgesMeshPosition();
        occMesher.delete();
        return {
            lineType: LineType.Solid,
            position: new Float32Array(position),
            range: [],
            color: VisualConfig.defaultEdgeColor,
        };
    }
    clone() {
        return OcctHelper.wrapShape(wasm.Shape.clone(this._shape));
    }
    isClosed() {
        return wasm.Shape.isClosed(this.shape);
    }
    isNull() {
        return this.shape.isNull();
    }
    isEqual(other) {
        if (other instanceof OccShape_1) {
            return this.shape.isEqual(other.shape);
        }
        return false;
    }
    isSame(other) {
        if (other instanceof OccShape_1) {
            return this.shape.isSame(other.shape);
        }
        return false;
    }
    isPartner(other) {
        if (other instanceof OccShape_1) {
            return this.shape.isPartner(other.shape);
        }
        return false;
    }
    orientation() {
        return OcctHelper.getOrientation(this.shape);
    }
    findAncestor(ancestorType, fromShape) {
        if (fromShape instanceof OccShape_1) {
            return wasm.Shape.findAncestor(
                fromShape.shape,
                this.shape,
                OcctHelper.getShapeEnum(ancestorType),
            ).map((x) => OcctHelper.wrapShape(x));
        }
        return [];
    }
    findSubShapes(subshapeType) {
        return wasm.Shape.findSubShapes(this.shape, OcctHelper.getShapeEnum(subshapeType)).map((x) =>
            OcctHelper.wrapShape(x),
        );
    }
    iterShape() {
        let subShape = wasm.Shape.iterShape(this.shape);
        if (subShape.length === 1 && subShape[0].shapeType() === this.shape.shapeType()) {
            subShape = wasm.Shape.iterShape(subShape[0]);
        }
        return subShape.map((x) => OcctHelper.wrapShape(x));
    }
    section(shape) {
        if (shape instanceof OccShape_1) {
            let section = wasm.Shape.sectionSS(this.shape, shape.shape);
            return OcctHelper.wrapShape(section);
        }
        if (shape instanceof Plane) {
            let section = wasm.Shape.sectionSP(this.shape, {
                location: shape.origin,
                direction: shape.normal,
                xDirection: shape.xvec,
            });
            return OcctHelper.wrapShape(section);
        }
        throw new Error("Unsupported type");
    }
    split(shapes) {
        let occShapes = shapes.map((x) => {
            if (x instanceof OccShape_1) {
                return x.shape;
            }
            throw new Error("Unsupported type");
        });
        return OcctHelper.wrapShape(wasm.Shape.splitShapes([this.shape], occShapes));
    }
    reserve() {
        this.shape.reverse();
    }
    hlr(position, direction, xDir) {
        return gc((c) => {
            const shape = wasm.Shape.hlr(
                this.shape,
                c(OcctHelper.toPnt(position)),
                c(OcctHelper.toDir(direction)),
                c(OcctHelper.toDir(xDir)),
            );
            return OcctHelper.wrapShape(shape);
        });
    }
    #isDisposed = false;
    dispose = () => {
        if (!this.#isDisposed) {
            this.#isDisposed = true;
            this.disposeInternal();
        }
    };
    disposeInternal() {
        this._shape.nullify();
        this._shape.delete();
        this._shape = null;
        if (this._mesh && IDisposable.isDisposable(this._mesh)) {
            this._mesh.dispose();
            this._mesh = null;
        }
    }
});
OccShape = OccShape_1 = __decorate(
    [Serializer.register(["shape", "id"], OccShape.deserialize, OccShape.serialize)],
    OccShape,
);
export { OccShape };
let OccVertex = class OccVertex extends OccShape {
    vertex;
    constructor(shape, id) {
        super(shape, id);
        this.vertex = shape;
    }
};
OccVertex = __decorate(
    [Serializer.register(["shape", "id"], OccShape.deserialize, OccShape.serialize)],
    OccVertex,
);
export { OccVertex };
let OccEdge = (OccEdge_1 = class OccEdge extends OccShape {
    _edge;
    get edge() {
        return this._edge;
    }
    constructor(shape, id) {
        super(shape, id);
        this._edge = shape;
    }
    update(curve) {
        if (!(curve instanceof OccCurve)) {
            throw new Error("Invalid curve");
        }
        this._shape = wasm.Edge.fromCurve(curve.curve);
        this._mesh = undefined;
    }
    intersect(other) {
        return gc((c) => {
            let edge = undefined;
            if (other instanceof OccEdge_1) {
                edge = other.edge;
            }
            if (other instanceof Ray) {
                let line = c(wasm.Curve.makeLine(other.location, other.direction));
                edge = c(wasm.Edge.fromCurve(line.get()));
            }
            if (edge === undefined) {
                throw new Error("Unsupported type");
            }
            return wasm.Edge.intersect(this.edge, edge).map((x) => ({
                parameter: x.parameter,
                point: OcctHelper.toXYZ(x.point),
            }));
        });
    }
    length() {
        return wasm.Edge.curveLength(this.edge);
    }
    _curve;
    get curve() {
        this._curve ??= gc((c) => {
            let curve = c(wasm.Edge.curve(this.edge));
            return new OccTrimmedCurve(curve.get());
        });
        return this._curve;
    }
    onTransformChanged() {
        super.onTransformChanged();
        if (this._curve) {
            this._curve.dispose();
            this._curve = undefined;
        }
    }
    offset(distance, dir) {
        return gc((c) => {
            let occDir = c(OcctHelper.toDir(dir));
            let edge = wasm.Edge.offset(this.edge, occDir, distance);
            if (edge.isNull()) {
                return Result.err("Offset failed");
            }
            return Result.ok(OcctHelper.wrapShape(edge));
        });
    }
    trim(start, end) {
        let newEdge = wasm.Edge.trim(this.edge, start, end);
        return new OccEdge_1(newEdge);
    }
    disposeInternal() {
        super.disposeInternal();
        if (this._curve && IDisposable.isDisposable(this._curve)) {
            this._curve.dispose();
            this._curve = null;
        }
    }
});
OccEdge = OccEdge_1 = __decorate(
    [Serializer.register(["shape", "id"], OccShape.deserialize, OccShape.serialize)],
    OccEdge,
);
export { OccEdge };
let OccWire = class OccWire extends OccShape {
    wire;
    constructor(wire, id) {
        super(wire, id);
        this.wire = wire;
    }
    edgeLoop() {
        return wasm.Wire.edgeLoop(this.wire).map((x) => OcctHelper.wrapShape(x));
    }
    toFace() {
        let face = wasm.Wire.makeFace(this.wire);
        if (face.isNull()) {
            return Result.err("To face failed");
        }
        return Result.ok(new OccFace(face));
    }
    offset(distance, joinType) {
        let offseted = wasm.Wire.offset(this.wire, distance, OcctHelper.getJoinType(joinType));
        if (offseted.isNull()) {
            return Result.err("Offset failed");
        }
        return Result.ok(OcctHelper.wrapShape(offseted));
    }
};
OccWire = __decorate(
    [Serializer.register(["shape", "id"], OccShape.deserialize, OccShape.serialize)],
    OccWire,
);
export { OccWire };
let OccFace = class OccFace extends OccShape {
    face;
    constructor(face, id) {
        super(face, id);
        this.face = face;
    }
    area() {
        return wasm.Face.area(this.face);
    }
    normal(u, v) {
        return gc((c) => {
            let pnt = c(new wasm.gp_Pnt(0, 0, 0));
            let normal = c(new wasm.gp_Vec(0, 0, 0));
            wasm.Face.normal(this.shape, u, v, pnt, normal);
            return [OcctHelper.toXYZ(pnt), OcctHelper.toXYZ(normal)];
        });
    }
    outerWire() {
        return new OccWire(wasm.Face.outerWire(this.face));
    }
    surface() {
        return gc((c) => {
            let handleSurface = c(wasm.Face.surface(this.face));
            return OcctHelper.wrapSurface(handleSurface.get());
        });
    }
    segmentsOfEdgeOnFace(edge) {
        if (edge instanceof OccEdge) {
            let domain = wasm.Face.curveOnSurface(this.face, edge.edge);
            if (MathUtils.allEqualZero(domain.start, domain.end)) {
                return undefined;
            }
            return domain;
        }
        return undefined;
    }
};
OccFace = __decorate(
    [Serializer.register(["shape", "id"], OccShape.deserialize, OccShape.serialize)],
    OccFace,
);
export { OccFace };
let OccShell = class OccShell extends OccShape {};
OccShell = __decorate(
    [Serializer.register(["shape", "id"], OccShape.deserialize, OccShape.serialize)],
    OccShell,
);
export { OccShell };
let OccSolid = class OccSolid extends OccShape {
    solid;
    constructor(solid, id) {
        super(solid, id);
        this.solid = solid;
    }
    volume() {
        return wasm.Solid.volume(this.solid);
    }
};
OccSolid = __decorate(
    [Serializer.register(["shape", "id"], OccShape.deserialize, OccShape.serialize)],
    OccSolid,
);
export { OccSolid };
let OccCompSolid = class OccCompSolid extends OccShape {};
OccCompSolid = __decorate(
    [Serializer.register(["shape", "id"], OccShape.deserialize, OccShape.serialize)],
    OccCompSolid,
);
export { OccCompSolid };
let OccCompound = class OccCompound extends OccShape {};
OccCompound = __decorate(
    [Serializer.register(["shape", "id"], OccShape.deserialize, OccShape.serialize)],
    OccCompound,
);
export { OccCompound };
export class OccSubEdgeShape extends OccEdge {
    parent;
    index;
    get mesh() {
        throw new Error("Method not implemented.");
    }
    constructor(parent, edge, index, id) {
        super(edge, id);
        this.parent = parent;
        this.index = index;
    }
}
export class OccSubFaceShape extends OccFace {
    parent;
    index;
    get mesh() {
        throw new Error("Method not implemented.");
    }
    constructor(parent, face, index, id) {
        super(face, id);
        this.parent = parent;
        this.index = index;
    }
}
