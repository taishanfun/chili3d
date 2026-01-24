// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { option, select } from "chili-controls";
import { Config, I18n } from "chili-core";
export const LanguageSelector = (props) => {
    let languages = [];
    I18n.languages.forEach((language, index) =>
        languages.push(
            option({
                selected: index === I18n.currentLanguage(),
                textContent: language.display,
            }),
        ),
    );
    return select(
        {
            onchange: (e) => {
                let language = e.target.selectedIndex;
                Config.instance.languageIndex = language;
            },
            ...props,
        },
        ...languages,
    );
};
