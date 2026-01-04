// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { div, input, label, option, select } from "chili-controls";
import { DialogResult, I18n, IApplication, ICommand, PubSub, command } from "chili-core";

let count = 1;

@command({
    key: "doc.new",
    icon: "icon-new",
    isApplicationCommand: true,
})
export class NewDocument implements ICommand {
    async execute(app: IApplication): Promise<void> {
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
}
