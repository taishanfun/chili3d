// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Observable, ObservableCollection } from "chili-core";
export class RibbonGroupData extends Observable {
    items;
    get groupName() {
        return this.getPrivateValue("groupName");
    }
    set groupName(value) {
        this.setProperty("groupName", value);
    }
    get modes() {
        return this.getPrivateValue("modes");
    }
    set modes(value) {
        this.setProperty("modes", value);
    }
    constructor(groupName, items, modes) {
        super();
        this.setPrivateValue("groupName", groupName);
        this.setPrivateValue("modes", modes);
        this.items = new ObservableCollection(...items);
    }
    static fromProfile(profile) {
        const items = profile.items.map((item) => {
            return Array.isArray(item) ? new ObservableCollection(...item) : item;
        });
        return new RibbonGroupData(profile.groupName, items, profile.modes);
    }
}
export class RibbonTabData extends Observable {
    groups = new ObservableCollection();
    get tabName() {
        return this.getPrivateValue("tabName");
    }
    set tabName(value) {
        this.setProperty("tabName", value);
    }
    constructor(tabName, ...groups) {
        super();
        this.setPrivateValue("tabName", tabName);
        this.groups.push(...groups);
    }
    static fromProfile(profile) {
        return new RibbonTabData(
            profile.tabName,
            ...profile.groups.map((group) => RibbonGroupData.fromProfile(group)),
        );
    }
}
