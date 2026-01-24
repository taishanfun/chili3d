// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { EditableShapeNode, I18n, PubSub, Result, ShapeNode } from "chili-core";
export class DefaultDataExchange {
    importFormats() {
        return [".step", ".stp", ".iges", ".igs", ".brep", ".stl"];
    }
    exportFormats() {
        return [".step", ".iges", ".brep", ".stl", ".stl binary", ".ply", ".ply binary", ".obj"];
    }
    async import(document, files) {
        for (const file of files) {
            await this.handleSingleFileImport(document, file);
        }
    }
    async handleSingleFileImport(document, file) {
        let importResult;
        const fileName = file.name.toLocaleLowerCase();
        if (this.extensionIs(fileName, ".brep")) {
            importResult = await this.importBrep(document, file);
        } else if (this.extensionIs(fileName, ".stl")) {
            importResult = await this.importStl(document, file);
        } else if (this.extensionIs(fileName, ".step", ".stp")) {
            importResult = await this.importStep(document, file);
        } else if (this.extensionIs(fileName, ".iges", ".igs")) {
            importResult = await this.importIges(document, file);
        }
        this.handleImportResult(document, fileName, importResult);
    }
    extensionIs(fileName, ...extensions) {
        return extensions.some((ext) => fileName.endsWith(ext));
    }
    handleImportResult(document, name, nodeResult) {
        if (!nodeResult?.isOk) {
            alert(I18n.translate("error.import.unsupportedFileType:{0}", name));
            return;
        }
        const node = nodeResult.value;
        node.name = name;
        document.addNode(node);
        document.visual.update();
    }
    async importBrep(document, file) {
        const shape = document.application.shapeFactory.converter.convertFromBrep(await file.text());
        if (!shape.isOk) {
            return Result.err(shape.error);
        }
        return Result.ok(new EditableShapeNode(document, file.name, shape.value));
    }
    async importStl(document, file) {
        const content = new Uint8Array(await file.arrayBuffer());
        return document.application.shapeFactory.converter.convertFromSTL(document, content);
    }
    async importIges(document, file) {
        const content = new Uint8Array(await file.arrayBuffer());
        return document.application.shapeFactory.converter.convertFromIGES(document, content);
    }
    async importStep(document, file) {
        const content = new Uint8Array(await file.arrayBuffer());
        return document.application.shapeFactory.converter.convertFromSTEP(document, content);
    }
    async export(type, nodes) {
        if (nodes.length === 0) return undefined;
        const document = nodes[0].document;
        let shapeResult;
        if (type === ".stl") {
            shapeResult = document.visual.meshExporter.exportToStl(nodes, true);
        } else if (type === ".stl binary") {
            shapeResult = document.visual.meshExporter.exportToStl(nodes, false);
        } else if (type === ".ply") {
            shapeResult = document.visual.meshExporter.exportToPly(nodes, true);
        } else if (type === ".ply binary") {
            shapeResult = document.visual.meshExporter.exportToPly(nodes, false);
        } else if (type === ".obj") {
            shapeResult = document.visual.meshExporter.exportToObj(nodes);
        } else {
            const shapes = this.getExportShapes(nodes);
            if (!shapes.length) return undefined;
            if (type === ".step") shapeResult = this.exportStep(document, shapes);
            if (type === ".iges") shapeResult = this.exportIges(document, shapes);
            if (type === ".brep") shapeResult = this.exportBrep(document, shapes);
        }
        if (shapeResult) {
            return this.handleExportResult(shapeResult);
        }
        return undefined;
    }
    getExportShapes(nodes) {
        const shapes = nodes
            .filter((x) => x instanceof ShapeNode)
            .map((x) => x.shape.value.transformedMul(x.worldTransform()));
        !shapes.length && PubSub.default.pub("showToast", "error.export.noNodeCanBeExported");
        return shapes;
    }
    exportStep(doc, shapes) {
        return doc.application.shapeFactory.converter.convertToSTEP(...shapes);
    }
    exportIges(doc, shapes) {
        return doc.application.shapeFactory.converter.convertToIGES(...shapes);
    }
    exportBrep(document, shapes) {
        const comp = document.application.shapeFactory.combine(shapes);
        if (!comp.isOk) {
            return Result.err(comp.error);
        }
        const result = document.application.shapeFactory.converter.convertToBrep(comp.value);
        comp.value.dispose();
        return result;
    }
    handleExportResult(result) {
        if (!result?.isOk) {
            PubSub.default.pub("showToast", "error.default:{0}", result?.error);
            return undefined;
        }
        return [result.value];
    }
}
