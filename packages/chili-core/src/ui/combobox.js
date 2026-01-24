// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Observable, ObservableCollection } from "../foundation";
export class Combobox extends Observable {
    converter;
    constructor(converter) {
        super();
        this.converter = converter;
    }
    get selectedIndex() {
        return this.getPrivateValue("selectedIndex", 0);
    }
    set selectedIndex(value) {
        if (value < 0 || value >= this.items.length) {
            return;
        }
        this.setProperty("selectedIndex", value);
    }
    get selectedItem() {
        return this.items.at(this.selectedIndex);
    }
    items = new ObservableCollection();
}
