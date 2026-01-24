// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export var ViewMode;
(function (ViewMode) {
    ViewMode[(ViewMode["solid"] = 0)] = "solid";
    ViewMode[(ViewMode["wireframe"] = 1)] = "wireframe";
    ViewMode[(ViewMode["solidAndWireframe"] = 2)] = "solidAndWireframe";
})(ViewMode || (ViewMode = {}));
export var IView;
(function (IView) {
    function screenDistance(view, mx, my, point) {
        let xy = view.worldToScreen(point);
        let dx = xy.x - mx;
        let dy = xy.y - my;
        return Math.sqrt(dx * dx + dy * dy);
    }
    IView.screenDistance = screenDistance;
})(IView || (IView = {}));
