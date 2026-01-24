// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { ViewUtils } from "chili-vis";
export class PlaneSnapBase {
    refPoint;
    removeDynamicObject() {}
    clear() {}
    constructor(refPoint) {
        this.refPoint = refPoint;
    }
    snapAtPlane(plane, data) {
        plane = ViewUtils.ensurePlane(data.view, plane);
        const ray = data.view.rayAt(data.mx, data.my);
        const point = plane.intersect(ray);
        if (!point) return undefined;
        const distance = this.refPoint ? this.refPoint().distanceTo(point) : undefined;
        return {
            view: data.view,
            point,
            distance,
            shapes: [],
        };
    }
}
export class WorkplaneSnap extends PlaneSnapBase {
    snap(data) {
        return this.snapAtPlane(data.view.workplane, data);
    }
}
export class PlaneSnap extends PlaneSnapBase {
    plane;
    constructor(plane, refPoint) {
        super(refPoint);
        this.plane = plane;
    }
    snap(data) {
        let point = data.view.screenToWorld(data.mx, data.my);
        const plane = this.plane(point);
        const result = this.snapAtPlane(plane, data);
        if (result) {
            result.plane = plane;
        }
        return result;
    }
}
