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
var Plane_1;
import { Serializer } from "../serialize";
import { MathUtils } from "./mathUtils";
import { XYZ } from "./xyz";
let Plane = class Plane {
    static {
        Plane_1 = this;
    }
    static XY = new Plane_1(XYZ.zero, XYZ.unitZ, XYZ.unitX);
    static YZ = new Plane_1(XYZ.zero, XYZ.unitX, XYZ.unitY);
    static ZX = new Plane_1(XYZ.zero, XYZ.unitY, XYZ.unitZ);
    origin;
    /**
     * unit vector
     */
    normal;
    xvec;
    yvec;
    constructor(origin, normal, xvec) {
        this.origin = origin;
        let n = normal.normalize(),
            x = xvec.normalize();
        if (n === undefined || n.isEqualTo(XYZ.zero)) {
            throw new Error("normal can not be zero");
        }
        if (x === undefined || x.isEqualTo(XYZ.zero)) {
            throw new Error("xDirector can not be zero");
        }
        if (n.isParallelTo(x)) {
            throw new Error("xDirector can not parallel normal");
        }
        this.normal = n;
        this.xvec = x;
        this.yvec = n.cross(x).normalize();
    }
    translateTo(origin) {
        return new Plane_1(origin, this.normal, this.xvec);
    }
    project(point) {
        const vector = point.sub(this.origin);
        const dot = vector.dot(this.normal);
        return this.origin.add(vector.sub(this.normal.multiply(dot)));
    }
    transformed(matrix) {
        const location = matrix.ofPoint(this.origin);
        const x = matrix.ofVector(this.xvec);
        const normal = matrix.ofVector(this.normal);
        return new Plane_1(location, normal, x);
    }
    intersect(ray, containsExtension = true) {
        const vec = this.origin.sub(ray.location);
        if (vec.isEqualTo(XYZ.zero)) return this.origin;
        const len = vec.dot(this.normal);
        const dot = ray.direction.dot(this.normal);
        if (MathUtils.almostEqual(dot, 0)) return MathUtils.almostEqual(len, 0) ? ray.location : undefined;
        const t = len / dot;
        if (!containsExtension && t < 0) return undefined;
        return ray.location.add(ray.direction.multiply(t));
    }
    projectDistance(p1, p2) {
        let dp1 = this.project(p1);
        let dp2 = this.project(p2);
        return dp1.distanceTo(dp2);
    }
};
__decorate([Serializer.serialze()], Plane.prototype, "origin", void 0);
__decorate([Serializer.serialze()], Plane.prototype, "normal", void 0);
__decorate([Serializer.serialze()], Plane.prototype, "xvec", void 0);
Plane = Plane_1 = __decorate([Serializer.register(["origin", "normal", "xvec"])], Plane);
export { Plane };
