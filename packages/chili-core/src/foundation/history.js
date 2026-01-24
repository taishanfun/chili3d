// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export class History {
    _undos = [];
    _redos = [];
    disabled = false;
    undoLimits = 50;
    #isUndoing = false;
    get isUndoing() {
        return this.#isUndoing;
    }
    #isRedoing = false;
    get isRedoing() {
        return this.#isRedoing;
    }
    dispose() {
        this._redos.forEach((record) => record.dispose());
        this._undos.forEach((record) => record.dispose());
        this.clear();
    }
    clear() {
        this._undos.length = 0;
        this._redos.length = 0;
    }
    add(record) {
        if (this.disabled) return;
        this._redos.length = 0;
        this._undos.push(record);
        if (this._undos.length > this.undoLimits) {
            const removed = this._undos.shift();
            removed?.dispose();
        }
    }
    undoCount() {
        return this._undos.length;
    }
    redoCount() {
        return this._redos.length;
    }
    undo() {
        this.#isUndoing = true;
        this.tryOperate(
            () => {
                const record = this._undos.pop();
                if (!record) return;
                record.undo();
                this._redos.push(record);
            },
            () => {
                this.#isUndoing = false;
            },
        );
    }
    redo() {
        this.#isRedoing = true;
        this.tryOperate(
            () => {
                const record = this._redos.pop();
                if (!record) return;
                record.redo();
                this._undos.push(record);
            },
            () => {
                this.#isRedoing = false;
            },
        );
    }
    tryOperate(action, onFinally) {
        const previousState = this.disabled;
        this.disabled = true;
        try {
            action();
        } finally {
            this.disabled = previousState;
            onFinally();
        }
    }
}
export class PropertyHistoryRecord {
    object;
    property;
    oldValue;
    newValue;
    name;
    constructor(object, property, oldValue, newValue) {
        this.object = object;
        this.property = property;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.name = `change ${String(property)} property`;
    }
    dispose() {}
    undo() {
        this.object[this.property] = this.oldValue;
    }
    redo() {
        this.object[this.property] = this.newValue;
    }
}
export var NodeAction;
(function (NodeAction) {
    NodeAction[(NodeAction["add"] = 0)] = "add";
    NodeAction[(NodeAction["remove"] = 1)] = "remove";
    NodeAction[(NodeAction["move"] = 2)] = "move";
    NodeAction[(NodeAction["transfer"] = 3)] = "transfer";
    NodeAction[(NodeAction["insertAfter"] = 4)] = "insertAfter";
    NodeAction[(NodeAction["insertBefore"] = 5)] = "insertBefore";
})(NodeAction || (NodeAction = {}));
export class NodeLinkedListHistoryRecord {
    records;
    name;
    constructor(records) {
        this.records = records;
        this.name = "change node";
    }
    dispose() {
        this.records.forEach((record) => {
            if (record.action === NodeAction.remove) {
                record.node.dispose();
            }
        });
        this.records.length = 0;
    }
    handleUndo(record) {
        switch (record.action) {
            case NodeAction.add:
                record.newParent?.remove(record.node);
                break;
            case NodeAction.remove:
                record.oldParent?.add(record.node);
                break;
            case NodeAction.transfer:
                record.oldParent?.add(record.node);
                break;
            case NodeAction.move:
                record.newParent?.move(record.node, record.oldParent, record.oldPrevious);
                break;
            case NodeAction.insertAfter:
                record.newParent?.remove(record.node);
                break;
            case NodeAction.insertBefore:
                record.newParent?.remove(record.node);
                break;
        }
    }
    handleRedo(record) {
        switch (record.action) {
            case NodeAction.add:
                record.newParent?.add(record.node);
                break;
            case NodeAction.remove:
                record.oldParent?.remove(record.node);
                break;
            case NodeAction.transfer:
                record.oldParent?.transfer(record.node);
                break;
            case NodeAction.move:
                record.oldParent?.move(record.node, record.newParent, record.newPrevious);
                break;
            case NodeAction.insertAfter:
                record.newParent?.insertAfter(record.newPrevious, record.node);
                break;
            case NodeAction.insertBefore:
                record.newParent?.insertBefore(record.newPrevious?.nextSibling, record.node);
                break;
        }
    }
    undo() {
        for (let i = this.records.length - 1; i >= 0; i--) {
            this.handleUndo(this.records[i]);
        }
    }
    redo() {
        this.records.forEach((record) => this.handleRedo(record));
    }
}
export class ArrayRecord {
    name;
    records = [];
    constructor(name) {
        this.name = name;
    }
    dispose() {
        this.records.forEach((r) => r.dispose());
    }
    undo() {
        for (let index = this.records.length - 1; index >= 0; index--) {
            this.records[index].undo();
        }
    }
    redo() {
        for (const record of this.records) {
            record.redo();
        }
    }
}
