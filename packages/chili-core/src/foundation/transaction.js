// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { ArrayRecord } from "./history";
import { Logger } from "./logger";
export class Transaction {
    document;
    name;
    static _transactionMap = new WeakMap();
    constructor(document, name) {
        this.document = document;
        this.name = name;
    }
    static add(document, record) {
        if (document.history.disabled) return;
        let arrayRecord = Transaction._transactionMap.get(document);
        if (arrayRecord !== undefined) {
            arrayRecord.records.push(record);
        } else {
            Transaction.addToHistory(document, record);
        }
    }
    static addToHistory(document, record) {
        document.history.add(record);
        Logger.info(`history added ${record.name}`);
    }
    static execute(document, name, action) {
        let trans = new Transaction(document, name);
        trans.start();
        try {
            action();
            trans.commit();
        } catch (e) {
            trans.rollback();
            throw e;
        }
    }
    static async executeAsync(document, name, action) {
        const trans = new Transaction(document, name);
        trans.start();
        try {
            await action();
            trans.commit();
        } catch (e) {
            trans.rollback();
            throw e;
        }
    }
    start(name) {
        const transactionName = name ?? this.name;
        if (Transaction._transactionMap.has(this.document)) {
            throw new Error(`The document has started a transaction ${this.name}`);
        }
        Transaction._transactionMap.set(this.document, new ArrayRecord(transactionName));
    }
    commit() {
        const arrayRecord = Transaction._transactionMap.get(this.document);
        if (!arrayRecord) {
            throw new Error("Transaction has not started");
        }
        if (arrayRecord.records.length > 0) Transaction.addToHistory(this.document, arrayRecord);
        Transaction._transactionMap.delete(this.document);
    }
    rollback() {
        Transaction._transactionMap.get(this.document)?.undo();
        Transaction._transactionMap.delete(this.document);
    }
}
