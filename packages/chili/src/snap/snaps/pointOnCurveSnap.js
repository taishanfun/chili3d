// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export class PointOnCurveSnap {
    pointData;
    constructor(pointData) {
        this.pointData = pointData;
    }
    snap(data) {
        const ray = data.view.rayAt(data.mx, data.my);
        const curve = this.pointData.curve;
        const nearest = curve.nearestExtrema(ray);
        if (!nearest) return undefined;
        return {
            view: data.view,
            point: nearest.p1,
            shapes: [],
        };
    }
    removeDynamicObject() {}
    clear() {}
}
