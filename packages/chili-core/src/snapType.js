// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export var ObjectSnapType;
(function (ObjectSnapType) {
    ObjectSnapType[(ObjectSnapType["none"] = 0)] = "none";
    ObjectSnapType[(ObjectSnapType["endPoint"] = 1)] = "endPoint";
    ObjectSnapType[(ObjectSnapType["midPoint"] = 2)] = "midPoint";
    ObjectSnapType[(ObjectSnapType["center"] = 4)] = "center";
    ObjectSnapType[(ObjectSnapType["angle"] = 8)] = "angle";
    ObjectSnapType[(ObjectSnapType["intersection"] = 16)] = "intersection";
    ObjectSnapType[(ObjectSnapType["perpendicular"] = 32)] = "perpendicular";
    ObjectSnapType[(ObjectSnapType["extension"] = 64)] = "extension";
    ObjectSnapType[(ObjectSnapType["parallel"] = 128)] = "parallel";
    ObjectSnapType[(ObjectSnapType["special"] = 256)] = "special";
    ObjectSnapType[(ObjectSnapType["nearest"] = 512)] = "nearest";
    ObjectSnapType[(ObjectSnapType["vertex"] = 1024)] = "vertex";
    ObjectSnapType[(ObjectSnapType["grid"] = 2048)] = "grid";
})(ObjectSnapType || (ObjectSnapType = {}));
(function (ObjectSnapType) {
    function has(snapTypes, targetType) {
        return (snapTypes & targetType) === targetType;
    }
    ObjectSnapType.has = has;
    function add(snapTypes, targetType) {
        return snapTypes | targetType;
    }
    ObjectSnapType.add = add;
    function remove(snapTypes, targetType) {
        return snapTypes & ~targetType;
    }
    ObjectSnapType.remove = remove;
})(ObjectSnapType || (ObjectSnapType = {}));
