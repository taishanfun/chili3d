// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export var VisualState;
(function (VisualState) {
    VisualState[(VisualState["normal"] = 0)] = "normal";
    VisualState[(VisualState["edgeHighlight"] = 1)] = "edgeHighlight";
    VisualState[(VisualState["edgeSelected"] = 2)] = "edgeSelected";
    VisualState[(VisualState["faceTransparent"] = 4)] = "faceTransparent";
    VisualState[(VisualState["faceColored"] = 8)] = "faceColored";
})(VisualState || (VisualState = {}));
(function (VisualState) {
    function addState(origin, add) {
        return origin | add;
    }
    VisualState.addState = addState;
    function removeState(origin, remove) {
        return (origin & remove) ^ origin;
    }
    VisualState.removeState = removeState;
    function hasState(origin, testState) {
        return (origin & testState) === testState;
    }
    VisualState.hasState = hasState;
})(VisualState || (VisualState = {}));
