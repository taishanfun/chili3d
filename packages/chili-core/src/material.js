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
var Material_1;
import { HistoryObservable, Id } from "./foundation";
import { XY } from "./math";
import { Property } from "./property";
import { Serializer } from "./serialize";
let Texture = class Texture extends HistoryObservable {
    get image() {
        return this.getPrivateValue("image", "");
    }
    set image(value) {
        this.setProperty("image", value);
    }
    get wrapS() {
        return this.getPrivateValue("wrapS", 1000);
    }
    set wrapS(value) {
        this.setProperty("wrapS", value);
    }
    get wrapT() {
        return this.getPrivateValue("wrapT", 1000);
    }
    set wrapT(value) {
        this.setProperty("wrapT", value);
    }
    get rotation() {
        return this.getPrivateValue("rotation", 0);
    }
    set rotation(value) {
        this.setProperty("rotation", value);
    }
    get offset() {
        return this.getPrivateValue("offset", new XY(0, 0));
    }
    set offset(value) {
        this.setProperty("offset", value);
    }
    get repeat() {
        return this.getPrivateValue("repeat", new XY(1, 1));
    }
    set repeat(value) {
        this.setProperty("repeat", value);
    }
    center = new XY(0.5, 0.5);
};
__decorate(
    [Serializer.serialze(), Property.define("material.texture.image")],
    Texture.prototype,
    "image",
    null,
);
__decorate([Serializer.serialze()], Texture.prototype, "wrapS", null);
__decorate([Serializer.serialze()], Texture.prototype, "wrapT", null);
__decorate(
    [Serializer.serialze(), Property.define("material.texture.rotation")],
    Texture.prototype,
    "rotation",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.texture.offset")],
    Texture.prototype,
    "offset",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.texture.repeat")],
    Texture.prototype,
    "repeat",
    null,
);
__decorate([Serializer.serialze()], Texture.prototype, "center", void 0);
Texture = __decorate([Serializer.register(["document"])], Texture);
export { Texture };
let Material = (Material_1 = class Material extends HistoryObservable {
    vertexColors = false;
    transparent = true;
    id;
    get name() {
        return this.getPrivateValue("name");
    }
    set name(value) {
        this.setProperty("name", value);
    }
    get color() {
        return this.getPrivateValue("color");
    }
    set color(value) {
        this.setProperty("color", value);
    }
    get opacity() {
        return this.getPrivateValue("opacity", 1);
    }
    set opacity(value) {
        this.setProperty("opacity", value);
    }
    get map() {
        return this.getPrivateValue("map", new Texture(this.document));
    }
    set map(value) {
        this.setProperty("map", value);
    }
    constructor(document, name, color, id = Id.generate()) {
        super(document);
        this.id = id;
        this.setPrivateValue("name", name?.length > 0 ? name : "unnamed");
        this.setPrivateValue("color", color);
    }
    clone() {
        let material = new Material_1(this.document, `${this.name} clone`, this.color);
        material.setPrivateValue("map", this.map);
        return material;
    }
});
__decorate([Serializer.serialze()], Material.prototype, "vertexColors", void 0);
__decorate([Serializer.serialze()], Material.prototype, "transparent", void 0);
__decorate([Serializer.serialze()], Material.prototype, "id", void 0);
__decorate([Serializer.serialze(), Property.define("common.name")], Material.prototype, "name", null);
__decorate(
    [Serializer.serialze(), Property.define("common.color", { type: "color" })],
    Material.prototype,
    "color",
    null,
);
__decorate([Serializer.serialze(), Property.define("common.opacity")], Material.prototype, "opacity", null);
__decorate([Serializer.serialze(), Property.define("material.map")], Material.prototype, "map", null);
Material = Material_1 = __decorate([Serializer.register(["document", "name", "color", "id"])], Material);
export { Material };
let PhongMaterial = class PhongMaterial extends Material {
    get specular() {
        return this.getPrivateValue("specular", 0x111111);
    }
    set specular(value) {
        this.setProperty("specular", value);
    }
    get shininess() {
        return this.getPrivateValue("shininess", 30);
    }
    set shininess(value) {
        this.setProperty("shininess", value);
    }
    get emissive() {
        return this.getPrivateValue("emissive", 0x000000);
    }
    set emissive(value) {
        this.setProperty("emissive", value);
    }
    get specularMap() {
        return this.getPrivateValue("specularMap", new Texture(this.document));
    }
    set specularMap(value) {
        this.setProperty("specularMap", value);
    }
    get bumpMap() {
        return this.getPrivateValue("bumpMap", new Texture(this.document));
    }
    set bumpMap(value) {
        this.setProperty("bumpMap", value);
    }
    get normalMap() {
        return this.getPrivateValue("normalMap", new Texture(this.document));
    }
    set normalMap(value) {
        this.setProperty("normalMap", value);
    }
    get emissiveMap() {
        return this.getPrivateValue("emissiveMap", new Texture(this.document));
    }
    set emissiveMap(value) {
        this.setProperty("emissiveMap", value);
    }
};
__decorate(
    [Serializer.serialze(), Property.define("material.specular", { type: "color" })],
    PhongMaterial.prototype,
    "specular",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.shininess")],
    PhongMaterial.prototype,
    "shininess",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.emissive", { type: "color" })],
    PhongMaterial.prototype,
    "emissive",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.specularMap")],
    PhongMaterial.prototype,
    "specularMap",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.bumpMap")],
    PhongMaterial.prototype,
    "bumpMap",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.normalMap")],
    PhongMaterial.prototype,
    "normalMap",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.emissiveMap")],
    PhongMaterial.prototype,
    "emissiveMap",
    null,
);
PhongMaterial = __decorate([Serializer.register(["document", "name", "color", "id"])], PhongMaterial);
export { PhongMaterial };
let PhysicalMaterial = class PhysicalMaterial extends Material {
    get metalness() {
        return this.getPrivateValue("metalness", 0);
    }
    set metalness(value) {
        this.setProperty("metalness", value);
    }
    get metalnessMap() {
        return this.getPrivateValue("metalnessMap", new Texture(this.document));
    }
    set metalnessMap(value) {
        this.setProperty("metalnessMap", value);
    }
    get roughness() {
        return this.getPrivateValue("roughness", 1);
    }
    set roughness(value) {
        this.setProperty("roughness", value);
    }
    get roughnessMap() {
        return this.getPrivateValue("roughnessMap", new Texture(this.document));
    }
    set roughnessMap(value) {
        this.setProperty("roughnessMap", value);
    }
    get emissive() {
        return this.getPrivateValue("emissive", 0x000000);
    }
    set emissive(value) {
        this.setProperty("emissive", value);
    }
    get bumpMap() {
        return this.getPrivateValue("bumpMap", new Texture(this.document));
    }
    set bumpMap(value) {
        this.setProperty("bumpMap", value);
    }
    get normalMap() {
        return this.getPrivateValue("normalMap", new Texture(this.document));
    }
    set normalMap(value) {
        this.setProperty("normalMap", value);
    }
    get emissiveMap() {
        return this.getPrivateValue("emissiveMap", new Texture(this.document));
    }
    set emissiveMap(value) {
        this.setProperty("emissiveMap", value);
    }
};
__decorate(
    [Serializer.serialze(), Property.define("material.metalness")],
    PhysicalMaterial.prototype,
    "metalness",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.metalnessMap")],
    PhysicalMaterial.prototype,
    "metalnessMap",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.roughness")],
    PhysicalMaterial.prototype,
    "roughness",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.roughnessMap")],
    PhysicalMaterial.prototype,
    "roughnessMap",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.emissive", { type: "color" })],
    PhysicalMaterial.prototype,
    "emissive",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.bumpMap")],
    PhysicalMaterial.prototype,
    "bumpMap",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.normalMap")],
    PhysicalMaterial.prototype,
    "normalMap",
    null,
);
__decorate(
    [Serializer.serialze(), Property.define("material.emissiveMap")],
    PhysicalMaterial.prototype,
    "emissiveMap",
    null,
);
PhysicalMaterial = __decorate([Serializer.register(["document", "name", "color", "id"])], PhysicalMaterial);
export { PhysicalMaterial };
