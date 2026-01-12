// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { CursorType } from "chili-core";

const cursors: Map<CursorType, string> = new Map([
    ["default", "default"],
    ["draw", "none"],
    ["select.default", "none"],
]);

export namespace Cursor {
    export function get(type: CursorType) {
        return cursors.get(type) ?? "default";
    }
}
