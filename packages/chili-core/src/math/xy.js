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
var XY_1;
import { Precision } from "../foundation/precision";
import { Serializer } from "../serialize";
import { MathUtils } from "./mathUtils";
let XY = class XY {
    static {
        XY_1 = this;
    }
    static zero = new XY_1(0, 0);
    static unitX = new XY_1(1, 0);
    static unitY = new XY_1(0, 1);
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    cross(right) {
        return this.x * right.y - this.y * right.x;
    }
    dot(right) {
        return this.x * right.x + this.y * right.y;
    }
    divided(scalar) {
        return Math.abs(scalar) < Precision.Float ? undefined : new XY_1(this.x / scalar, this.y / scalar);
    }
    reverse() {
        return new XY_1(-this.x, -this.y);
    }
    multiply(scalar) {
        return new XY_1(this.x * scalar, this.y * scalar);
    }
    sub(right) {
        return new XY_1(this.x - right.x, this.y - right.y);
    }
    add(right) {
        return new XY_1(this.x + right.x, this.y + right.y);
    }
    normalize() {
        const d = this.length();
        return d < Precision.Float ? undefined : new XY_1(this.x / d, this.y / d);
    }
    distanceTo(right) {
        const dx = this.x - right.x;
        const dy = this.y - right.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    static center(p1, p2) {
        return new XY_1((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
    }
    lengthSq() {
        return this.x ** 2 + this.y ** 2;
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
        if (this.isEqualTo(XY_1.zero) || right.isEqualTo(XY_1.zero)) return undefined;
        // tan(x) = |a||b|sin(x) / |a||b|cos(x)
        return Math.atan2(this.cross(right), this.dot(right));
    }
    isEqualTo(right, tolerance = 1e-8) {
        return (
            MathUtils.almostEqual(this.x, right.x, tolerance) &&
            MathUtils.almostEqual(this.y, right.y, tolerance)
        );
    }
    isParallelTo(right, tolerance = 1e-8) {
        const angle = this.angleTo(right);
        return angle === undefined ? undefined : angle <= tolerance || Math.PI - angle <= tolerance;
    }
    isOppositeTo(right, tolerance = 1e-8) {
        const angle = this.angleTo(right);
        return angle === undefined ? undefined : Math.PI - angle <= tolerance;
    }
};
__decorate([Serializer.serialze()], XY.prototype, "x", void 0);
__decorate([Serializer.serialze()], XY.prototype, "y", void 0);
XY = XY_1 = __decorate([Serializer.register(["x", "y"])], XY);
export { XY };
