// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export var Orientation;
(function (Orientation) {
    Orientation[(Orientation["FORWARD"] = 0)] = "FORWARD";
    Orientation[(Orientation["REVERSED"] = 1)] = "REVERSED";
    Orientation[(Orientation["INTERNAL"] = 2)] = "INTERNAL";
    Orientation[(Orientation["EXTERNAL"] = 3)] = "EXTERNAL";
})(Orientation || (Orientation = {}));
export var JoinType;
(function (JoinType) {
    JoinType[(JoinType["arc"] = 0)] = "arc";
    JoinType[(JoinType["tangent"] = 1)] = "tangent";
    JoinType[(JoinType["intersection"] = 2)] = "intersection";
})(JoinType || (JoinType = {}));
