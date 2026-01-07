// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { I18nKeys } from "../i18n";
import { Layer } from "../layer";
import { BoundingBox, Matrix4 } from "../math";
import { Serializer } from "../serialize";
import { Node } from "./node";

export abstract class VisualNode extends Node {
    abstract display(): I18nKeys;

    constructor(...args: ConstructorParameters<typeof Node>) {
        super(...args);
        const defaultLayerId = this.document.currentLayerId ?? this.document.layers.at(0)?.id ?? "";
        this.setPrivateValue("layerId", defaultLayerId);
        this.attachLayer();
    }

    @Serializer.serialze()
    get layerId(): string {
        return this.getPrivateValue(
            "layerId",
            this.document.currentLayerId ?? this.document.layers.at(0)?.id ?? "",
        );
    }
    set layerId(value: string) {
        if (this.layerId === value) return;
        this.detachLayer();
        this.setProperty("layerId", value, () => {
            this.attachLayer();
            this.document.visual.context.redrawNode([this]);
        });
    }

    @Serializer.serialze()
    get transform(): Matrix4 {
        return this.getPrivateValue("transform", Matrix4.identity());
    }
    set transform(value: Matrix4) {
        this.setProperty("transform", value, undefined, {
            equals: (left, right) => left.equals(right),
        });
    }

    worldTransform(): Matrix4 {
        const visual = this.document.visual.context.getVisual(this);
        if (visual) {
            return visual.worldTransform();
        }
        return this.transform;
    }

    private _layer?: Layer;
    private readonly _onLayerPropertyChanged = (property: keyof Layer) => {
        if (property === "visible") {
            this.updateVisible();
        } else if (property === "color" || property === "lineType") {
            this.document.visual.context.redrawNode([this]);
        }
    };

    private attachLayer() {
        if (this._layer) return;
        if (!this.layerId) return;
        const layer = this.document.layers.find((l) => l.id === this.layerId);
        if (!layer) return;
        this._layer = layer;
        layer.onPropertyChanged(this._onLayerPropertyChanged);
        this.updateVisible();
    }

    private detachLayer() {
        if (!this._layer) return;
        this._layer.removePropertyChanged(this._onLayerPropertyChanged);
        this._layer = undefined;
    }

    private updateVisible() {
        const layerVisible = this._layer?.visible ?? true;
        this.document.visual.context.setVisible(this, this.visible && this.parentVisible && layerVisible);
    }

    syncLayer() {
        this.detachLayer();
        this.attachLayer();
    }

    protected onVisibleChanged(): void {
        this.updateVisible();
    }

    protected onParentVisibleChanged(): void {
        this.updateVisible();
    }

    abstract boundingBox(): BoundingBox | undefined;

    override disposeInternal(): void {
        this.detachLayer();
        super.disposeInternal();
    }
}
