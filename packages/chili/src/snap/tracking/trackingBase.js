// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { VertexMeshData } from "chili-core";
export class TrackingBase {
    trackingZ;
    tempMeshes = new Map();
    isCleared = false;
    constructor(trackingZ) {
        this.trackingZ = trackingZ;
    }
    clear() {
        this.clearTempMeshes();
        this.isCleared = true;
    }
    clearTempMeshes() {
        this.tempMeshes.forEach((ids, document) => {
            ids.forEach((id) => document.visual.context.removeMesh(id));
        });
        this.tempMeshes.clear();
    }
    addTempMesh(document, meshId) {
        let ids = this.tempMeshes.get(document);
        if (!ids) {
            ids = [];
            this.tempMeshes.set(document, ids);
        }
        ids.push(meshId);
    }
    displayPoint(document, point, size, color) {
        const data = VertexMeshData.from(point.point, size, color);
        const id = document.visual.context.displayMesh([data]);
        this.addTempMesh(document, id);
        return id;
    }
}
