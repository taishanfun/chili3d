// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export var Dimension;
(function (Dimension) {
    Dimension[(Dimension["None"] = 0)] = "None";
    Dimension[(Dimension["D1"] = 1)] = "D1";
    Dimension[(Dimension["D2"] = 2)] = "D2";
    Dimension[(Dimension["D3"] = 4)] = "D3";
    Dimension[(Dimension["D1D2"] = 3)] = "D1D2";
    Dimension[(Dimension["D1D2D3"] = 7)] = "D1D2D3";
})(Dimension || (Dimension = {}));
(function (Dimension) {
    function contains(d1, d2) {
        if (d2 === Dimension.None) return false;
        return (d1 & d2) === d2;
    }
    Dimension.contains = contains;
    /**
     *
     * @param value 1: D1, 2: D2, 3: D3, other: None
     * @returns
     */
    function from(value) {
        const mapping = {
            1: Dimension.D1,
            2: Dimension.D2,
            3: Dimension.D3,
        };
        return mapping[value] || Dimension.None;
    }
    Dimension.from = from;
})(Dimension || (Dimension = {}));
