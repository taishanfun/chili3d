// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export class ObjectStorage {
    static default = new ObjectStorage("chili3d", "app");
    prefix;
    constructor(organization, application) {
        this.prefix = `${organization}.${application}.`;
    }
    setValue(key, value) {
        const storageKey = this.prefix + key;
        try {
            const stringValue = JSON.stringify(value);
            localStorage.setItem(storageKey, stringValue);
        } catch (error) {
            console.error(`Failed to set setting ${key}:`, error);
        }
    }
    value(key, defaultValue) {
        const storageKey = this.prefix + key;
        const item = localStorage.getItem(storageKey);
        if (!item) {
            return defaultValue;
        }
        try {
            return JSON.parse(item);
        } catch (error) {
            console.error(`Failed to get setting ${key}:`, error);
            return defaultValue;
        }
    }
    remove(key) {
        const storageKey = this.prefix + key;
        localStorage.removeItem(storageKey);
    }
    clear() {
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }
}
