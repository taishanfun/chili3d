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
import { Serializer } from "../serialize";
import { Plane } from "./plane";
import { XYZ } from "./xyz";
let Ray = class Ray {
    location;
    /**
     * unit vector
     */
    direction;
    constructor(location, direction) {
        this.location = location;
        const n = direction.normalize();
        if (n === undefined || n.isEqualTo(XYZ.zero)) {
            throw new Error("direction can not be zero");
        }
        this.direction = n;
    }
    intersect(right, tolerance = 1e-6) {
        if (this.direction.isParallelTo(right.direction, tolerance)) return undefined;
        const result = this.nearestTo(right);
        const vec = result.sub(right.location);
        if (vec.length() < tolerance) return result;
        return vec.isParallelTo(right.direction, tolerance) ? result : undefined;
    }
    distanceTo(right) {
        const neareast1 = this.nearestTo(right);
        const neareast2 = right.nearestToPoint(neareast1);
        return neareast1.distanceTo(neareast2);
    }
    nearestTo(right) {
        const n = right.direction.cross(this.direction).normalize();
        if (n === undefined) return this.nearestToPoint(right.location);
        const normal = n.cross(right.direction).normalize();
        const plane = new Plane(right.location, normal, n);
        return plane.intersect(this);
    }
    nearestToPoint(point) {
        const vec = point.sub(this.location);
        const dot = vec.dot(this.direction);
        return this.location.add(this.direction.multiply(dot));
    }
};
__decorate([Serializer.serialze()], Ray.prototype, "location", void 0);
__decorate([Serializer.serialze()], Ray.prototype, "direction", void 0);
Ray = __decorate([Serializer.register(["location", "direction"])], Ray);
export { Ray };
