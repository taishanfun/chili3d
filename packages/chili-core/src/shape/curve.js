// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export var CurveType;
(function (CurveType) {
    CurveType[(CurveType["Line"] = 0)] = "Line";
    CurveType[(CurveType["Circle"] = 1)] = "Circle";
    CurveType[(CurveType["Ellipse"] = 2)] = "Ellipse";
    CurveType[(CurveType["Hyperbola"] = 3)] = "Hyperbola";
    CurveType[(CurveType["Parabola"] = 4)] = "Parabola";
    CurveType[(CurveType["BezierCurve"] = 5)] = "BezierCurve";
    CurveType[(CurveType["BSplineCurve"] = 6)] = "BSplineCurve";
    CurveType[(CurveType["OffsetCurve"] = 7)] = "OffsetCurve";
    CurveType[(CurveType["OtherCurve"] = 8)] = "OtherCurve";
    CurveType[(CurveType["TrimmedCurve"] = 9)] = "TrimmedCurve";
})(CurveType || (CurveType = {}));
export var Continuity;
(function (Continuity) {
    Continuity[(Continuity["C0"] = 0)] = "C0";
    Continuity[(Continuity["G1"] = 1)] = "G1";
    Continuity[(Continuity["C1"] = 2)] = "C1";
    Continuity[(Continuity["G2"] = 3)] = "G2";
    Continuity[(Continuity["C2"] = 4)] = "C2";
    Continuity[(Continuity["C3"] = 5)] = "C3";
    Continuity[(Continuity["CN"] = 6)] = "CN";
})(Continuity || (Continuity = {}));
export var ICurve;
(function (ICurve) {
    function isConic(curve) {
        return curve.axis !== undefined;
    }
    ICurve.isConic = isConic;
    function isCircle(curve) {
        let circle = curve;
        return circle.center !== undefined && circle.radius !== undefined;
    }
    ICurve.isCircle = isCircle;
    function isLine(curve) {
        return curve.direction !== undefined;
    }
    ICurve.isLine = isLine;
    function isTrimmed(curve) {
        return curve.basisCurve !== undefined;
    }
    ICurve.isTrimmed = isTrimmed;
})(ICurve || (ICurve = {}));
