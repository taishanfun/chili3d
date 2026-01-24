// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Constants, Logger } from "chili-core";
export class IndexedDBStorage {
    version = 4;
    async get(database, table, id) {
        const db = await this.open(database, table, this.version);
        try {
            return await IndexedDBStorage.get(db, table, id);
        } finally {
            db.close();
        }
    }
    async put(database, table, id, value) {
        const db = await this.open(database, table, this.version);
        try {
            return await IndexedDBStorage.put(db, table, id, value);
        } finally {
            db.close();
        }
    }
    async delete(database, table, id) {
        const db = await this.open(database, table, this.version);
        try {
            return await IndexedDBStorage.delete(db, table, id);
        } finally {
            db.close();
        }
    }
    async page(database, table, page) {
        const db = await this.open(database, table, this.version);
        try {
            return await IndexedDBStorage.getPage(db, table, page);
        } finally {
            db.close();
        }
    }
    open(dbName, storeName, version, options) {
        let request = window.indexedDB.open(dbName, version);
        return new Promise((resolve, reject) => {
            request.onsuccess = (e) => {
                Logger.info(`open ${dbName} success`);
                resolve(e.target.result);
            };
            request.onerror = (e) => {
                Logger.error(`open ${dbName} error`);
                reject(e);
            };
            request.onupgradeneeded = (e) => {
                Logger.info(`upgrade ${dbName}`);
                let db = e.target.result;
                [Constants.DocumentTable, Constants.RecentTable].forEach((store) => {
                    if (!db.objectStoreNames.contains(store)) {
                        Logger.info(`create store ${store}`);
                        db.createObjectStore(store, options);
                    }
                });
            };
        });
    }
    static get(db, storeName, key) {
        const request = db.transaction([storeName], "readonly").objectStore(storeName).get(key);
        return new Promise((resolve, reject) => {
            request.onsuccess = (e) => {
                Logger.info(`${storeName} store get object success`);
                resolve(e.target.result);
            };
            request.onerror = (e) => {
                Logger.error(`${storeName} store get object error`);
                reject(e);
            };
        });
    }
    /**
     *
     * @param db IDBDatabase
     * @param storeName store name
     * @param page page, start with 0
     * @param count items per page
     * @returns
     */
    static getPage(db, storeName, page, count = 20) {
        const result = [];
        let index = 0;
        let isAdvanced = false;
        const request = db.transaction([storeName], "readonly").objectStore(storeName).openCursor();
        return new Promise((resolve, reject) => {
            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (!cursor || index === count) {
                    Logger.info(`${storeName} store get objects success`);
                    resolve(result);
                } else if (!isAdvanced && page * count > 0) {
                    isAdvanced = true;
                    cursor.advance(page * count);
                } else {
                    result.push(cursor.value);
                    index++;
                    cursor.continue();
                }
            };
            request.onerror = (e) => {
                Logger.error(`${storeName} store get objects error`);
                reject(e);
            };
        });
    }
    static delete(db, storeName, key) {
        const request = db.transaction([storeName], "readwrite").objectStore(storeName).delete(key);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                Logger.info(`${storeName} store delete object success`);
                resolve(true);
            };
            request.onerror = (e) => {
                Logger.error(`${storeName} store delete object error`);
                reject(e);
            };
        });
    }
    static put(db, storeName, key, value) {
        const request = db.transaction([storeName], "readwrite").objectStore(storeName).put(value, key);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                Logger.info(`${storeName} store put object success`);
                resolve(true);
            };
            request.onerror = (e) => {
                Logger.error(`${storeName} store put object error`);
                reject(e);
            };
        });
    }
}
