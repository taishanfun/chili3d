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
import { command, DOCUMENT_FILE_EXTENSION, download, I18n, PubSub } from "chili-core";
let SaveDocumentToFile = class SaveDocumentToFile {
    async execute(app) {
        if (!app.activeView?.document) return;
        PubSub.default.pub(
            "showPermanent",
            async () => {
                await new Promise((r, j) => {
                    setTimeout(r, 100);
                });
                let s = app.activeView?.document.serialize();
                PubSub.default.pub("showToast", "toast.downloading");
                download([JSON.stringify(s)], `${app.activeView?.document.name}${DOCUMENT_FILE_EXTENSION}`);
            },
            "toast.excuting{0}",
            I18n.translate("command.doc.saveToFile"),
        );
    }
};
SaveDocumentToFile = __decorate(
    [
        command({
            key: "doc.saveToFile",
            icon: "icon-download",
        }),
    ],
    SaveDocumentToFile,
);
export { SaveDocumentToFile };
