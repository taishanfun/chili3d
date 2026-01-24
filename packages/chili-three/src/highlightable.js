// Part of the Chili3d Project, under the AGPL-3.0 Licensettt.
// See LICENSE file in the project root for full license information.
export var IHighlightable;
(function (IHighlightable) {
    function is(value) {
        return value && typeof value.highlight === "function" && typeof value.unhighlight === "function";
    }
    IHighlightable.is = is;
})(IHighlightable || (IHighlightable = {}));
