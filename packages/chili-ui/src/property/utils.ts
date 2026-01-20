// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { IConverter, IDocument, Logger, MTextNode, Property, Result, Texture } from "chili-core";
import { CheckProperty } from "./check";
import { ColorProperty } from "./colorProperty";
import { InputProperty, MTextLinesProperty } from "./input";
import { TextureProperty } from "./material/textureEditor";
import { MaterialProperty } from "./materialProperty";

class UndefinedToEmptyStringConverter implements IConverter<any, string> {
    convert(value: any): Result<string> {
        if (value === undefined || value === null) return Result.ok("");
        return Result.ok(String(value));
    }

    convertBack(value: string): Result<any> {
        return Result.ok(value);
    }
}

export function findPropertyControl(
    document: IDocument,
    objs: any[],
    prop: Property,
    converter?: IConverter,
) {
    if (prop === undefined || objs.length === 0) return "";

    if (prop.type === "color") {
        return new ColorProperty(document, objs, prop);
    }

    if (prop.type === "materialId" && canShowMaterialProperty(objs, prop)) {
        return new MaterialProperty(document, objs, prop);
    }

    if (objs[0] instanceof MTextNode && prop.name === "text") {
        return new MTextLinesProperty(document, objs, prop);
    }

    if (objs[0] instanceof MTextNode && prop.name === "lineColors") {
        return "";
    }

    const value = objs[0][prop.name];
    if (value instanceof Texture) {
        return new TextureProperty(document, prop.display, value);
    }

    if (value === undefined || value === null) {
        return new InputProperty(
            document,
            objs,
            prop,
            converter ?? prop.converter ?? new UndefinedToEmptyStringConverter(),
        );
    }

    if (["object", "string", "number"].includes(typeof value)) {
        return new InputProperty(document, objs, prop, converter ?? prop.converter);
    }

    if (typeof value === "boolean") {
        return new CheckProperty(document, objs, prop);
    }

    Logger.warn(`Property ${prop.name} not found in ${Object.getPrototypeOf(objs[0]).constructor.name}`);
    return "";
}

function canShowMaterialProperty(objs: any[], prop: Property) {
    if (objs.length === 0) return false;
    if (objs.length === 1) return true;
    return objs.every((obj) => obj[prop.name] === objs[0][prop.name]);
}
