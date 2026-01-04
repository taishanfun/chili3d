// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import {
    Button,
    CommandKeys,
    I18nKeys,
    Observable,
    ObservableCollection,
    RibbonGroup,
    RibbonTab,
} from "chili-core";

export type RibbonCommandData = CommandKeys | ObservableCollection<CommandKeys> | Button;

export class RibbonGroupData extends Observable {
    readonly items: ObservableCollection<RibbonCommandData>;

    get groupName(): I18nKeys {
        return this.getPrivateValue("groupName");
    }
    set groupName(value: I18nKeys) {
        this.setProperty("groupName", value);
    }

    get modes(): Array<"2d" | "3d"> | undefined {
        return this.getPrivateValue("modes");
    }
    set modes(value: Array<"2d" | "3d"> | undefined) {
        this.setProperty("modes", value);
    }

    constructor(groupName: I18nKeys, items: RibbonCommandData[], modes?: Array<"2d" | "3d">) {
        super();
        this.setPrivateValue("groupName", groupName);
        this.setPrivateValue("modes", modes);
        this.items = new ObservableCollection<RibbonCommandData>(...items);
    }

    static fromProfile(profile: RibbonGroup) {
        const items = profile.items.map((item) => {
            return Array.isArray(item) ? new ObservableCollection(...item) : item;
        });
        return new RibbonGroupData(profile.groupName, items, profile.modes);
    }
}

export class RibbonTabData extends Observable {
    readonly groups = new ObservableCollection<RibbonGroupData>();

    get tabName(): I18nKeys {
        return this.getPrivateValue("tabName");
    }
    set tabName(value: I18nKeys) {
        this.setProperty("tabName", value);
    }

    constructor(tabName: I18nKeys, ...groups: RibbonGroupData[]) {
        super();
        this.setPrivateValue("tabName", tabName);
        this.groups.push(...groups);
    }

    static fromProfile(profile: RibbonTab) {
        return new RibbonTabData(
            profile.tabName,
            ...profile.groups.map((group) => RibbonGroupData.fromProfile(group)),
        );
    }
}

export type RibbonData = RibbonTabData[];
