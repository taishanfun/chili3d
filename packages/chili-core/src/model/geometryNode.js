// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
var __decorate =
    (this && this.__decorate) ||
    function (decorators, target, key, desc) {
        var c = arguments.length,
            r =
                c < 3
                    ? target
                    : desc === null
                      ? (desc = Object.getOwnPropertyDescriptor(target, key))
                      : desc,
            d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if ((d = decorators[i]))
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
import { MeshUtils } from "chili-geo";
import { Id, PropertyHistoryRecord, Transaction } from "../foundation";
import { BoundingBox } from "../math";
import { Property } from "../property";
import { Serializer } from "../serialize";
import { VisualNode } from "./visualNode";
let FaceMaterialPair = class FaceMaterialPair {
    faceIndex;
    materialIndex;
    constructor(faceIndex, materialIndex) {
        this.faceIndex = faceIndex;
        this.materialIndex = materialIndex;
    }
};
__decorate([Serializer.serialze()], FaceMaterialPair.prototype, "faceIndex", void 0);
__decorate([Serializer.serialze()], FaceMaterialPair.prototype, "materialIndex", void 0);
FaceMaterialPair = __decorate([Serializer.register(["faceIndex", "materialIndex"])], FaceMaterialPair);
export { FaceMaterialPair };
export class GeometryNode extends VisualNode {
    get materialId() {
        return this.getPrivateValue("materialId");
    }
    set materialId(value) {
        this.setProperty("materialId", value);
    }
    _originFaceMesh;
    get faceMaterialPair() {
        return this.getPrivateValue("faceMaterialPair", []);
    }
    set faceMaterialPair(value) {
        const oldMaterisl = Array.isArray(this.materialId) ? [...this.materialId] : this.materialId;
        const Face = [...this.faceMaterialPair];
        this.setProperty("faceMaterialPair", value, () => this.updateVisual(oldMaterisl, Face));
    }
    constructor(document, name, materialId, id = Id.generate()) {
        super(document, name, id);
        this.setPrivateValue("materialId", materialId ?? document.materials.at(0)?.id ?? "");
    }
    _mesh;
    get mesh() {
        this._mesh ??= this.createMesh();
        return this._mesh;
    }
    boundingBox() {
        let points = this.mesh.faces?.position;
        if (!points || points.length === 0) {
            points = this.mesh.edges?.position;
        }
        if (!points || points.length === 0) {
            return undefined;
        }
        return BoundingBox.fromNumbers(this.transform.ofPoints(points));
    }
    disposeInternal() {
        super.disposeInternal();
        this._mesh = undefined;
    }
    copyOldValue() {
        const oldMaterial = Array.isArray(this.materialId) ? [...this.materialId] : this.materialId;
        const oldFacePair = [...this.faceMaterialPair];
        return {
            oldFacePair,
            oldMaterial,
        };
    }
    addFaceMaterial(pairs) {
        const { oldFacePair, oldMaterial } = this.copyOldValue();
        pairs.forEach(({ faceIndex, materialId }) => {
            if (this.materialId === materialId) {
                return;
            }
            if (this._mesh?.faces?.range.length === 1) {
                this.setPrivateValue("materialId", materialId);
                return;
            }
            if (typeof this.materialId === "string") {
                this.setPrivateValue("materialId", [this.materialId, materialId]);
            }
            const index = this.materialId.indexOf(materialId);
            if (index === -1) {
                this.materialId.push(materialId);
                this.faceMaterialPair.push(new FaceMaterialPair(faceIndex, this.materialId.length - 1));
            } else {
                this.faceMaterialPair.push(new FaceMaterialPair(faceIndex, index));
            }
        });
        this.updateVisual(oldMaterial, oldFacePair);
    }
    removeFaceMaterial(faceIndexs) {
        const { oldFacePair, oldMaterial } = this.copyOldValue();
        const toDelete = this.faceMaterialPair.filter((x) => faceIndexs.includes(x.faceIndex));
        this.setPrivateValue(
            "faceMaterialPair",
            this.faceMaterialPair.filter((x) => !faceIndexs.includes(x.faceIndex)),
        );
        toDelete.forEach((pair) => {
            const hasSameMaterial = this.faceMaterialPair.some(
                (x) => x.materialIndex === pair.materialIndex,
            );
            if (hasSameMaterial || !Array.isArray(this.materialId)) {
                return;
            }
            this.materialId.splice(pair.materialIndex, 1);
            if (this.materialId.length === 1) {
                this.setPrivateValue("materialId", this.materialId[0]);
            } else if (this.materialId.length > 1) {
                this.faceMaterialPair.forEach((x) => {
                    if (x.materialIndex > pair.materialIndex) {
                        x.materialIndex--;
                    }
                });
            }
        });
        this.updateVisual(oldMaterial, oldFacePair);
    }
    clearFaceMaterial() {
        const { oldFacePair, oldMaterial } = this.copyOldValue();
        if (Array.isArray(this.materialId)) {
            this.setPrivateValue("materialId", this.materialId[0]);
        }
        this.setPrivateValue("faceMaterialPair", []);
        this.updateVisual(oldMaterial, oldFacePair);
    }
    updateVisual = (oldMaterisl, oldFacePair) => {
        if (!this._originFaceMesh) return;
        if (this.faceMaterialPair.length === 0) {
            this._mesh.faces = this._originFaceMesh;
        } else {
            this._mesh.faces = MeshUtils.mergeFaceMesh(
                this._originFaceMesh,
                this.faceMaterialPair.map((x) => [x.faceIndex, x.materialIndex]),
            );
            if (this._mesh.faces.groups.length === 1) {
                this.setPrivateValue("materialId", this.materialId[this.faceMaterialPair[0].materialIndex]);
            }
        }
        this.emitPropertyChanged("materialId", oldMaterisl);
        this.emitPropertyChanged("faceMaterialPair", oldFacePair);
        const newMaterisl = Array.isArray(this.materialId) ? [...this.materialId] : this.materialId;
        Transaction.add(
            this.document,
            new PropertyHistoryRecord(this, "materialId", oldMaterisl, newMaterisl),
        );
        Transaction.add(
            this.document,
            new PropertyHistoryRecord(this, "faceMaterialPair", oldFacePair, [...this.faceMaterialPair]),
        );
        this.document.visual.context.redrawNode([this]);
    };
}
__decorate(
    [Serializer.serialze(), Property.define("common.material", { type: "materialId" })],
    GeometryNode.prototype,
    "materialId",
    null,
);
__decorate([Serializer.serialze()], GeometryNode.prototype, "faceMaterialPair", null);
