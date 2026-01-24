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
import {
    AsyncController,
    CancelableCommand,
    EditableShapeNode,
    PubSub,
    Result,
    ShapeNodeFilter,
    ShapeType,
    Transaction,
    command,
} from "chili-core";
import { FaceNode } from "../../bodys/face";
import { WireNode } from "../../bodys/wire";
import { SelectNodeStep } from "../../step";
class ConvertCommand extends CancelableCommand {
    async executeAsync() {
        const models = await this.getOrPickModels(this.document);
        if (!models) {
            PubSub.default.pub("showToast", "toast.select.noSelected");
            return;
        }
        Transaction.execute(this.document, `excute ${Object.getPrototypeOf(this).data.name}`, () => {
            const node = this.create(this.document, models);
            if (!node.isOk) {
                PubSub.default.pub("showToast", "toast.converter.error");
            } else {
                this.document.rootNode.add(node.value);
                this.document.visual.update();
                PubSub.default.pub("showToast", "toast.success");
            }
            models.forEach((x) => x.parent?.remove(x));
        });
    }
    shapeFilter() {
        return {
            allow: (shape) => shape.shapeType === ShapeType.Edge || shape.shapeType === ShapeType.Wire,
        };
    }
    async getOrPickModels(document) {
        const filter = this.shapeFilter();
        let models = this._getSelectedModels(document, filter);
        document.selection.clearSelection();
        if (models.length > 0) return models;
        const step = new SelectNodeStep("prompt.select.models", {
            filter: new ShapeNodeFilter(filter),
            multiple: true,
        });
        this.controller = new AsyncController();
        const data = await step.execute(document, this.controller);
        document.selection.clearSelection();
        return data?.nodes;
    }
    _getSelectedModels(document, filter) {
        return document.selection
            .getSelectedNodes()
            .map((x) => x)
            .filter((x) => {
                if (x === undefined) return false;
                let shape = x.shape.value;
                if (shape === undefined) return false;
                if (filter !== undefined && !filter.allow(shape)) return false;
                return true;
            });
    }
}
let ConvertToWire = class ConvertToWire extends ConvertCommand {
    create(document, models) {
        const edges = models.map((x) => x.shape.value.transformedMul(x.worldTransform()));
        const wireBody = new WireNode(document, edges);
        const shape = wireBody.generateShape();
        if (!shape.isOk) return Result.err(shape.error);
        return Result.ok(wireBody);
    }
};
ConvertToWire = __decorate(
    [
        command({
            key: "convert.toWire",
            icon: "icon-toPoly",
        }),
    ],
    ConvertToWire,
);
export { ConvertToWire };
let ConvertToFace = class ConvertToFace extends ConvertCommand {
    create(document, models) {
        const edges = models.map((x) => x.shape.value.transformedMul(x.worldTransform()));
        const wireBody = new FaceNode(document, edges);
        const shape = wireBody.generateShape();
        if (!shape.isOk) return Result.err(shape.error);
        return Result.ok(wireBody);
    }
};
ConvertToFace = __decorate(
    [
        command({
            key: "convert.toFace",
            icon: "icon-toFace",
        }),
    ],
    ConvertToFace,
);
export { ConvertToFace };
let ConvertToShell = class ConvertToShell extends ConvertCommand {
    shapeFilter() {
        return {
            allow: (shape) => shape.shapeType === ShapeType.Face,
        };
    }
    create(document, models) {
        const faces = models.map((x) => x.shape.value.transformedMul(x.worldTransform()));
        const shape = this.application.shapeFactory.shell(faces);
        faces.forEach((x) => x.dispose());
        if (!shape.isOk) return Result.err(shape.error);
        const shell = new EditableShapeNode(document, "shell", shape);
        return Result.ok(shell);
    }
};
ConvertToShell = __decorate(
    [
        command({
            key: "convert.toShell",
            icon: "icon-toShell",
        }),
    ],
    ConvertToShell,
);
export { ConvertToShell };
let ConvertToSolid = class ConvertToSolid extends ConvertCommand {
    shapeFilter() {
        return {
            allow: (shape) => shape.shapeType === ShapeType.Shell,
        };
    }
    create(document, models) {
        const faces = models.map((x) => x.shape.value.transformedMul(x.worldTransform()));
        const shape = this.application.shapeFactory.solid(faces);
        faces.forEach((x) => x.dispose());
        if (!shape.isOk) return Result.err(shape.error);
        const solid = new EditableShapeNode(document, "solid", shape);
        return Result.ok(solid);
    }
};
ConvertToSolid = __decorate(
    [
        command({
            key: "convert.toSolid",
            icon: "icon-toSolid",
        }),
    ],
    ConvertToSolid,
);
export { ConvertToSolid };
