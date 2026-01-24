// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { XYZ, gc } from "chili-core";
import { OccCurve } from "./curve";
import { OccGeometry } from "./geometry";
import { OcctHelper } from "./helper";
export class OccSurface extends OccGeometry {
    surface;
    constructor(surface) {
        super(surface);
        this.surface = surface;
    }
    copy() {
        return gc((c) => {
            let s = c(this.surface.copy());
            return OcctHelper.wrapSurface(s.get());
        });
    }
    transformed(matrix) {
        return gc((c) => {
            let s = c(this.surface.transformed(OcctHelper.convertFromMatrix(matrix)));
            return OcctHelper.wrapSurface(s.get());
        });
    }
    projectCurve(curve) {
        return gc((c) => {
            if (!(curve instanceof OccCurve)) return undefined;
            let handleCurve = c(wasm.Surface.projectCurve(this.surface, curve.curve));
            return OcctHelper.wrapCurve(handleCurve.get());
        });
    }
    project(point) {
        return wasm.Surface.projectPoint(this.surface, point)
            .map((p) => new XYZ(p.x, p.y, p.z))
            .toSorted((a, b) => a.distanceTo(point) - b.distanceTo(point));
    }
    isPlanar() {
        return wasm.Surface.isPlanar(this.surface);
    }
    parameter(point, maxDistance) {
        return wasm.Surface.parameters(this.surface, point, maxDistance);
    }
    nearestPoint(point) {
        let result = wasm.Surface.nearestPoint(this.surface, point);
        if (result) {
            return [OcctHelper.toXYZ(result.point), result.parameter];
        }
        return undefined;
    }
    continuity() {
        return OcctHelper.convertToContinuity(this.surface.continuity());
    }
    uIso(u) {
        return gc((c) => {
            let curve = c(this.surface.uIso(u));
            return OcctHelper.wrapCurve(curve.get());
        });
    }
    vIso(v) {
        return gc((c) => {
            let curve = c(this.surface.vIso(v));
            return OcctHelper.wrapCurve(curve.get());
        });
    }
    isUClosed() {
        return this.surface.isUClosed();
    }
    isVClosed() {
        return this.surface.isVClosed();
    }
    isUPreiodic() {
        return this.surface.isUPeriodic();
    }
    isVPreiodic() {
        return this.surface.isVPeriodic();
    }
    vPeriod() {
        return this.surface.vPeriod();
    }
    uPeriod() {
        return this.surface.uPeriod();
    }
    bounds() {
        return wasm.Surface.bounds(this.surface);
    }
    isCNu(n) {
        return this.surface.isCNu(n);
    }
    isCNv(n) {
        return this.surface.isCNv(n);
    }
    d0(u, v) {
        return gc((c) => {
            let pnt = c(new wasm.gp_Pnt(0, 0, 0));
            this.surface.d0(u, v, pnt);
            return OcctHelper.toXYZ(pnt);
        });
    }
    d1(u, v) {
        return gc((c) => {
            let pnt = c(new wasm.gp_Pnt(0, 0, 0));
            let d1u = c(new wasm.gp_Vec(0, 0, 0));
            let d1v = c(new wasm.gp_Vec(0, 0, 0));
            this.surface.d1(u, v, pnt, d1u, d1v);
            return {
                point: OcctHelper.toXYZ(pnt),
                d1u: OcctHelper.toXYZ(d1u),
                d1v: OcctHelper.toXYZ(d1v),
            };
        });
    }
    d2(u, v) {
        return gc((c) => {
            let pnt = c(new wasm.gp_Pnt(0, 0, 0));
            let d1u = c(new wasm.gp_Vec(0, 0, 0));
            let d1v = c(new wasm.gp_Vec(0, 0, 0));
            let d2u = c(new wasm.gp_Vec(0, 0, 0));
            let d2v = c(new wasm.gp_Vec(0, 0, 0));
            let d2uv = c(new wasm.gp_Vec(0, 0, 0));
            this.surface.d2(u, v, pnt, d1u, d1v, d2u, d2v, d2uv);
            return {
                point: OcctHelper.toXYZ(pnt),
                d1u: OcctHelper.toXYZ(d1u),
                d1v: OcctHelper.toXYZ(d1v),
                d2u: OcctHelper.toXYZ(d2u),
                d2v: OcctHelper.toXYZ(d2v),
                d2uv: OcctHelper.toXYZ(d2uv),
            };
        });
    }
    d3(u, v) {
        return gc((c) => {
            let pnt = c(new wasm.gp_Pnt(0, 0, 0));
            let d1u = c(new wasm.gp_Vec(0, 0, 0));
            let d1v = c(new wasm.gp_Vec(0, 0, 0));
            let d2u = c(new wasm.gp_Vec(0, 0, 0));
            let d2v = c(new wasm.gp_Vec(0, 0, 0));
            let d2uv = c(new wasm.gp_Vec(0, 0, 0));
            let d3u = c(new wasm.gp_Vec(0, 0, 0));
            let d3v = c(new wasm.gp_Vec(0, 0, 0));
            let d3uuv = c(new wasm.gp_Vec(0, 0, 0));
            let d3uvv = c(new wasm.gp_Vec(0, 0, 0));
            this.surface.d3(u, v, pnt, d1u, d1v, d2u, d2v, d2uv, d3u, d3v, d3uuv, d3uvv);
            return {
                point: OcctHelper.toXYZ(pnt),
                d1u: OcctHelper.toXYZ(d1u),
                d1v: OcctHelper.toXYZ(d1v),
                d2u: OcctHelper.toXYZ(d2u),
                d2v: OcctHelper.toXYZ(d2v),
                d2uv: OcctHelper.toXYZ(d2uv),
                d3u: OcctHelper.toXYZ(d3u),
                d3v: OcctHelper.toXYZ(d3v),
                d3uuv: OcctHelper.toXYZ(d3uuv),
                d3uvv: OcctHelper.toXYZ(d3uvv),
            };
        });
    }
    dn(u, v, nu, nv) {
        return gc((c) => {
            let vec = c(this.surface.dn(u, v, nu, nv));
            return OcctHelper.toXYZ(vec);
        });
    }
    value(u, v) {
        return gc((c) => {
            let pnt = c(this.surface.value(u, v));
            return OcctHelper.toXYZ(pnt);
        });
    }
}
export class OccPlateSurface extends OccSurface {
    plateSurface;
    constructor(plateSurface) {
        super(plateSurface);
        this.plateSurface = plateSurface;
    }
    setBounds(u1, u2, v1, v2) {
        this.plateSurface.setBounds(u1, u2, v1, v2);
    }
}
export class OccBoundedSurface extends OccSurface {}
export class OccElementarySurface extends OccSurface {
    elementarySurface;
    constructor(elementarySurface) {
        super(elementarySurface);
        this.elementarySurface = elementarySurface;
    }
    get location() {
        return gc((c) => OcctHelper.toXYZ(c(this.elementarySurface.location())));
    }
    set location(value) {
        gc((c) => {
            this.elementarySurface.setLocation(c(OcctHelper.toPnt(value)));
        });
    }
    get axis() {
        return gc((c) => {
            return OcctHelper.toXYZ(c(c(this.elementarySurface.axis()).direction()));
        });
    }
    set axis(value) {
        gc((c) => {
            let pnt = c(this.elementarySurface.location());
            let axis = c(new wasm.gp_Ax1(pnt, c(OcctHelper.toDir(value))));
            this.elementarySurface.setAxis(axis);
        });
    }
    get coordinates() {
        return gc((c) => {
            return OcctHelper.fromAx23(c(this.elementarySurface.position()));
        });
    }
    set coordinates(value) {
        gc((c) => {
            this.elementarySurface.setPosition(c(OcctHelper.toAx3(value)));
        });
    }
}
export class OccOffsetSurface extends OccSurface {
    offsetSurface;
    constructor(offsetSurface) {
        super(offsetSurface);
        this.offsetSurface = offsetSurface;
    }
    get offset() {
        return this.offsetSurface.offset();
    }
    set offset(value) {
        this.offsetSurface.setOffsetValue(value);
    }
    get basisSurface() {
        return gc((c) => {
            let handleSurface = c(this.offsetSurface.basisSurface());
            return OcctHelper.wrapSurface(handleSurface.get());
        });
    }
    set basisSurface(value) {
        gc((c) => {
            if (value instanceof OccSurface) {
                let handleSurface = c(new wasm.Handle_Geom_Surface(value.surface));
                this.offsetSurface.setBasisSurface(handleSurface, true);
            }
            throw new Error("Invalid surface type");
        });
    }
}
export class OccSweptSurface extends OccSurface {
    sweptSurface;
    constructor(sweptSurface) {
        super(sweptSurface);
        this.sweptSurface = sweptSurface;
    }
    direction() {
        return gc((c) => {
            return OcctHelper.toXYZ(c(this.sweptSurface.direction()));
        });
    }
    basisCurve() {
        return gc((c) => {
            let handleCurve = this.sweptSurface.basisCurve();
            return OcctHelper.wrapCurve(handleCurve.get());
        });
    }
}
export class OccCompositeSurface extends OccSurface {
    constructor(compositeSurface) {
        super(compositeSurface);
    }
}
export class OccBSplineSurface extends OccSurface {
    bsplineSurface;
    constructor(bsplineSurface) {
        super(bsplineSurface);
        this.bsplineSurface = bsplineSurface;
    }
}
export class OccBezierSurface extends OccSurface {
    bezierSurface;
    constructor(bezierSurface) {
        super(bezierSurface);
        this.bezierSurface = bezierSurface;
    }
}
export class OccRectangularSurface extends OccSurface {
    rectangularSurface;
    constructor(rectangularSurface) {
        super(rectangularSurface);
        this.rectangularSurface = rectangularSurface;
    }
    basisSurface() {
        return gc((c) => {
            let handleSurface = c(this.rectangularSurface.basisSurface());
            return OcctHelper.wrapSurface(handleSurface.get());
        });
    }
    setUTrim(u1, u2) {
        this.rectangularSurface.setTrim2(u1, u2, true, true);
    }
    setVTrim(v1, v2) {
        this.rectangularSurface.setTrim2(v1, v2, false, true);
    }
    setTrim(u1, u2, v1, v2) {
        this.rectangularSurface.setTrim(u1, u2, v1, v2, true, true);
    }
}
export class OccConicalSurface extends OccElementarySurface {
    conicalSurface;
    constructor(conicalSurface) {
        super(conicalSurface);
        this.conicalSurface = conicalSurface;
    }
    get semiAngle() {
        return this.conicalSurface.semiAngle();
    }
    set semiAngle(value) {
        this.conicalSurface.setSemiAngle(value);
    }
    setRadius(value) {
        return this.conicalSurface.setRadius(value);
    }
    apex() {
        return gc((c) => {
            return OcctHelper.toXYZ(c(this.conicalSurface.apex()));
        });
    }
    refRadius() {
        return this.conicalSurface.refRadius();
    }
}
export class OccCylindricalSurface extends OccElementarySurface {
    cylindricalSurface;
    constructor(cylindricalSurface) {
        super(cylindricalSurface);
        this.cylindricalSurface = cylindricalSurface;
    }
    get radius() {
        return this.cylindricalSurface.radius();
    }
    set radius(value) {
        this.cylindricalSurface.setRadius(value);
    }
}
export class OccPlane extends OccElementarySurface {
    geom_plane;
    constructor(geom_plane) {
        super(geom_plane);
        this.geom_plane = geom_plane;
    }
    get plane() {
        return gc((c) => {
            return OcctHelper.fromPln(c(this.geom_plane.pln()));
        });
    }
    set plane(value) {
        gc((c) => {
            this.geom_plane.setPln(c(OcctHelper.toPln(value)));
        });
    }
}
export class OccSphericalSurface extends OccElementarySurface {
    sphericalSurface;
    constructor(sphericalSurface) {
        super(sphericalSurface);
        this.sphericalSurface = sphericalSurface;
    }
    get radius() {
        return this.sphericalSurface.radius();
    }
    set radius(value) {
        this.sphericalSurface.setRadius(value);
    }
    area() {
        return this.sphericalSurface.area();
    }
    volume() {
        return this.sphericalSurface.volume();
    }
}
export class OccToroidalSurface extends OccElementarySurface {
    toroidalSurface;
    constructor(toroidalSurface) {
        super(toroidalSurface);
        this.toroidalSurface = toroidalSurface;
    }
    area() {
        return this.toroidalSurface.area();
    }
    volume() {
        return this.toroidalSurface.volume();
    }
    get majorRadius() {
        return this.toroidalSurface.majorRadius();
    }
    set majorRadius(value) {
        this.toroidalSurface.setMajorRadius(value);
    }
    get minorRadius() {
        return this.toroidalSurface.minorRadius();
    }
    set minorRadius(value) {
        this.toroidalSurface.setMinorRadius(value);
    }
}
export class OccSurfaceOfLinearExtrusion extends OccSweptSurface {
    surfaceOfLinearExtrusion;
    constructor(surfaceOfLinearExtrusion) {
        super(surfaceOfLinearExtrusion);
        this.surfaceOfLinearExtrusion = surfaceOfLinearExtrusion;
    }
    setDirection(direction) {
        gc((c) => {
            this.surfaceOfLinearExtrusion.setDirection(c(OcctHelper.toDir(direction)));
        });
    }
    setBasisCurve(curve) {
        if (!(curve instanceof OccCurve)) {
            throw new Error("curve must be an OccCurve");
        }
        let handleCurve = new wasm.Handle_Geom_Curve(curve.curve);
        this.surfaceOfLinearExtrusion.setBasisCurve(handleCurve);
        handleCurve.delete();
    }
}
export class OccSurfaceOfRevolution extends OccSweptSurface {
    surfaceOfRevolution;
    constructor(surfaceOfRevolution) {
        super(surfaceOfRevolution);
        this.surfaceOfRevolution = surfaceOfRevolution;
    }
    get location() {
        return gc((c) => {
            return OcctHelper.toXYZ(c(this.surfaceOfRevolution.location()));
        });
    }
    set location(value) {
        gc((c) => {
            this.surfaceOfRevolution.setLocation(c(OcctHelper.toPnt(value)));
        });
    }
    referencePlane() {
        return gc((c) => {
            return OcctHelper.fromAx23(c(this.surfaceOfRevolution.referencePlane()));
        });
    }
    setDirection(direction) {
        gc((c) => {
            this.surfaceOfRevolution.setDirection(c(OcctHelper.toDir(direction)));
        });
    }
    setBasisCurve(curve) {
        if (!(curve instanceof OccCurve)) {
            throw new Error("curve must be an OccCurve");
        }
        let handleCurve = new wasm.Handle_Geom_Curve(curve.curve);
        this.surfaceOfRevolution.setBasisCurve(handleCurve);
        handleCurve.delete();
    }
}
