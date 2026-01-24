// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Precision } from "chili-core";
export class XYZEqualityComparer {
    tolerance;
    constructor(tolerance = Precision.Distance) {
        this.tolerance = tolerance;
    }
    equals(left, right) {
        return left.isEqualTo(right, this.tolerance);
    }
}
