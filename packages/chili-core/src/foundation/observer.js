// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { PropertyHistoryRecord } from "./history";
import { Logger } from "./logger";
import { Transaction } from "./transaction";
export function isPropertyChanged(obj) {
    return (
        obj && typeof obj.onPropertyChanged === "function" && typeof obj.removePropertyChanged === "function"
    );
}
export class Observable {
    propertyChangedHandlers = new Set();
    _isDisposed = false;
    getPrivateKey(pubKey) {
        return `_${String(pubKey)}`;
    }
    getPrivateValue(pubKey, defaultValue) {
        const privateKey = this.getPrivateKey(pubKey);
        return privateKey in this ? this[privateKey] : this.initializeDefaultValue(pubKey, defaultValue);
    }
    initializeDefaultValue(pubKey, defaultValue) {
        if (defaultValue === undefined) {
            Logger.warn(
                `${this.constructor.name}: The property "${String(pubKey)}" is not initialized, and no default value is provided`,
            );
            return undefined;
        }
        const privateKey = this.getPrivateKey(pubKey);
        this[privateKey] = defaultValue;
        return defaultValue;
    }
    setPrivateValue(pubKey, newValue) {
        this[this.getPrivateKey(pubKey)] = newValue;
    }
    /**
     * Set the value of a private property, and if successful, execute emitPropertyChanged.
     *
     * Note: The private property name must be the public property name with the prefix _, i.e., age->_age(private property name).
     */
    setProperty(property, newValue, onPropertyChanged, equals) {
        const oldValue = this[property];
        if (this.isEuqals(oldValue, newValue, equals)) return false;
        this.setPrivateValue(property, newValue);
        onPropertyChanged?.(property, oldValue);
        this.emitPropertyChanged(property, oldValue);
        return true;
    }
    isEuqals(oldValue, newValue, equals) {
        return equals ? equals.equals(oldValue, newValue) : oldValue === newValue;
    }
    emitPropertyChanged(property, oldValue) {
        Array.from(this.propertyChangedHandlers).forEach((cb) => cb(property, this, oldValue));
    }
    onPropertyChanged(handler) {
        this.propertyChangedHandlers.add(handler);
    }
    removePropertyChanged(handler) {
        this.propertyChangedHandlers.delete(handler);
    }
    clearPropertyChanged() {
        this.propertyChangedHandlers.clear();
    }
    dispose = () => {
        if (this._isDisposed) return;
        this._isDisposed = true;
        this.disposeInternal();
    };
    disposeInternal() {
        this.propertyChangedHandlers.clear();
    }
}
export class HistoryObservable extends Observable {
    _document;
    get document() {
        return this._document;
    }
    constructor(document) {
        super();
        this._document = document;
    }
    setProperty(property, newValue, onPropertyChanged, equals) {
        return super.setProperty(
            property,
            newValue,
            (property, oldValue) => {
                onPropertyChanged?.(property, oldValue);
                Transaction.add(
                    this.document,
                    new PropertyHistoryRecord(this, property, oldValue, newValue),
                );
            },
            equals,
        );
    }
    disposeInternal() {
        super.disposeInternal();
        this._document = null;
    }
}
