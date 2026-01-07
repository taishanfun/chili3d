// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { IDocument } from "./document";
import { HistoryObservable, Id } from "./foundation";
import { Property } from "./property";
import { Serializer } from "./serialize";
import { LineType } from "./shape";

@Serializer.register(["document", "name", "visible", "locked", "color", "lineType", "id"])
export class Layer extends HistoryObservable {
    @Serializer.serialze()
    readonly id: string;

    @Serializer.serialze()
    @Property.define("common.name")
    get name(): string {
        return this.getPrivateValue("name");
    }
    set name(value: string) {
        const next = value?.trim()?.length ? value.trim() : "unnamed";
        this.setProperty("name", next);
    }

    @Serializer.serialze()
    get visible(): boolean {
        return this.getPrivateValue("visible", true);
    }
    set visible(value: boolean) {
        this.setProperty("visible", value);
    }

    @Serializer.serialze()
    @Property.define("layer.locked")
    get locked(): boolean {
        return this.getPrivateValue("locked", false);
    }
    set locked(value: boolean) {
        this.setProperty("locked", value);
    }

    @Serializer.serialze()
    @Property.define("common.color", { type: "color" })
    get color(): number | string {
        return this.getPrivateValue("color");
    }
    set color(value: number | string) {
        this.setProperty("color", value);
    }

    @Serializer.serialze()
    get lineType(): LineType {
        return this.getPrivateValue("lineType", LineType.Solid);
    }
    set lineType(value: LineType) {
        this.setProperty("lineType", value);
    }

    visibleChanged(handler: (layer: Layer, visible: boolean) => void): void {
        this.onPropertyChanged((prop) => {
            if (prop === "visible") {
                handler(this, this.visible);
            }
        });
    }

    constructor(
        document: IDocument,
        name: string,
        color: number | string,
        lineType: LineType = LineType.Solid,
        id: string = Id.generate(),
    ) {
        super(document);
        this.id = id;
        this.setPrivateValue("name", name?.length > 0 ? name : "unnamed");
        this.setPrivateValue("color", color);
        this.setPrivateValue("lineType", lineType);
        this.setPrivateValue("visible", true);
        this.setPrivateValue("locked", false);
    }
}
