// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { EditableShapeNode, GroupNode, Material, Result, gc } from "chili-core";
import { OcctHelper } from "./helper";
import { OccShape } from "./shape";
export class OccShapeConverter {
    addShapeNode = (collector, folder, node, children, getMaterialId) => {
        if (node.shape && !node.shape.isNull()) {
            const shape = OcctHelper.wrapShape(node.shape);
            const material = getMaterialId(folder.document, node.color);
            folder.add(new EditableShapeNode(folder.document, node.name, shape, material));
        }
        children.forEach((child) => {
            collector(child);
            const subChildren = child.getChildren();
            const childFolder = subChildren.length > 1 ? new GroupNode(folder.document, child.name) : folder;
            if (subChildren.length > 1) {
                folder.add(childFolder);
            }
            this.addShapeNode(collector, childFolder, child, subChildren, getMaterialId);
        });
    };
    convertToIGES(...shapes) {
        let occShapes = shapes.map((shape) => {
            if (shape instanceof OccShape) {
                return shape.shape;
            }
            throw new Error("Shape is not an OccShape");
        });
        return Result.ok(wasm.Converter.convertToIges(occShapes));
    }
    convertFromIGES(document, iges) {
        return this.converterFromData(document, iges, wasm.Converter.convertFromIges);
    }
    converterFromData = (document, data, converter) => {
        const materialMap = new Map();
        const getMaterialId = (document, color) => {
            // Provide default color for undefined, null, or empty color values
            const materialColor = color || "#808080"; // Default gray color
            const materialKey = materialColor;
            if (!materialMap.has(materialKey)) {
                const material = new Material(document, materialKey, materialColor);
                document.materials.push(material);
                materialMap.set(materialKey, material.id);
            }
            return materialMap.get(materialKey);
        };
        return gc((c) => {
            const node = converter(data);
            if (!node) {
                return Result.err("can not convert");
            }
            const folder = new GroupNode(document, "undefined");
            this.addShapeNode(c, folder, node, node.getChildren(), getMaterialId);
            c(node);
            return Result.ok(folder);
        });
    };
    convertToSTEP(...shapes) {
        let occShapes = shapes.map((shape) => {
            if (shape instanceof OccShape) {
                return shape.shape;
            }
            throw new Error("Shape is not an OccShape");
        });
        return Result.ok(wasm.Converter.convertToStep(occShapes));
    }
    convertFromSTEP(document, step) {
        return this.converterFromData(document, step, wasm.Converter.convertFromStep);
    }
    convertToBrep(shape) {
        if (shape instanceof OccShape) {
            return Result.ok(wasm.Converter.convertToBrep(shape.shape));
        }
        return Result.err("Shape is not an OccShape");
    }
    convertFromBrep(brep) {
        let shape = wasm.Converter.convertFromBrep(brep);
        if (shape.isNull()) {
            return Result.err("can not convert");
        }
        return Result.ok(OcctHelper.wrapShape(shape));
    }
    convertFromSTL(document, stl) {
        return this.converterFromData(document, stl, wasm.Converter.convertFromStl);
    }
}
