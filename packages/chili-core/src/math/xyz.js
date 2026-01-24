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
var XYZ_1;
import { Precision } from "../foundation/precision";
import { Serializer } from "../serialize";
import { MathUtils } from "./mathUtils";
let XYZ = class XYZ {
    static {
        XYZ_1 = this;
    }
    static zero = new XYZ_1(0, 0, 0);
    static unitX = new XYZ_1(1, 0, 0);
    static unitY = new XYZ_1(0, 1, 0);
    static unitZ = new XYZ_1(0, 0, 1);
    static one = new XYZ_1(1, 1, 1);
    x;
    y;
    z;
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    toString() {
        return `${this.x}, ${this.y}, ${this.z}`;
    }
    toArray() {
        return [this.x, this.y, this.z];
    }
    cross(right) {
        return new XYZ_1(
            this.y * right.z - this.z * right.y,
            this.z * right.x - this.x * right.z,
            this.x * right.y - this.y * right.x,
        );
    }
    dot(right) {
        return this.x * right.x + this.y * right.y + this.z * right.z;
    }
    divided(scalar) {
        if (Math.abs(scalar) < Precision.Float) return undefined;
        return new XYZ_1(this.x / scalar, this.y / scalar, this.z / scalar);
    }
    reverse() {
        return new XYZ_1(-this.x, -this.y, -this.z);
    }
    multiply(scalar) {
        return new XYZ_1(this.x * scalar, this.y * scalar, this.z * scalar);
    }
    sub(right) {
        return new XYZ_1(this.x - right.x, this.y - right.y, this.z - right.z);
    }
    add(right) {
        return new XYZ_1(this.x + right.x, this.y + right.y, this.z + right.z);
    }
    normalize() {
        const d = this.length();
        return d < Precision.Float ? undefined : new XYZ_1(this.x / d, this.y / d, this.z / d);
    }
    distanceTo(right) {
        const dx = this.x - right.x;
        const dy = this.y - right.y;
        const dz = this.z - right.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    static center(p1, p2) {
        return new XYZ_1((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
    }
    lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    length() {
        return Math.sqrt(this.lengthSq());
    }
    /**
     * Computes the angular value in radians between me and right
     * @param right vector
     * @returns [0, PI]
     */
    angleTo(right) {
        if (this.isEqualTo(XYZ_1.zero) || XYZ_1.zero.isEqualTo(right)) return undefined;
        let cross = this.cross(right);
        let dot = this.dot(right);
        // tan(x) = |a||b|sin(x) / |a||b|cos(x)
        return Math.atan2(cross.length(), dot);
    }
    /**
     * Computes the angular value in radians between me and right on plane
     * @param right vector
     * @param normal plane normal
     * @returns [0, 2PI]
     */
    angleOnPlaneTo(right, normal) {
        const angle = this.angleTo(right);
        if (angle === undefined || XYZ_1.zero.isEqualTo(normal)) return undefined;
        const vec = this.cross(right).normalize();
        return vec?.isOppositeTo(normal) ? Math.PI * 2 - angle : angle;
    }
    /**
     *
     * @param normal rotate axis
     * @param angle angular value in radians
     * @returns
     */
    rotate(normal, angle) {
        const n = normal.normalize();
        if (n === undefined) return undefined;
        const cos = Math.cos(angle);
        return this.multiply(cos)
            .add(n.multiply((1 - cos) * n.dot(this)))
            .add(n.cross(this).multiply(Math.sin(angle)));
    }
    isEqualTo(right, tolerance = 1e-6) {
        return (
            MathUtils.almostEqual(this.x, right.x, tolerance) &&
            MathUtils.almostEqual(this.y, right.y, tolerance) &&
            MathUtils.almostEqual(this.z, right.z, tolerance)
        );
    }
    isParallelTo(right, tolerance = 1e-6) {
        const angle = this.angleTo(right);
        if (angle === undefined) return false;
        return Math.abs(angle) < tolerance || Math.abs(Math.PI - angle) < tolerance;
    }
    isOppositeTo(right, tolerance = 1e-6) {
        const angle = this.angleTo(right);
        if (angle === undefined) return false;
        return Math.abs(Math.PI - angle) < tolerance;
    }
};
__decorate([Serializer.serialze()], XYZ.prototype, "x", void 0);
__decorate([Serializer.serialze()], XYZ.prototype, "y", void 0);
__decorate([Serializer.serialze()], XYZ.prototype, "z", void 0);
XYZ = XYZ_1 = __decorate([Serializer.register(["x", "y", "z"])], XYZ);
export { XYZ };
