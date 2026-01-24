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
import { EditableShapeNode, I18n, JoinType, ShapeType, command } from "chili-core";
import { GeoUtils } from "chili-geo";
import { LengthAtAxisStep, SelectShapeStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";
let OffsetCommand = class OffsetCommand extends MultistepCommand {
    executeMainTask() {
        const normal = this.getAxis().normal;
        const shape = this.createOffsetShape(normal, this.stepDatas[1].distance);
        const node = new EditableShapeNode(
            this.document,
            I18n.translate("command.create.offset"),
            shape.value,
        );
        this.document.rootNode.add(node);
        this.document.visual.update();
    }
    getSteps() {
        return [
            new SelectShapeStep(ShapeType.Edge | ShapeType.Wire | ShapeType.Face, "prompt.select.shape"),
            new LengthAtAxisStep("common.length", () => {
                let ax = this.getAxis();
                return {
                    point: ax.point,
                    direction: ax.direction,
                    preview: (point) => this.preview(ax, point),
                };
            }),
        ];
    }
    preview(ax, point) {
        let res = [this.meshPoint(ax.point)];
        if (point !== undefined) {
            res.push(this.meshLine(ax.point, point));
            let distance = point.sub(ax.point).dot(ax.direction);
            let shape = this.createOffsetShape(ax.normal, distance);
            if (shape.isOk) {
                res.push(shape.value.edgesMeshPosition());
            }
        }
        return res;
    }
    getAxis() {
        let start = this.stepDatas[0].shapes[0].point;
        let shape = this.transformdFirstShape(this.stepDatas[0]);
        if (shape.shapeType === ShapeType.Edge) {
            return this.getEdgeAxis(shape, start);
        }
        return this.getFaceOrWireAxis(shape, start);
    }
    getFaceOrWireAxis(shape, start) {
        let face = shape;
        if (shape.shapeType === ShapeType.Wire) {
            face = shape.toFace().value;
        }
        const normal = face.normal(0, 0)[1];
        const { nearest, direction } = this.getNearstPointAndDirection(shape, start, normal);
        return {
            point: nearest.point,
            normal,
            direction: direction.cross(normal).normalize(),
        };
    }
    getEdgeAxis(edge, start) {
        const curve = edge.curve;
        const direction = curve.dn(curve.parameter(start, 1e-3), 1);
        const normal = GeoUtils.normal(edge);
        return {
            point: start,
            normal,
            direction: direction.cross(normal).normalize(),
        };
    }
    getNearstPointAndDirection(shape, start, normal) {
        let wire = shape;
        if (shape.shapeType === ShapeType.Face) {
            wire = shape.outerWire();
        }
        const nearest = GeoUtils.nearestPoint(wire, start);
        const nextEdge = GeoUtils.findNextEdge(wire, nearest.edge).value;
        let direction = nearest.edge.curve.dn(0, 1);
        const scale = nearest.edge.orientation() === nextEdge.orientation() ? 1 : -1;
        const nextDirection = nextEdge.curve.dn(0, 1).multiply(scale);
        if (direction.cross(nextDirection).normalize()?.isOppositeTo(normal)) {
            direction = direction.multiply(-1);
        }
        return { nearest, direction };
    }
    createOffsetShape(normal, distance) {
        let shape = this.transformdFirstShape(this.stepDatas[0]);
        if (shape.shapeType === ShapeType.Edge) {
            return shape.offset(distance, normal);
        }
        let wire = shape;
        if (shape.shapeType === ShapeType.Face) {
            wire = shape.outerWire();
        }
        return wire.offset(distance, JoinType.intersection);
    }
};
OffsetCommand = __decorate(
    [
        command({
            key: "create.offset",
            icon: "icon-offset",
        }),
    ],
    OffsetCommand,
);
export { OffsetCommand };
