// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
var __decorate =
    (this && this.__decorate) ||
    function (decorators, target, key, desc) {
        var c = arguments.length,
            r =
                c < 3
                    ? target
                    : desc === null
                      ? (desc = Object.getOwnPropertyDescriptor(target, key))
                      : desc,
            d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if ((d = decorators[i]))
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
var Result_1;
import { Serializer } from "../serialize";
import { Logger } from "./logger";
let Result = (Result_1 = class Result {
    #isOk;
    #value;
    #error;
    get isOk() {
        return this.#isOk;
    }
    get value() {
        if (!this.#isOk) Logger.warn("Result is error");
        return this.#value;
    }
    get error() {
        if (this.#isOk) Logger.warn("Result is ok");
        return this.#error;
    }
    constructor(isOk, value, error) {
        this.#isOk = isOk;
        this.#value = value;
        this.#error = error;
    }
    parse() {
        return Result_1.err(this.#error);
    }
    isOkAnd(predict) {
        return this.#isOk && predict(this.#value);
    }
    isErrorOr(predict) {
        return !this.#isOk || predict(this.#value);
    }
    unchecked() {
        return this.#value;
    }
    static ok(value) {
        return new Result_1(true, value, undefined);
    }
    static err(error) {
        return new Result_1(false, undefined, error);
    }
});
__decorate([Serializer.serialze()], Result.prototype, "isOk", null);
__decorate([Serializer.serialze()], Result.prototype, "value", null);
__decorate([Serializer.serialze()], Result.prototype, "error", null);
Result = Result_1 = __decorate([Serializer.register(["isOk", "value", "error"])], Result);
export { Result };
export class ResultEqualityComparer {
    equal;
    constructor(equal) {
        this.equal = equal;
    }
    equals(left, right) {
        if (!left.isOk || !right.isOk) return false;
        return this.equal ? this.equal(left.value, right.value) : left.value === right.value;
    }
}
