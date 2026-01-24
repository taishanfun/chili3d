// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
const cursors = new Map([
    ["default", "default"],
    ["draw", "none"],
    ["select.default", "none"],
]);
export var Cursor;
(function (Cursor) {
    function get(type) {
        return cursors.get(type) ?? "default";
    }
    Cursor.get = get;
})(Cursor || (Cursor = {}));
