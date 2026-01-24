// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { History, NodeLinkedListHistoryRecord, Transaction } from "../src";
export class TestDocument {
    history = new History();
    notifyNodeChanged(records) {
        Transaction.add(this, new NodeLinkedListHistoryRecord(records));
    }
    addNodeObserver(observer) {}
}
