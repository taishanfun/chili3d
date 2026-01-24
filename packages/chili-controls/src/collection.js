// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { CollectionAction, ObservableCollection } from "chili-core";
import { setProperties } from "./controls";
export class Collection extends HTMLElement {
    props;
    _itemMap = new Map();
    constructor(props) {
        super();
        this.props = props;
        setProperties(this, props);
    }
    getItem(item) {
        return this._itemMap.get(item);
    }
    connectedCallback() {
        const items = Array.isArray(this.props.sources) ? this.props.sources : this.props.sources.items;
        this.append(...this._mapItems(items));
        if (this.props.sources instanceof ObservableCollection)
            this.props.sources.onCollectionChanged(this._onCollectionChanged);
    }
    disconnectedCallback() {
        this._itemMap.forEach((x) => x.remove());
        this._itemMap.clear();
        if (this.props.sources instanceof ObservableCollection)
            this.props.sources.removeCollectionChanged(this._onCollectionChanged);
    }
    _onCollectionChanged = (args) => {
        switch (args.action) {
            case CollectionAction.add:
                this.append(...this._mapItems(args.items));
                break;
            case CollectionAction.remove:
                this._removeItem(args.items);
                break;
            case CollectionAction.move:
                this._moveItem(args.from, args.to);
                break;
            case CollectionAction.replace:
                this._replaceItem(args.index, args.item, args.items);
                break;
            default:
                throw new Error("Unknown collection action");
        }
    };
    _moveItem(from, to) {
        const item1 = this.children.item(from);
        const item2 = this.children.item(to);
        if (item1 && item2) this.insertBefore(item1, item2);
    }
    _replaceItem(index, item, items) {
        const child = this._itemMap.get(item);
        if (child) {
            items.forEach((item, i) => {
                const e = this.props.template(item, index + i);
                this._itemMap.set(item, e);
                this.insertBefore(e, child);
            });
            this._removeItem([item]);
        }
    }
    _mapItems(items) {
        const index = this._itemMap.size;
        return items.map((item, i) => {
            if (this._itemMap.has(item)) return this._itemMap.get(item);
            const e = this.props.template(item, index + i);
            this._itemMap.set(item, e);
            return e;
        });
    }
    _removeItem(items) {
        items.forEach((item) => {
            const child = this._itemMap.get(item);
            if (child) {
                child.remove();
                this._itemMap.delete(item);
            }
        });
    }
}
customElements.define("chili-collection", Collection);
