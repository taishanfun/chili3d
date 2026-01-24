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
import { Node } from "./node";
export class VisualNode extends Node {
    constructor(...args) {
        super(...args);
        const defaultLayerId = this.document.currentLayerId ?? this.document.layers.at(0)?.id ?? "";
        this.setPrivateValue("layerId", defaultLayerId);
        this.attachLayer();
    }
    get layerId() {
        return this.getPrivateValue(
            "layerId",
            this.document.currentLayerId ?? this.document.layers.at(0)?.id ?? "",
        );
    }
    set layerId(value) {
        if (this.layerId === value) return;
        this.detachLayer();
        this.setProperty("layerId", value, () => {
            this.attachLayer();
            this.document.visual.context.redrawNode([this]);
        });
    }
    get transform() {
        return this.getPrivateValue("transform", Matrix4.identity());
    }
    set transform(value) {
        this.setProperty("transform", value, undefined, {
            equals: (left, right) => left.equals(right),
        });
    }
    worldTransform() {
        const visual = this.document.visual.context.getVisual(this);
        if (visual) {
            return visual.worldTransform();
        }
        return this.transform;
    }
    _layer;
    _onLayerPropertyChanged = (property) => {
        if (property === "visible") {
            this.updateVisible();
        } else if (property === "color" || property === "lineType") {
            this.document.visual.context.redrawNode([this]);
        }
    };
    attachLayer() {
        if (this._layer) return;
        if (!this.layerId) return;
        const layer = this.document.layers.find((l) => l.id === this.layerId);
        if (!layer) return;
        this._layer = layer;
        layer.onPropertyChanged(this._onLayerPropertyChanged);
        this.updateVisible();
    }
    detachLayer() {
        if (!this._layer) return;
        this._layer.removePropertyChanged(this._onLayerPropertyChanged);
        this._layer = undefined;
    }
    updateVisible() {
        const layerVisible = this._layer?.visible ?? true;
        this.document.visual.context.setVisible(this, this.visible && this.parentVisible && layerVisible);
    }
    syncLayer() {
        this.detachLayer();
        this.attachLayer();
    }
    onVisibleChanged() {
        this.updateVisible();
    }
    onParentVisibleChanged() {
        this.updateVisible();
    }
    disposeInternal() {
        this.detachLayer();
        super.disposeInternal();
    }
}
__decorate([Serializer.serialze()], VisualNode.prototype, "layerId", null);
__decorate([Serializer.serialze()], VisualNode.prototype, "transform", null);
