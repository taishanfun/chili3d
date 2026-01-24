// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Result } from "chili-core";
export class NumberConverter {
    convert(value) {
        return Number.isNaN(value) ? Result.err("Number is NaN") : Result.ok(String(value));
    }
    convertBack(value) {
        const n = Number(value);
        return Number.isNaN(n) ? Result.err(`${value} can not convert to number`) : Result.ok(n);
    }
}
