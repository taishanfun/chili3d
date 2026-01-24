// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export var CollectionAction;
(function (CollectionAction) {
    CollectionAction[(CollectionAction["add"] = 0)] = "add";
    CollectionAction[(CollectionAction["remove"] = 1)] = "remove";
    CollectionAction[(CollectionAction["move"] = 2)] = "move";
    CollectionAction[(CollectionAction["replace"] = 3)] = "replace";
})(CollectionAction || (CollectionAction = {}));
export class ObservableCollection {
    _callbacks = new Set();
    _items;
    constructor(...items) {
        this._items = [...items];
    }
    push(...items) {
        if (items.length === 0) return;
        this._items.push(...items);
        this.notifyChange({
            action: CollectionAction.add,
            items,
        });
    }
    remove(...items) {
        if (items.length === 0) return;
        const itemSet = new Set(items);
        this._items = this._items.filter((item) => !itemSet.has(item));
        this.notifyChange({
            action: CollectionAction.remove,
            items,
        });
    }
    move(from, to) {
        if (!this.isValidMove(from, to)) return;
        const items = this._items.splice(from, 1);
        this._items.splice(from < to ? to - 1 : to, 0, ...items);
        this.notifyChange({
            action: CollectionAction.move,
            from,
            to,
        });
    }
    isValidMove(from, to) {
        return from !== to && from >= 0 && from < this._items.length && to >= 0 && to < this._items.length;
    }
    clear() {
        if (this._items.length === 0) return;
        const items = [...this._items];
        this._items = [];
        this.notifyChange({
            action: CollectionAction.remove,
            items,
        });
    }
    get length() {
        return this._items.length;
    }
    replace(index, ...items) {
        if (!this.isValidIndex(index)) return;
        const item = this._items[index];
        this._items.splice(index, 1, ...items);
        this.notifyChange({
            action: CollectionAction.replace,
            index,
            item,
            items,
        });
    }
    isValidIndex(index) {
        return index >= 0 && index < this._items.length;
    }
    notifyChange(args) {
        this._callbacks.forEach((callback) => callback(args));
    }
    forEach(callback) {
        this.items.forEach(callback);
    }
    map(callback) {
        return this.items.map(callback);
    }
    get items() {
        return [...this._items];
    }
    [Symbol.iterator]() {
        return this.items[Symbol.iterator]();
    }
    item(index) {
        return this._items[index];
    }
    at(index) {
        return this._items.at(index);
    }
    filter(predicate) {
        return this._items.filter(predicate);
    }
    find(predicate) {
        return this._items.find(predicate);
    }
    indexOf(item, fromIndex) {
        return this._items.indexOf(item, fromIndex);
    }
    contains(item) {
        return this._items.indexOf(item) !== -1;
    }
    get count() {
        return this._items.length;
    }
    onCollectionChanged(callback) {
        this._callbacks.add(callback);
    }
    removeCollectionChanged(callback) {
        this._callbacks.delete(callback);
    }
    dispose() {
        this._callbacks.clear();
        this._items.length = 0;
    }
}
export var SelectMode;
(function (SelectMode) {
    SelectMode[(SelectMode["check"] = 0)] = "check";
    SelectMode[(SelectMode["radio"] = 1)] = "radio";
    SelectMode[(SelectMode["combo"] = 2)] = "combo";
})(SelectMode || (SelectMode = {}));
export class SelectableItems {
    mode;
    items;
    selectedItems;
    get selectedIndexes() {
        let indexes = [];
        this.selectedItems.forEach((x) => {
            let index = this.items.indexOf(x);
            if (index > -1) {
                indexes.push(index);
            }
        });
        return indexes;
    }
    firstSelectedItem() {
        return this.selectedItems.values().next().value;
    }
    constructor(items, mode = SelectMode.radio, selectedItems) {
        this.mode = mode;
        this.items = items;
        this.selectedItems = new Set(selectedItems ?? []);
    }
}
