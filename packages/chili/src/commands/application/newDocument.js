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
import { div, input, label, option, select } from "chili-controls";
import { DialogResult, I18n, PubSub, command } from "chili-core";
let count = 1;
let NewDocument = class NewDocument {
    async execute(app) {
        const nameInput = input({ value: `undefined ${count}` });
        const modeSelect = select(
            {},
            option({ value: "3d", textContent: I18n.translate("ribbon.group.3d") }),
            option({ value: "2d", textContent: I18n.translate("ribbon.group.2d") }),
        );
        PubSub.default.pub(
            "showDialog",
            "command.doc.new",
            div(
                label({ textContent: I18n.translate("common.name") }),
                ": ",
                nameInput,
                div({}, label({ textContent: I18n.translate("common.type") }), ": ", modeSelect),
            ),
            (result) => {
                if (result !== DialogResult.ok) return;
                const mode = modeSelect.value === "2d" ? "2d" : "3d";
                const name = nameInput.value?.trim() || `undefined ${count}`;
                count++;
                PubSub.default.pub(
                    "showPermanent",
                    async () => {
                        await app.newDocument(name, mode);
                    },
                    "toast.excuting{0}",
                    I18n.translate("command.doc.new"),
                );
            },
        );
    }
};
NewDocument = __decorate(
    [
        command({
            key: "doc.new",
            icon: "icon-new",
            isApplicationCommand: true,
        }),
    ],
    NewDocument,
);
export { NewDocument };
