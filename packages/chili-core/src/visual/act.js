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
var Act_1;
import { Observable } from "../foundation";
import { Serializer } from "../serialize";
let Act = (Act_1 = class Act extends Observable {
    get name() {
        return this.getPrivateValue("name");
    }
    set name(value) {
        this.setProperty("name", value);
    }
    get cameraPosition() {
        return this.getPrivateValue("cameraPosition");
    }
    set cameraPosition(value) {
        this.setProperty("cameraPosition", value);
    }
    get cameraTarget() {
        return this.getPrivateValue("cameraTarget");
    }
    set cameraTarget(value) {
        this.setProperty("cameraTarget", value);
    }
    get cameraUp() {
        return this.getPrivateValue("cameraUp");
    }
    set cameraUp(value) {
        this.setProperty("cameraUp", value);
    }
    static fromView(view, name) {
        return new Act_1(
            name,
            view.cameraController.cameraPosition,
            view.cameraController.cameraTarget,
            view.cameraController.cameraUp,
        );
    }
    constructor(name, cameraPosition, cameraTarget, cameraUp) {
        super();
        this.setPrivateValue("name", name);
        this.setPrivateValue("cameraPosition", cameraPosition);
        this.setPrivateValue("cameraTarget", cameraTarget);
        this.setPrivateValue("cameraUp", cameraUp);
    }
});
__decorate([Serializer.serialze()], Act.prototype, "name", null);
__decorate([Serializer.serialze()], Act.prototype, "cameraPosition", null);
__decorate([Serializer.serialze()], Act.prototype, "cameraTarget", null);
__decorate([Serializer.serialze()], Act.prototype, "cameraUp", null);
Act = Act_1 = __decorate([Serializer.register(["name", "cameraPosition", "cameraTarget", "cameraUp"])], Act);
export { Act };
