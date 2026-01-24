// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Result } from "chili-core";
export class StringConverter {
    convert(value) {
        return Result.ok(value);
    }
    convertBack(value) {
        return Result.ok(value);
    }
}
