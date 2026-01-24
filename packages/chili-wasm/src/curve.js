// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Ray, XYZ, gc } from "chili-core";
import { OccGeometry } from "./geometry";
import { OcctHelper } from "./helper";
import { OccEdge } from "./shape";
export class OccCurve extends OccGeometry {
    curve;
    curveType;
    constructor(curve) {
        super(curve);
        this.curve = curve;
        this.curveType = OcctHelper.getCurveType(curve);
    }
    copy() {
        return gc((c) => {
            let newCurve = c(this.curve.copy());
            return OcctHelper.wrapCurve(newCurve.get());
        });
    }
    transformed(matrix) {
        return gc((c) => {
            let newCurve = c(this.curve.transformed(OcctHelper.convertFromMatrix(matrix)));
            return OcctHelper.wrapCurve(newCurve.get());
        });
    }
    makeEdge() {
        return new OccEdge(wasm.Edge.fromCurve(this.curve));
    }
    nearestExtrema(curve) {
        return gc((c) => {
            let result;
            if (curve instanceof OccCurve) {
                result = wasm.Curve.nearestExtremaCC(this.curve, curve.curve);
            } else if (curve instanceof Ray) {
                let line = c(wasm.Curve.makeLine(curve.location, curve.direction));
                result = wasm.Curve.nearestExtremaCC(this.curve, line.get());
            }
            if (!result) {
                return undefined;
            }
            return {
                ...result,
                p1: OcctHelper.toXYZ(result.p1),
                p2: OcctHelper.toXYZ(result.p2),
            };
        });
    }
    uniformAbscissaByLength(length) {
        return wasm.Curve.uniformAbscissaWithLength(this.curve, length).map((x) => OcctHelper.toXYZ(x));
    }
    uniformAbscissaByCount(curveCount) {
        return wasm.Curve.uniformAbscissaWithCount(this.curve, curveCount + 1).map((x) =>
            OcctHelper.toXYZ(x),
        );
    }
    length() {
        return wasm.Curve.curveLength(this.curve);
    }
    trim(u1, u2) {
        return gc((c) => {
            let trimCurve = c(wasm.Curve.trim(this.curve, u1, u2));
            return new OccTrimmedCurve(trimCurve.get());
        });
    }
    reverse() {
        this.curve.reverse();
    }
    reversed() {
        return gc((c) => {
            let newCurve = c(this.curve.reversed());
            return OcctHelper.wrapCurve(newCurve.get());
        });
    }
    isClosed() {
        return this.curve.isClosed();
    }
    period() {
        return this.curve.period();
    }
    isPeriodic() {
        return this.curve.isPeriodic();
    }
    continutity() {
        let cni = this.curve.continutity();
        return OcctHelper.convertToContinuity(cni);
    }
    nearestFromPoint(point) {
        let res = wasm.Curve.projectOrNearest(this.curve, point);
        return {
            ...res,
            point: OcctHelper.toXYZ(res.point),
        };
    }
    value(parameter) {
        return OcctHelper.toXYZ(this.curve.value(parameter));
    }
    firstParameter() {
        return this.curve.firstParameter();
    }
    lastParameter() {
        return this.curve.lastParameter();
    }
    parameter(point, tolerance) {
        return wasm.Curve.parameter(this.curve, point, tolerance);
    }
    project(point) {
        return wasm.Curve.projects(this.curve, point)
            .map((p) => new XYZ(p.x, p.y, p.z))
            .toSorted((a, b) => a.distanceTo(point) - b.distanceTo(point));
    }
    isCN(n) {
        return this.curve.isCN(n);
    }
    d0(u) {
        return gc((c) => {
            let pnt = c(new wasm.gp_Pnt(0, 0, 0));
            this.curve.d0(u, pnt);
            return OcctHelper.toXYZ(pnt);
        });
    }
    d1(u) {
        return gc((c) => {
            let pnt = c(new wasm.gp_Pnt(0, 0, 0));
            let vec = c(new wasm.gp_Vec(0, 0, 0));
            this.curve.d1(u, pnt, vec);
            return {
                point: OcctHelper.toXYZ(pnt),
                vec: OcctHelper.toXYZ(vec),
            };
        });
    }
    d2(u) {
        return gc((c) => {
            let pnt = c(new wasm.gp_Pnt(0, 0, 0));
            let vec1 = c(new wasm.gp_Vec(0, 0, 0));
            let vec2 = c(new wasm.gp_Vec(0, 0, 0));
            this.curve.d2(u, pnt, vec1, vec2);
            return {
                point: OcctHelper.toXYZ(pnt),
                vec1: OcctHelper.toXYZ(vec1),
                vec2: OcctHelper.toXYZ(vec2),
            };
        });
    }
    d3(u) {
        return gc((c) => {
            let pnt = c(new wasm.gp_Pnt(0, 0, 0));
            let vec1 = c(new wasm.gp_Vec(0, 0, 0));
            let vec2 = c(new wasm.gp_Vec(0, 0, 0));
            let vec3 = c(new wasm.gp_Vec(0, 0, 0));
            this.curve.d3(u, pnt, vec1, vec2, vec3);
            return {
                point: OcctHelper.toXYZ(pnt),
                vec1: OcctHelper.toXYZ(vec1),
                vec2: OcctHelper.toXYZ(vec2),
                vec3: OcctHelper.toXYZ(vec3),
            };
        });
    }
    dn(u, n) {
        return gc((c) => {
            return OcctHelper.toXYZ(c(this.curve.dn(u, n)));
        });
    }
}
export class OccLine extends OccCurve {
    line;
    constructor(line) {
        super(line);
        this.line = line;
    }
    get direction() {
        return gc((c) => {
            let ax = c(this.line.position());
            return OcctHelper.toXYZ(c(ax.direction()));
        });
    }
    set direction(value) {
        gc((c) => {
            this.line.setDirection(c(OcctHelper.toDir(value)));
        });
    }
    get location() {
        return gc((c) => {
            let ax = c(this.line.position());
            return OcctHelper.toXYZ(c(ax.location()));
        });
    }
    set location(value) {
        gc((c) => {
            this.line.setLocation(c(OcctHelper.toPnt(value)));
        });
    }
}
export class OccConic extends OccCurve {
    conioc;
    constructor(conioc) {
        super(conioc);
        this.conioc = conioc;
    }
    get axis() {
        return gc((c) => {
            return OcctHelper.toXYZ(c(c(this.conioc.axis()).direction()));
        });
    }
    get xAxis() {
        return gc((c) => {
            return OcctHelper.toXYZ(c(c(this.conioc.xAxis()).direction()));
        });
    }
    get yAxis() {
        return gc((c) => {
            return OcctHelper.toXYZ(c(c(this.conioc.yAxis()).direction()));
        });
    }
    eccentricity() {
        return this.conioc.eccentricity();
    }
}
export class OccCircle extends OccConic {
    circle;
    constructor(circle) {
        super(circle);
        this.circle = circle;
    }
    get center() {
        return gc((c) => {
            return OcctHelper.toXYZ(c(this.circle.location()));
        });
    }
    set center(value) {
        gc((c) => {
            this.circle.setLocation(c(OcctHelper.toPnt(value)));
        });
    }
    get radius() {
        return this.circle.radius();
    }
    set radius(value) {
        this.circle.setRadius(value);
    }
}
export class OccEllipse extends OccConic {
    ellipse;
    constructor(ellipse) {
        super(ellipse);
        this.ellipse = ellipse;
    }
    get center() {
        return gc((c) => {
            return OcctHelper.toXYZ(c(this.ellipse.location()));
        });
    }
    set center(value) {
        gc((c) => {
            this.ellipse.setLocation(c(OcctHelper.toPnt(value)));
        });
    }
    get focus1() {
        return gc((c) => OcctHelper.toXYZ(c(this.ellipse.focus1())));
    }
    get focus2() {
        return gc((c) => OcctHelper.toXYZ(c(this.ellipse.focus2())));
    }
    get majorRadius() {
        return this.ellipse.majorRadius();
    }
    set majorRadius(value) {
        this.ellipse.setMajorRadius(value);
    }
    get minorRadius() {
        return this.ellipse.minorRadius();
    }
    set minorRadius(value) {
        this.ellipse.setMinorRadius(value);
    }
}
export class OccHyperbola extends OccConic {
    hyperbola;
    constructor(hyperbola) {
        super(hyperbola);
        this.hyperbola = hyperbola;
    }
    focal() {
        return this.hyperbola.focal();
    }
    get location() {
        return gc((c) => {
            return OcctHelper.toXYZ(c(this.hyperbola.location()));
        });
    }
    set location(value) {
        gc((c) => {
            this.hyperbola.setLocation(c(OcctHelper.toPnt(value)));
        });
    }
    get focus1() {
        return gc((c) => OcctHelper.toXYZ(c(this.hyperbola.focus1())));
    }
    get focus2() {
        return gc((c) => OcctHelper.toXYZ(c(this.hyperbola.focus2())));
    }
    get majorRadius() {
        return this.hyperbola.majorRadius();
    }
    set majorRadius(value) {
        this.hyperbola.setMajorRadius(value);
    }
    get minorRadius() {
        return this.hyperbola.minorRadius();
    }
    set minorRadius(value) {
        this.hyperbola.setMinorRadius(value);
    }
}
export class OccParabola extends OccConic {
    parabola;
    constructor(parabola) {
        super(parabola);
        this.parabola = parabola;
    }
    focal() {
        return this.parabola.focal();
    }
    get focus() {
        return gc((c) => OcctHelper.toXYZ(c(this.parabola.focus())));
    }
    get directrix() {
        return gc((c) => OcctHelper.toXYZ(c(c(this.parabola.directrix().location()))));
    }
}
export class OccBoundedCurve extends OccCurve {
    boundedCurve;
    constructor(boundedCurve) {
        super(boundedCurve);
        this.boundedCurve = boundedCurve;
    }
    startPoint() {
        return gc((c) => OcctHelper.toXYZ(c(this.boundedCurve.startPoint())));
    }
    endPoint() {
        return gc((c) => OcctHelper.toXYZ(c(this.boundedCurve.endPoint())));
    }
}
export class OccTrimmedCurve extends OccBoundedCurve {
    trimmedCurve;
    constructor(trimmedCurve) {
        super(trimmedCurve);
        this.trimmedCurve = trimmedCurve;
    }
    setTrim(u1, u2) {
        this.trimmedCurve.setTrim(u1, u2, true, true);
    }
    _basisCurve;
    get basisCurve() {
        this._basisCurve ??= gc((c) => {
            let curve = c(this.trimmedCurve.basisCurve());
            return OcctHelper.wrapCurve(curve.get());
        });
        return this._basisCurve;
    }
    disposeInternal() {
        super.disposeInternal();
        if (this._basisCurve) {
            this._basisCurve.dispose();
        }
    }
}
export class OccOffsetCurve extends OccCurve {
    offsetCurve;
    constructor(offsetCurve) {
        super(offsetCurve);
        this.offsetCurve = offsetCurve;
    }
    _basisCurve;
    get basisCurve() {
        this._basisCurve ??= gc((c) => {
            let curve = c(this.offsetCurve.basisCurve());
            return OcctHelper.wrapCurve(curve.get());
        });
        return this._basisCurve;
    }
    offset() {
        return this.offsetCurve.offset();
    }
    direction() {
        return gc((c) => OcctHelper.toXYZ(c(this.offsetCurve.direction())));
    }
    disposeInternal() {
        super.disposeInternal();
        if (this._basisCurve) {
            this._basisCurve.dispose();
        }
    }
}
export class OccBezierCurve extends OccBoundedCurve {
    bezier;
    constructor(bezier) {
        super(bezier);
        this.bezier = bezier;
    }
    weight(index) {
        return this.bezier.weight(index);
    }
    insertPoleAfter(index, point, weight) {
        gc((c) => {
            if (weight === undefined) {
                this.bezier.insertPoleAfter(index, c(OcctHelper.toPnt(point)));
            } else {
                this.bezier.insertPoleAfterWithWeight(index, c(OcctHelper.toPnt(point)), weight);
            }
        });
    }
    insertPoleBefore(index, point, weight) {
        gc((c) => {
            if (weight === undefined) {
                this.bezier.insertPoleBefore(index, c(OcctHelper.toPnt(point)));
            } else {
                this.bezier.insertPoleBeforeWithWeight(index, c(OcctHelper.toPnt(point)), weight);
            }
        });
    }
    removePole(index) {
        this.bezier.removePole(index);
    }
    setPole(index, point, weight) {
        gc((c) => {
            if (weight === undefined) {
                this.bezier.setPole(index, c(OcctHelper.toPnt(point)));
            } else {
                this.bezier.setPoleWithWeight(index, c(OcctHelper.toPnt(point)), weight);
            }
        });
    }
    setWeight(index, weight) {
        this.setWeight(index, weight);
    }
    nbPoles() {
        return this.bezier.nbPoles();
    }
    pole(index) {
        return gc((c) => OcctHelper.toXYZ(c(this.bezier.pole(index))));
    }
    degree() {
        return this.bezier.degree();
    }
    poles() {
        return gc((c) => {
            let result = [];
            let pls = c(this.bezier.getPoles());
            for (let i = 1; i <= pls.length(); i++) {
                result.push(OcctHelper.toXYZ(c(pls.value(i))));
            }
            return result;
        });
    }
}
export class OccBSplineCurve extends OccBoundedCurve {
    bspline;
    constructor(bspline) {
        super(bspline);
        this.bspline = bspline;
    }
    nbKnots() {
        return this.bspline.nbKnots();
    }
    knot(index) {
        return this.bspline.knot(index);
    }
    setKnot(index, value) {
        this.bspline.setKnot(index, value);
    }
    nbPoles() {
        return this.bspline.nbPoles();
    }
    pole(index) {
        return gc((c) => OcctHelper.toXYZ(c(this.bspline.pole(index))));
    }
    poles() {
        return gc((c) => {
            let result = [];
            let pls = c(this.bspline.getPoles());
            for (let i = 1; i <= pls.length(); i++) {
                result.push(OcctHelper.toXYZ(c(pls.value(i))));
            }
            return result;
        });
    }
    weight(index) {
        return this.bspline.weight(index);
    }
    setWeight(index, value) {
        this.bspline.setWeight(index, value);
    }
    degree() {
        return this.bspline.degree();
    }
}
