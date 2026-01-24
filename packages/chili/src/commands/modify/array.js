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
import {
    AsyncController,
    BoundingBox,
    command,
    Component,
    ComponentNode,
    GeometryNode,
    LineType,
    MathUtils,
    Matrix4,
    MeshNode,
    Plane,
    PlaneAngle,
    Precision,
    Property,
    PubSub,
    Ray,
    Transaction,
    VisualNode,
    XYZ,
} from "chili-core";
import { Dimension } from "../../snap";
import { AngleStep, LengthAtPlaneStep, PointOnAxisStep, PointStep } from "../../step";
import { MultistepCommand } from "../multistepCommand";
let ArrayCommand = class ArrayCommand extends MultistepCommand {
    _planeAngle;
    _meshId = undefined;
    models;
    positions;
    get isGroup() {
        return this.getPrivateValue("isGroup", true);
    }
    set isGroup(value) {
        this.setProperty("isGroup", value);
    }
    get circularPattern() {
        return this.getPrivateValue("circularPattern", false);
    }
    set circularPattern(value) {
        this.setProperty("circularPattern", value, () => {
            this.restart();
        });
    }
    get count() {
        return this.getPrivateValue("count", 3);
    }
    set count(value) {
        this.setProperty("count", value, () => this.resetMesh());
    }
    get numberX() {
        return this.getPrivateValue("numberX", 3);
    }
    set numberX(value) {
        this.setProperty("numberX", value, () => this.resetMesh());
    }
    get numberY() {
        return this.getPrivateValue("numberY", 3);
    }
    set numberY(value) {
        this.setProperty("numberY", value, () => this.resetMesh());
    }
    get numberZ() {
        return this.getPrivateValue("numberZ", 3);
    }
    set numberZ(value) {
        this.setProperty("numberZ", value, () => this.resetMesh());
    }
    async ensureSelectedModels() {
        this.models = this.document.selection.getSelectedNodes().filter((x) => x instanceof VisualNode);
        if (this.models.length > 0) return true;
        this.controller = new AsyncController();
        this.models = await this.document.selection.pickNode("prompt.select.models", this.controller, true);
        if (this.models.length > 0) return true;
        if (this.controller.result?.status === "success") {
            PubSub.default.pub("showToast", "toast.select.noSelected");
        }
        return false;
    }
    async canExcute() {
        if (this.positions) return true;
        if (!(await this.ensureSelectedModels())) return false;
        this.collectionPosition();
        return true;
    }
    collectionPosition() {
        this.positions = this.models.flatMap((model) => {
            if (model instanceof MeshNode) {
                return model.mesh.position ? model.transform.ofPoints(model.mesh.position) : [];
            } else if (model instanceof GeometryNode) {
                return model.mesh.edges?.position ? model.transform.ofPoints(model.mesh.edges.position) : [];
            } else if (model instanceof ComponentNode) {
                return Array.from(BoundingBox.wireframe(model.boundingBox()).position);
            }
            return [];
        });
    }
    afterExecute() {
        this.removeMesh();
        super.afterExecute();
    }
    removeMesh() {
        if (this._meshId) {
            this.document.visual.context.removeMesh(this._meshId);
            this._meshId = undefined;
        }
    }
    resetMesh() {
        this.removeMesh();
        if (!this.positions) return;
        let count = this.count;
        if (!this.circularPattern) {
            count = this.numberX * this.numberY * this.numberZ;
        }
        const positions = new Float32Array(this.positions.length * count);
        for (let i = 0; i < count; i++) {
            positions.set(this.positions, i * this.positions.length);
        }
        this._meshId = this.document.visual.context.displayLineSegments({
            position: positions,
            lineType: LineType.Solid,
            range: [],
        });
    }
    updatePosition = (matrixs) => {
        const positions = new Float32Array(this.positions.length * matrixs.length);
        for (let i = 0; i < matrixs.length; i++) {
            positions.set(matrixs[i].ofPoints(this.positions), i * this.positions.length);
        }
        this.document.visual.context.setPosition(this._meshId, positions);
    };
    getBoxTransforms(xvec, yvec, zvec) {
        const count = this.numberX * this.numberY * this.numberZ;
        const transforms = new Array(count);
        let index = 0;
        for (let i = 0; i < this.numberX; i++) {
            for (let j = 0; j < this.numberY; j++) {
                for (let k = 0; k < this.numberZ; k++) {
                    const vec = xvec.multiply(i).add(yvec.multiply(j)).add(zvec.multiply(k));
                    transforms[index++] = Matrix4.fromTranslation(vec.x, vec.y, vec.z);
                }
            }
        }
        return transforms;
    }
    getArcMatrixs(center, normal, angle) {
        const transforms = new Array(this.count);
        for (let i = 0; i < this.count; i++) {
            transforms[i] = Matrix4.fromAxisRad(center, normal, i * angle);
        }
        return transforms;
    }
    getSteps() {
        this.resetMesh();
        if (this.circularPattern) {
            return [
                new PointStep("prompt.pickCircleCenter", undefined, true),
                new LengthAtPlaneStep("prompt.pickRadius", this.getRadiusData, true),
                new AngleStep(
                    "prompt.pickNextPoint",
                    () => this.stepDatas[0].point,
                    () => this.stepDatas[1].point,
                    this.getAngleData,
                    true,
                ),
            ];
        } else {
            return [
                new PointStep("prompt.pickFistPoint", undefined, true),
                new PointStep("prompt.pickNextPoint", () => this.vectorArrayStepData(), true),
                new PointOnAxisStep("prompt.pickNextPoint", () => this.pointOnAxisArray(2), true),
                new PointOnAxisStep("prompt.pickNextPoint", () => this.pointOnAxisArray(3), true),
            ];
        }
    }
    getRadiusData = () => {
        const { point, view } = this.stepDatas[0];
        return {
            point: () => point,
            preview: this.circlePreview,
            plane: (p) => this.findPlane(view, point, p),
            validator: (p) => {
                if (p.distanceTo(point) < Precision.Distance) return false;
                return p.sub(point).isParallelTo(this.stepDatas[0].view.workplane.normal) === false;
            },
        };
    };
    circlePreview = (end) => {
        const visualCenter = this.meshPoint(this.stepDatas[0].point);
        if (!end) return [visualCenter];
        const { point, view } = this.stepDatas[0];
        const plane = this.findPlane(view, point, end);
        return [
            visualCenter,
            this.meshLine(this.stepDatas[0].point, end),
            this.meshCreatedShape("circle", plane.normal, point, plane.projectDistance(point, end)),
        ];
    };
    getAngleData = () => {
        const [center, p1] = [this.stepDatas[0].point, this.stepDatas[1].point];
        const plane = this.stepDatas[1].plane ?? this.findPlane(this.stepDatas[1].view, center, p1);
        const points = [this.meshPoint(center), this.meshPoint(p1)];
        this._planeAngle = new PlaneAngle(new Plane(center, plane.normal, p1.sub(center)));
        return {
            dimension: Dimension.D1D2,
            preview: (point) => this.anglePreview(point, center, p1, points),
            plane: () => plane,
            validators: [this.angleValidator(center, plane)],
        };
    };
    anglePreview(point, center, p1, points) {
        point = point ?? p1;
        this._planeAngle.movePoint(point);
        const result = [...points];
        if (Math.abs(this._planeAngle.angle) > Precision.Angle) {
            const transforms = this.getArcMatrixs(
                center,
                this._planeAngle.plane.normal,
                MathUtils.degToRad(this._planeAngle.angle),
            );
            this.updatePosition(transforms);
            result.push(
                this.meshCreatedShape(
                    "arc",
                    this._planeAngle.plane.normal,
                    center,
                    p1,
                    this._planeAngle.angle,
                ),
            );
        }
        return result;
    }
    angleValidator(center, plane) {
        return (p) =>
            p.distanceTo(center) >= Precision.Distance && !p.sub(center).isParallelTo(plane.normal);
    }
    vectorArrayStepData = () => {
        return {
            dimension: Dimension.D1,
            refPoint: () => this.stepDatas[0].point,
            validator: (p) => p !== undefined && p.distanceTo(this.stepDatas[0].point) > Precision.Distance,
            preview: (p) => {
                if (!p) {
                    return [this.meshPoint(this.stepDatas[0].point)];
                }
                const vector = p.sub(this.stepDatas[0].point);
                const matrixs = this.getBoxTransforms(vector, XYZ.zero, XYZ.zero);
                this.updatePosition(matrixs);
                return [
                    this.meshPoint(this.stepDatas[0].point),
                    this.meshLine(this.stepDatas[0].point, p),
                    this.meshPoint(p),
                ];
            },
        };
    };
    pointOnAxisArray = (index) => {
        const { ray, yvec, normal, xvec } = this.boxPlaneInfo(index);
        return {
            ray,
            validator: (p) => {
                return ray.location.distanceTo(p) > Precision.Distance;
            },
            preview: (p) => {
                if (!p) {
                    return [this.meshPoint(this.stepDatas[0].point)];
                }
                const matrixs = this.boxArrayMatrixs(index, xvec, yvec, normal, p);
                this.updatePosition(matrixs);
                return [
                    this.meshLine(this.stepDatas[1].point, p),
                    this.meshPoint(p),
                    this.meshPoint(this.stepDatas[1].point),
                ];
            },
        };
    };
    boxArrayMatrixs(index, xvec, yvec, normal, end) {
        const x = xvec.multiply(this.stepDatas[1].point.sub(this.stepDatas[0].point).dot(xvec));
        let y, z;
        if (index === 2) {
            y = yvec.multiply(end.sub(this.stepDatas[0].point).dot(yvec));
            z = XYZ.zero;
        } else {
            y = yvec.multiply(this.stepDatas[2].point.sub(this.stepDatas[0].point).dot(yvec));
            z = normal.multiply(end.sub(this.stepDatas[0].point).dot(normal));
        }
        return this.getBoxTransforms(x, y, z);
    }
    boxPlaneInfo(index) {
        const plane =
            this.stepDatas[1].plane ??
            this.findPlane(this.stepDatas[1].view, this.stepDatas[0].point, this.stepDatas[1].point);
        const xvec = this.stepDatas[1].point.sub(this.stepDatas[0].point).normalize();
        let normal = plane.normal;
        if (normal.isEqualTo(xvec)) {
            normal = XYZ.unitZ;
        } else if (normal.isEqualTo(xvec.reverse())) {
            normal = XYZ.unitZ.reverse();
        }
        const yvec = normal.cross(xvec).normalize();
        const ray =
            index === 2 ? new Ray(this.stepDatas[1].point, yvec) : new Ray(this.stepDatas[1].point, normal);
        return { ray, yvec, normal, xvec };
    }
    executeMainTask() {
        const nodes = this.cloneNodes();
        Transaction.execute(this.document, "Array", () => {
            if (this.isGroup) {
                const component = new Component("Array", nodes);
                this.document.components.push(component);
                this.document.addNode(
                    new ComponentNode(this.document, "Array", component.id, component.origin),
                );
            } else {
                this.document.addNode(...nodes);
            }
            this.models?.forEach((model) => {
                model.parent?.remove(model);
            });
            this.positions = undefined;
            this.models = undefined;
        });
    }
    cloneNodes() {
        let matrixs;
        if (this.circularPattern) {
            matrixs = this.getArcMatrixs(
                this.stepDatas[0].point,
                this._planeAngle.plane.normal,
                MathUtils.degToRad(this._planeAngle.angle),
            );
        } else {
            const { xvec, yvec, normal } = this.boxPlaneInfo(3);
            matrixs = this.boxArrayMatrixs(3, xvec, yvec, normal, this.stepDatas[3].point);
        }
        const nodes = [];
        for (const matrix of matrixs) {
            this.models?.forEach((model) => {
                const cloned = model.clone();
                cloned.transform = cloned.transform.multiply(matrix);
                nodes.push(cloned);
            });
        }
        return nodes;
    }
};
__decorate([Property.define("common.isGroup")], ArrayCommand.prototype, "isGroup", null);
__decorate(
    [Property.define("option.command.circularPattern")],
    ArrayCommand.prototype,
    "circularPattern",
    null,
);
__decorate(
    [
        Property.define("common.count", {
            dependencies: [
                {
                    property: "circularPattern",
                    value: true,
                },
            ],
        }),
    ],
    ArrayCommand.prototype,
    "count",
    null,
);
__decorate(
    [
        Property.define("common.numberX", {
            dependencies: [
                {
                    property: "circularPattern",
                    value: false,
                },
            ],
        }),
    ],
    ArrayCommand.prototype,
    "numberX",
    null,
);
__decorate(
    [
        Property.define("common.numberY", {
            dependencies: [
                {
                    property: "circularPattern",
                    value: false,
                },
            ],
        }),
    ],
    ArrayCommand.prototype,
    "numberY",
    null,
);
__decorate(
    [
        Property.define("common.numberZ", {
            dependencies: [
                {
                    property: "circularPattern",
                    value: false,
                },
            ],
        }),
    ],
    ArrayCommand.prototype,
    "numberZ",
    null,
);
ArrayCommand = __decorate(
    [
        command({
            key: "modify.array",
            icon: "icon-array",
        }),
    ],
    ArrayCommand,
);
export { ArrayCommand };
