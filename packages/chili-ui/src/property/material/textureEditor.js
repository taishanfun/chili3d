// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { div, Expander, img, svg } from "chili-controls";
import { UrlStringConverter } from "chili-controls/src/converters/urlConverter";
import { PathBinding, Property, readFileAsync } from "chili-core";
import { findPropertyControl } from "../utils";
import style from "./textureEditor.module.css";
export class TextureProperty extends Expander {
    document;
    texture;
    constructor(document, display, texture) {
        super(display);
        this.document = document;
        this.texture = texture;
        this.classList.add(style.root);
        this.append(this.render());
    }
    render() {
        const properties = Property.getProperties(this.texture)
            .filter((x) => x.name !== "image")
            .map((x) => findPropertyControl(this.document, [this.texture], x));
        return div(
            { className: style.expander },
            div({ className: style.properties }, ...properties),
            div(
                { className: style.image },
                img({
                    style: {
                        backgroundImage: new PathBinding(this.texture, "image", new UrlStringConverter()),
                        backgroundSize: "contain",
                    },
                    onclick: this.selectTexture,
                }),
                svg({
                    icon: "icon-times",
                    onclick: () => {
                        this.texture.image = "";
                    },
                }),
            ),
        );
    }
    selectTexture = async () => {
        let file = await readFileAsync(".png, .jpg, .jpeg", false, "readAsDataURL");
        this.texture.image = file.value[0].data;
    };
}
customElements.define("texture-editor", TextureProperty);
