// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export class AsyncController {
    _failListeners = new Set();
    _successListeners = new Set();
    _result;
    get result() {
        return this._result;
    }
    fail = (message) => {
        this.notifyListeners(this._failListeners, "fail", message);
    };
    cancel = (message) => {
        this.notifyListeners(this._failListeners, "cancel", message);
    };
    success = (message) => {
        this.notifyListeners(this._successListeners, "success", message);
    };
    notifyListeners(listeners, status, message) {
        if (this._result === undefined) {
            this._result = { status, message };
            listeners.forEach((listener) => listener(this._result));
        }
    }
    onCancelled(listener) {
        this._failListeners.add(listener);
    }
    onCompleted(listener) {
        this._successListeners.add(listener);
    }
    dispose() {
        this._failListeners.clear();
        this._successListeners.clear();
    }
}
