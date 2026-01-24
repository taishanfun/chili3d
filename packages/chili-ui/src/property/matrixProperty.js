// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Matrix4, Result } from "chili-core";
import { InputProperty } from "./input";
import { PropertyBase } from "./propertyBase";
export class MatrixProperty extends PropertyBase {
    document;
    first;
    constructor(document, geometries, className) {
        super(geometries);
        this.document = document;
        this.first = geometries[0];
        this.className = className;
        this.append(
            new InputProperty(
                document,
                [this.first],
                {
                    name: "transform",
                    display: "transform.translation",
                },
                new TranslationConverter(this.first),
            ),
            new InputProperty(
                document,
                [this.first],
                {
                    name: "transform",
                    display: "transform.scale",
                },
                new ScalingConverter(this.first),
            ),
            new InputProperty(
                document,
                [this.first],
                {
                    name: "transform",
                    display: "transform.rotation",
                },
                new RotateConverter(this.first),
            ),
        );
    }
    onPropertyChanged = (property) => {
        if (property === "transform") {
            this.objects.forEach((obj) => {
                if (obj === this.first) return;
                obj.transform = this.first.transform;
            });
        }
    };
    connectedCallback() {
        this.first.onPropertyChanged(this.onPropertyChanged);
    }
    disconnectedCallback() {
        this.first.removePropertyChanged(this.onPropertyChanged);
    }
}
customElements.define("matrix-property", MatrixProperty);
export class MatrixConverter {
    geometry;
    constructor(geometry) {
        this.geometry = geometry;
    }
    convert(value) {
        const [x, y, z] = this.convertFrom(value);
        return Result.ok(`${x.toFixed(6)}, ${y.toFixed(6)}, ${z.toFixed(6)}`);
    }
    convertBack(value) {
        const values = value
            .split(",")
            .map(Number)
            .filter((x) => !isNaN(x));
        if (values.length !== 3) return Result.err("invalid number of values");
        const newValue = {
            x: values[0],
            y: values[1],
            z: values[2],
        };
        const matrix = this.convertTo(newValue);
        return Result.ok(matrix);
    }
}
export class TranslationConverter extends MatrixConverter {
    convertFrom(matrix) {
        let position = matrix.translationPart();
        return [position.x, position.y, position.z];
    }
    convertTo(values) {
        const rotation = this.geometry.transform.getEulerAngles();
        const scale = this.geometry.transform.getScale();
        return Matrix4.createFromTRS(values, rotation, scale);
    }
}
export class ScalingConverter extends MatrixConverter {
    convertFrom(matrix) {
        let s = matrix.getScale();
        return [s.x, s.y, s.z];
    }
    convertTo(values) {
        const rotation = this.geometry.transform.getEulerAngles();
        const translation = this.geometry.transform.translationPart();
        return Matrix4.createFromTRS(translation, rotation, values);
    }
}
export class RotateConverter extends MatrixConverter {
    convertFrom(matrix) {
        let s = matrix.getEulerAngles();
        return [(s.pitch * 180) / Math.PI, (s.yaw * 180) / Math.PI, (s.roll * 180) / Math.PI];
    }
    convertTo(values) {
        const scale = this.geometry.transform.getScale();
        const translation = this.geometry.transform.translationPart();
        return Matrix4.createFromTRS(
            translation,
            {
                pitch: (values.x * Math.PI) / 180,
                yaw: (values.y * Math.PI) / 180,
                roll: (values.z * Math.PI) / 180,
            },
            scale,
        );
    }
}
