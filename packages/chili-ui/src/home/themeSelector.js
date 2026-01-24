// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { option, select } from "chili-controls";
import { Config, Localize } from "chili-core";
export const ThemeSelector = (props) => {
    const themes = [
        { value: "light", key: "common.theme.light" },
        { value: "dark", key: "common.theme.dark" },
        { value: "system", key: "common.theme.system" },
    ];
    let themeOptions = [];
    themes.forEach((theme) =>
        themeOptions.push(
            option({
                selected: theme.value === Config.instance.themeMode,
                textContent: new Localize(theme.key),
                value: theme.value,
            }),
        ),
    );
    return select(
        {
            onchange: (e) => {
                let themeMode = e.target.value;
                Config.instance.themeMode = themeMode;
            },
            ...props,
        },
        ...themeOptions,
    );
};
