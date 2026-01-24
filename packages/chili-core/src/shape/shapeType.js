// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export var ShapeType;
(function (ShapeType) {
    ShapeType[(ShapeType["Shape"] = 0)] = "Shape";
    ShapeType[(ShapeType["Compound"] = 1)] = "Compound";
    ShapeType[(ShapeType["CompoundSolid"] = 2)] = "CompoundSolid";
    ShapeType[(ShapeType["Solid"] = 4)] = "Solid";
    ShapeType[(ShapeType["Shell"] = 8)] = "Shell";
    ShapeType[(ShapeType["Face"] = 16)] = "Face";
    ShapeType[(ShapeType["Wire"] = 32)] = "Wire";
    ShapeType[(ShapeType["Edge"] = 64)] = "Edge";
    ShapeType[(ShapeType["Vertex"] = 128)] = "Vertex";
})(ShapeType || (ShapeType = {}));
(function (ShapeType) {
    function isWhole(type) {
        return (
            type === ShapeType.Shape ||
            type === ShapeType.Compound ||
            type === ShapeType.CompoundSolid ||
            type === ShapeType.Solid
        );
    }
    ShapeType.isWhole = isWhole;
    function stringValue(type) {
        switch (type) {
            case ShapeType.Shape:
                return "Shape";
            case ShapeType.Compound:
                return "Compound";
            case ShapeType.CompoundSolid:
                return "CompoundSolid";
            case ShapeType.Solid:
                return "Solid";
            case ShapeType.Shell:
                return "Shell";
            case ShapeType.Face:
                return "Face";
            case ShapeType.Wire:
                return "Wire";
            case ShapeType.Edge:
                return "Edge";
            case ShapeType.Vertex:
                return "Vertex";
            default:
                return "Unknown";
        }
    }
    ShapeType.stringValue = stringValue;
    function hasCompound(type) {
        return (type & ShapeType.Compound) !== 0;
    }
    ShapeType.hasCompound = hasCompound;
    function hasCompoundSolid(type) {
        return (type & ShapeType.CompoundSolid) !== 0;
    }
    ShapeType.hasCompoundSolid = hasCompoundSolid;
    function hasSolid(type) {
        return (type & ShapeType.Solid) !== 0;
    }
    ShapeType.hasSolid = hasSolid;
    function hasShell(type) {
        return (type & ShapeType.Shell) !== 0;
    }
    ShapeType.hasShell = hasShell;
    function hasFace(type) {
        return (type & ShapeType.Face) !== 0;
    }
    ShapeType.hasFace = hasFace;
    function hasWire(type) {
        return (type & ShapeType.Wire) !== 0;
    }
    ShapeType.hasWire = hasWire;
    function hasEdge(type) {
        return (type & ShapeType.Edge) !== 0;
    }
    ShapeType.hasEdge = hasEdge;
    function hasVertex(type) {
        return (type & ShapeType.Vertex) !== 0;
    }
    ShapeType.hasVertex = hasVertex;
})(ShapeType || (ShapeType = {}));
