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
import { Matrix4 } from "../math";
import { Serializer } from "../serialize";
import { FolderNode } from "./folderNode";
let GroupNode = class GroupNode extends FolderNode {
    get transform() {
        return this.getPrivateValue("transform", Matrix4.identity());
    }
    set transform(value) {
        this.setProperty("transform", value, undefined, {
            equals: (left, right) => left.equals(right),
        });
    }
};
__decorate([Serializer.serialze()], GroupNode.prototype, "transform", null);
GroupNode = __decorate([Serializer.register(["document", "name", "id"])], GroupNode);
export { GroupNode };
