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
import { Precision, ShapeType, command } from "chili-core";
import { GeoUtils } from "chili-geo";
import { PrismNode } from "../../bodys";
import { LengthAtAxisStep } from "../../step";
import { SelectShapeStep } from "../../step/selectStep";
import { CreateCommand } from "../createCommand";
let Prism = class Prism extends CreateCommand {
    geometryNode() {
        const shape = this.transformdFirstShape(this.stepDatas[0], false);
        const { point, normal } = this.getAxis(shape);
        const dist = this.stepDatas[1].point.sub(point).dot(normal);
        return new PrismNode(this.document, shape, dist);
    }
    getSteps() {
        return [
            new SelectShapeStep(ShapeType.Face | ShapeType.Edge | ShapeType.Wire, "prompt.select.shape"),
            new LengthAtAxisStep("prompt.pickNextPoint", this.getLengthStepData, true),
        ];
    }
    getLengthStepData = () => {
        const shape = this.transformdFirstShape(this.stepDatas[0]);
        const { point, normal } = this.getAxis(shape);
        return {
            point,
            direction: normal,
            preview: (p) => {
                if (!p) return [];
                const dist = p.sub(point).dot(normal);
                if (Math.abs(dist) < Precision.Float) return [];
                const vec = normal.multiply(dist);
                return [this.meshCreatedShape("prism", shape, vec)];
            },
        };
    };
    getAxis(shape) {
        const point = this.stepDatas[0].shapes[0].point;
        const normal = GeoUtils.normal(shape);
        return { point, normal };
    }
};
Prism = __decorate(
    [
        command({
            key: "create.extrude",
            icon: "icon-prism",
        }),
    ],
    Prism,
);
export { Prism };
