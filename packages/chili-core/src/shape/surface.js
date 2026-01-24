// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export var SurfaceType;
(function (SurfaceType) {
    SurfaceType[(SurfaceType["Plate"] = 0)] = "Plate";
    SurfaceType[(SurfaceType["Bezier"] = 1)] = "Bezier";
    SurfaceType[(SurfaceType["BSpline"] = 2)] = "BSpline";
    SurfaceType[(SurfaceType["RectangularTrimmed"] = 3)] = "RectangularTrimmed";
    SurfaceType[(SurfaceType["Conical"] = 4)] = "Conical";
    SurfaceType[(SurfaceType["Cylinder"] = 5)] = "Cylinder";
    SurfaceType[(SurfaceType["Plane"] = 6)] = "Plane";
    SurfaceType[(SurfaceType["Spherical"] = 7)] = "Spherical";
    SurfaceType[(SurfaceType["Toroidal"] = 8)] = "Toroidal";
    SurfaceType[(SurfaceType["Revolution"] = 9)] = "Revolution";
    SurfaceType[(SurfaceType["Extrusion"] = 10)] = "Extrusion";
    SurfaceType[(SurfaceType["Offset"] = 11)] = "Offset";
    SurfaceType[(SurfaceType["Composite"] = 12)] = "Composite";
})(SurfaceType || (SurfaceType = {}));
