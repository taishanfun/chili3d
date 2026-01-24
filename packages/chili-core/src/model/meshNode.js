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
import { Id } from "../foundation";
import { BoundingBox } from "../math";
import { Property } from "../property";
import { Serializer } from "../serialize";
import { VisualNode } from "./visualNode";
let MeshNode = class MeshNode extends VisualNode {
    display() {
        return "body.meshNode";
    }
    get materialId() {
        return this.getPrivateValue("materialId");
    }
    set materialId(value) {
        this.setProperty("materialId", value);
    }
    _mesh;
    get mesh() {
        return this._mesh;
    }
    set mesh(value) {
        this.setProperty("mesh", value);
    }
    constructor(document, mesh, name, materialId, id = Id.generate()) {
        super(document, name, id);
        this._mesh = mesh;
        this.setPrivateValue("materialId", materialId ?? document.materials.at(0)?.id ?? "");
    }
    boundingBox() {
        let points = this.transform.ofPoints(this.mesh.position);
        return BoundingBox.fromNumbers(points);
    }
};
__decorate(
    [Serializer.serialze(), Property.define("common.material", { type: "materialId" })],
    MeshNode.prototype,
    "materialId",
    null,
);
__decorate([Serializer.serialze()], MeshNode.prototype, "mesh", null);
MeshNode = __decorate([Serializer.register(["document", "mesh", "name", "id"])], MeshNode);
export { MeshNode };
