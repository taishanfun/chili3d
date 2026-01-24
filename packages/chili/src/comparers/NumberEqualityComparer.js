// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Precision } from "chili-core";
export class NumberEqualityComparer {
    tolerance;
    constructor(tolerance = Precision.Distance) {
        this.tolerance = tolerance;
    }
    equals(left, right) {
        return Math.abs(left - right) < this.tolerance;
    }
}
