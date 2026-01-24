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
import { FolderNode, NodeSerializer, Serializer } from "../src";
import { TestDocument } from "./testDocument";
let TestObject = class TestObject {
    k2 = "k2";
    k3 = "k3";
    k1;
    k4 = "k4";
    k5 = "k5";
    k6 = "k6";
    constructor(k1) {
        this.k1 = k1;
    }
    serialize() {
        return Serializer.serializeObject(this);
    }
};
__decorate([Serializer.serialze()], TestObject.prototype, "k1", void 0);
__decorate([Serializer.serialze()], TestObject.prototype, "k4", void 0);
__decorate([Serializer.serialze()], TestObject.prototype, "k5", void 0);
__decorate([Serializer.serialze()], TestObject.prototype, "k6", void 0);
TestObject = __decorate([Serializer.register(["k1"])], TestObject);
test("test Serializer", () => {
    let obj = new TestObject("111");
    let s = obj.serialize();
    expect("k1" in s.properties).toBeTruthy();
    expect("k4" in s.properties).toBeTruthy();
    expect("k5" in s.properties).toBeTruthy();
    expect("k6" in s.properties).toBeTruthy();
    s.properties["k1"] = "222";
    let obj2 = Serializer.deserializeObject({}, s);
    expect(obj2.k1).toBe("222");
});
test("test Node Serializer", () => {
    let doc = new TestDocument();
    let n1 = new FolderNode(doc, "n1");
    let n2 = new FolderNode(doc, "n2");
    let n3 = new FolderNode(doc, "n3");
    let n4 = new FolderNode(doc, "n4");
    n1.add(n2, n3);
    n2.add(n4);
    let s = NodeSerializer.serialize(n1);
    NodeSerializer.deserialize(doc, s).then((n11) => {
        expect(n11.firstChild.name).toBe("n2");
        expect(n11.firstChild.nextSibling.name).toBe("n3");
        expect(n11.firstChild.firstChild.name).toBe("n4");
    });
});
