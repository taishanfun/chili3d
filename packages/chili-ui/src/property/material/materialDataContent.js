// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Material, Observable } from "chili-core";
let count = 1;
export class MaterialDataContent extends Observable {
    document;
    callback;
    get editingMaterial() {
        return this.getPrivateValue("editingMaterial");
    }
    set editingMaterial(value) {
        this.setProperty("editingMaterial", value);
    }
    constructor(document, callback, editingMaterial) {
        super();
        this.document = document;
        this.callback = callback;
        this.setPrivateValue("editingMaterial", editingMaterial);
    }
    deleteMaterial() {
        if (this.document.materials.length <= 1) return;
        let tempMaterial = this.editingMaterial;
        this.editingMaterial = this.document.materials.find((m) => m.id !== this.editingMaterial.id);
        this.callback(this.editingMaterial);
        this.document.materials.remove(tempMaterial);
    }
    addMaterial() {
        this.document.materials.push(new Material(this.document, `Material ${count++}`, 0xdddddd));
    }
    copyMaterial() {
        this.document.materials.push(this.editingMaterial.clone());
    }
}
