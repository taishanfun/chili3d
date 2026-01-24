// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export var IDisposable;
(function (IDisposable) {
    function isDisposable(value) {
        return (
            value != null &&
            typeof value === "object" &&
            "dispose" in value &&
            typeof value.dispose === "function" &&
            value.dispose.length === 0
        );
    }
    IDisposable.isDisposable = isDisposable;
})(IDisposable || (IDisposable = {}));
