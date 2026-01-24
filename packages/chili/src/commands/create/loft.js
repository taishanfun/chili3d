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
    Combobox,
    command,
    Continuity,
    EditableShapeNode,
    Property,
    PubSub,
    Result,
    ShapeType,
} from "chili-core";
import { SelectShapeStep } from "../../step";
let LoftCommand = class LoftCommand extends CancelableCommand {
    visual = undefined;
    shapes = [];
    shape = Result.err("None shape");
    _continuity = this.initContinuties();
    get isSolid() {
        return this.getPrivateValue("isSolid", false);
    }
    set isSolid(value) {
        this.setProperty("isSolid", value, () => {
            this.displayVisual();
        });
    }
    get isRuled() {
        return this.getPrivateValue("isRuled", false);
    }
    set isRuled(value) {
        this.setProperty("isRuled", value, () => {
            this.displayVisual();
        });
    }
    get continuity() {
        return this._continuity;
    }
    confirm = () => {
        this.controller?.success();
    };
    initContinuties() {
        const box = new Combobox();
        for (const item of Object.values(Continuity)) {
            if (typeof item === "number") continue;
            box.items.push(item.toString());
        }
        return box;
    }
    async executeAsync() {
        this._continuity.onPropertyChanged(this.handleContinuityChange);
        try {
            while (true) {
                let data = await this.selectSection();
                if (data === undefined) {
                    if (this.controller?.result?.status === "success") {
                        break;
                    } else {
                        return;
                    }
                }
                this.shapes.push(data.shapes[0].shape.transformedMul(data.nodes[0].worldTransform()));
                this.displayVisual();
            }
            this.document.addNode(new EditableShapeNode(this.document, "loft", this.shape));
        } finally {
            this._continuity.removePropertyChanged(this.handleContinuityChange);
            this.clearVisual();
        }
    }
    async selectSection() {
        this.controller = new AsyncController();
        const step = new SelectShapeStep(
            ShapeType.Vertex | ShapeType.Wire | ShapeType.Edge,
            "prompt.select.section",
            {
                keepSelection: true,
            },
        );
        return await step.execute(this.document, this.controller);
    }
    handleContinuityChange = (p) => {
        if (p === "selectedIndex") this.displayVisual();
    };
    clearVisual() {
        this.removeVisual();
        this.document.visual.highlighter.clear();
        this.document.visual.update();
    }
    displayVisual() {
        this.removeVisual();
        if (this.shapes.length < 2) {
            return false;
        }
        this.shape = this.document.application.shapeFactory.loft(
            this.shapes,
            this.isSolid,
            this.isRuled,
            this.continuity.selectedIndex,
        );
        if (!this.shape.isOk) {
            PubSub.default.pub("showToast", "error.default:{0}", this.shape.error);
            return false;
        }
        this.visual = this.document.visual.context.displayMesh([this.shape.value.mesh.faces], 0.5);
        this.document.visual.update();
        return true;
    }
    removeVisual = () => {
        if (this.visual !== undefined) {
            this.document.visual.context.removeMesh(this.visual);
            this.visual = undefined;
        }
    };
};
__decorate([Property.define("option.command.isSolid")], LoftCommand.prototype, "isSolid", null);
__decorate([Property.define("option.command.isRuled")], LoftCommand.prototype, "isRuled", null);
__decorate(
    [
        Property.define("option.command.continuity", {
            dependencies: [
                {
                    property: "isRuled",
                    value: false,
                },
            ],
        }),
    ],
    LoftCommand.prototype,
    "continuity",
    null,
);
__decorate([Property.define("common.confirm")], LoftCommand.prototype, "confirm", void 0);
LoftCommand = __decorate(
    [
        command({
            key: "create.loft",
            icon: "icon-loft",
        }),
    ],
    LoftCommand,
);
export { LoftCommand };
