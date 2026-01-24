// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export var IVisualObject;
(function (IVisualObject) {
    function isGeometry(obj) {
        return obj.geometryNode !== undefined;
    }
    IVisualObject.isGeometry = isGeometry;
})(IVisualObject || (IVisualObject = {}));
