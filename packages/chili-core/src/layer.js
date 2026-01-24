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
import { HistoryObservable, Id } from "./foundation";
import { Property } from "./property";
import { Serializer } from "./serialize";
import { LineType } from "./shape";
let Layer = class Layer extends HistoryObservable {
    id;
    get name() {
        return this.getPrivateValue("name");
    }
    set name(value) {
        const next = value?.trim()?.length ? value.trim() : "unnamed";
        this.setProperty("name", next);
    }
    get visible() {
        return this.getPrivateValue("visible", true);
    }
    set visible(value) {
        this.setProperty("visible", value);
    }
    get locked() {
        return this.getPrivateValue("locked", false);
    }
    set locked(value) {
        this.setProperty("locked", value);
    }
    get color() {
        return this.getPrivateValue("color");
    }
    set color(value) {
        this.setProperty("color", value);
    }
    get lineType() {
        return this.getPrivateValue("lineType", LineType.Solid);
    }
    set lineType(value) {
        this.setProperty("lineType", value);
    }
    visibleChanged(handler) {
        this.onPropertyChanged((prop) => {
            if (prop === "visible") {
                handler(this, this.visible);
            }
        });
    }
    constructor(document, name, color, lineType = LineType.Solid, id = Id.generate()) {
        super(document);
        this.id = id;
        this.setPrivateValue("name", name?.length > 0 ? name : "unnamed");
        this.setPrivateValue("color", color);
        this.setPrivateValue("lineType", lineType);
        this.setPrivateValue("visible", true);
        this.setPrivateValue("locked", false);
    }
};
__decorate([Serializer.serialze()], Layer.prototype, "id", void 0);
__decorate([Serializer.serialze(), Property.define("common.name")], Layer.prototype, "name", null);
__decorate([Serializer.serialze()], Layer.prototype, "visible", null);
__decorate([Serializer.serialze(), Property.define("layer.locked")], Layer.prototype, "locked", null);
__decorate(
    [Serializer.serialze(), Property.define("common.color", { type: "color" })],
    Layer.prototype,
    "color",
    null,
);
__decorate([Serializer.serialze()], Layer.prototype, "lineType", null);
Layer = __decorate(
    [Serializer.register(["document", "name", "visible", "locked", "color", "lineType", "id"])],
    Layer,
);
export { Layer };
