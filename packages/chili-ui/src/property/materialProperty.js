// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { button, collection, ColorConverter, div, span, UrlStringConverter } from "chili-controls";
import { Binding, Localize, ObservableCollection, PathBinding, PubSub, Transaction } from "chili-core";
import style from "./materialProperty.module.css";
import { PropertyBase } from "./propertyBase";
export class MaterialProperty extends PropertyBase {
    document;
    property;
    materials;
    constructor(document, objects, property) {
        super(objects);
        this.document = document;
        this.property = property;
        this.materials = this.materialCollection(objects[0].materialId);
        this.append(
            collection({
                sources: this.materials,
                template: (material, index) => this.materialControl(document, material, index),
            }),
        );
    }
    materialControl(document, material, index) {
        return div(
            { className: style.material },
            div(
                span({ textContent: new Localize("common.material") }),
                this.materials.length > 1 ? span({ textContent: ` ${index + 1}` }) : "",
            ),
            button({
                textContent: material.name,
                style: {
                    backgroundColor: new Binding(material, "color", new ColorConverter()),
                    backgroundImage: new PathBinding(material, "map.image", new UrlStringConverter()),
                    backgroundBlendMode: "multiply",
                    backgroundSize: "cover",
                    cursor: "pointer",
                },
                onclick: (e) => {
                    PubSub.default.pub("editMaterial", document, material, (material) => {
                        this.setMaterial(e, material, index);
                    });
                },
            }),
        );
    }
    setMaterial(e, material, index) {
        Transaction.execute(this.document, "change material", () => {
            this.materials.replace(index, material);
            this.objects.forEach((x) => {
                if (this.property.name in x) {
                    x.materialId =
                        this.materials.length > 1
                            ? x.materialId.toSpliced(index, 1, material.id)
                            : material.id;
                }
            });
        });
        this.document.visual.update();
    }
    materialCollection(id) {
        const findMaterial = (id) => this.document.materials.find((m) => m.id === id);
        const materials = Array.isArray(id)
            ? id.map(findMaterial).filter(Boolean)
            : [findMaterial(id)].filter(Boolean);
        return new ObservableCollection(...materials);
    }
}
customElements.define("chili-material-property", MaterialProperty);
