// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { TreeItem } from "./treeItem";
import style from "./treeModel.module.css";
export class TreeModel extends TreeItem {
    constructor(document, node) {
        super(document, node);
        this.append(this.name, this.visibleIcon);
        this.classList.add(style.panel);
    }
    getSelectedHandler() {
        return this;
    }
}
customElements.define("tree-model", TreeModel);
