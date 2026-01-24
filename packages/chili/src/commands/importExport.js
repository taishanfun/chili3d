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
    download,
    I18n,
    Property,
    PubSub,
    readFilesAsync,
} from "chili-core";
import { SelectNodeStep } from "../step";
import { importFiles } from "../utils";
let Import = class Import {
    async execute(application) {
        const extenstions = application.dataExchange.importFormats().join(",");
        const files = await readFilesAsync(extenstions, true);
        if (!files.isOk || files.value.length === 0) {
            alert(files.error);
            return;
        }
        importFiles(application, files.value);
    }
};
Import = __decorate(
    [
        command({
            key: "file.import",
            icon: "icon-import",
        }),
    ],
    Import,
);
export { Import };
let Export = class Export extends CancelableCommand {
    get formats() {
        return this.getPrivateValue("formats", this.initCombobox());
    }
    set formats(value) {
        this.setProperty("formats", value);
    }
    initCombobox() {
        const box = new Combobox();
        box.items.push(...this.application.dataExchange.exportFormats());
        return box;
    }
    async executeAsync() {
        const nodes = await this.selectNodesAsync();
        if (!nodes || nodes.length === 0) {
            PubSub.default.pub("showToast", "toast.select.noSelected");
            return;
        }
        PubSub.default.pub(
            "showPermanent",
            async () => {
                const format = this.formats.selectedItem;
                if (format === undefined) return;
                const data = await this.application.dataExchange.export(format, nodes);
                if (!data) return;
                let suffix = format;
                if (suffix == ".stl binary") {
                    suffix = ".stl";
                } else if (suffix == ".ply binary") {
                    suffix = ".ply";
                }
                PubSub.default.pub("showToast", "toast.downloading");
                download(data, `${nodes[0].name}${suffix}`);
            },
            "toast.excuting{0}",
            I18n.translate("command.file.export"),
        );
    }
    async selectNodesAsync() {
        this.controller = new AsyncController();
        const step = new SelectNodeStep("prompt.select.models", { multiple: true, keepSelection: true });
        const data = await step.execute(this.application.activeView?.document, this.controller);
        if (!data?.nodes) {
            PubSub.default.pub("showToast", "prompt.select.noModelSelected");
            return undefined;
        }
        return data.nodes;
    }
};
__decorate([Property.define("file.format")], Export.prototype, "formats", null);
Export = __decorate(
    [
        command({
            key: "file.export",
            icon: "icon-export",
        }),
    ],
    Export,
);
export { Export };
