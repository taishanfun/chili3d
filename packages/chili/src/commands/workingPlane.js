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
import { RadioGroup, div } from "chili-controls";
import {
    AsyncController,
    DialogResult,
    I18n,
    Observable,
    Plane,
    Property,
    PubSub,
    SelectMode,
    SelectableItems,
    ShapeType,
    XYZ,
    command,
} from "chili-core";
import { Dimension } from "../snap";
import { PointOnCurveStep, SelectShapeStep } from "../step";
import { MultistepCommand } from "./multistepCommand";
export class WorkingPlaneViewModel extends Observable {
    planes = new SelectableItems(["XOY", "YOZ", "ZOX"], SelectMode.radio, ["XOY"]);
}
__decorate(
    [Property.define("dialog.title.selectWorkingPlane")],
    WorkingPlaneViewModel.prototype,
    "planes",
    void 0,
);
let SetWorkplane = class SetWorkplane {
    async execute(application) {
        const view = application.activeView;
        if (!view) return;
        const vm = new WorkingPlaneViewModel();
        PubSub.default.pub("showDialog", "dialog.title.selectWorkingPlane", this.ui(vm), (result) => {
            if (result === DialogResult.ok) {
                const planes = [Plane.XY, Plane.YZ, Plane.ZX];
                view.workplane = planes[vm.planes.selectedIndexes[0]];
            }
        });
    }
    ui(vm) {
        return div(
            ...Property.getProperties(vm).map((x) => {
                const value = vm[x.name];
                if (value instanceof SelectableItems) {
                    return new RadioGroup(I18n.translate(x.display), value);
                }
                return "";
            }),
        );
    }
};
SetWorkplane = __decorate(
    [
        command({
            key: "workingPlane.set",
            icon: "icon-setWorkingPlane",
        }),
    ],
    SetWorkplane,
);
export { SetWorkplane };
let AlignToPlane = class AlignToPlane {
    async execute(application) {
        const view = application.activeView;
        if (!view) return;
        view.document.selection.clearSelection();
        const controller = new AsyncController();
        const data = await new SelectShapeStep(ShapeType.Face, "prompt.select.faces").execute(
            view.document,
            controller,
        );
        controller.dispose();
        if (!data || data.shapes.length === 0) return;
        view.document.visual.highlighter.clear();
        const face = data.shapes[0].shape.transformedMul(data.shapes[0].transform);
        const [point, normal] = face.normal(0, 0);
        face.dispose();
        let xvec = XYZ.unitX;
        if (!normal.isParallelTo(XYZ.unitZ)) {
            xvec = XYZ.unitZ.cross(normal).normalize();
        }
        view.workplane = new Plane(point, normal, xvec);
    }
};
AlignToPlane = __decorate(
    [
        command({
            key: "workingPlane.alignToPlane",
            icon: "icon-alignWorkingPlane",
        }),
    ],
    AlignToPlane,
);
export { AlignToPlane };
let FromSection = class FromSection extends MultistepCommand {
    executeMainTask() {
        const curve = this.transformedCurve();
        const point = this.stepDatas[1].point;
        const parameter = curve.parameter(point, 1e-3);
        if (parameter === undefined) return;
        const direction = curve.d1(parameter).vec.normalize();
        let xvec = this.findXVec(direction);
        const plane = new Plane(point, direction, xvec);
        const view = this.application.activeView;
        if (!view) return;
        view.workplane = plane;
    }
    findXVec(direction) {
        let xvec;
        if (direction.isEqualTo(XYZ.unitZ)) {
            xvec = XYZ.unitX;
        } else if (direction.isEqualTo(new XYZ(0, 0, -1))) {
            xvec = XYZ.unitY;
        } else {
            xvec = direction.cross(XYZ.unitZ).normalize();
        }
        return xvec;
    }
    getSteps() {
        return [
            new SelectShapeStep(ShapeType.Edge, "prompt.select.edges"),
            new PointOnCurveStep("prompt.pickFistPoint", this.handlePointData, true),
        ];
    }
    transformedCurve() {
        const shape = this.stepDatas[0].shapes[0].shape;
        const matrix = shape.matrix.multiply(this.stepDatas[0].shapes[0].transform);
        const curve = shape.curve.transformed(matrix);
        this.disposeStack.add(curve);
        return curve;
    }
    handlePointData = () => {
        const curve = this.transformedCurve();
        return {
            curve,
            dimension: Dimension.D1,
            preview: (point) => {
                if (!point) return [];
                let project = curve.project(point).at(0);
                return [this.meshPoint(project ?? point)];
            },
        };
    };
};
FromSection = __decorate(
    [
        command({
            key: "workingPlane.fromSection",
            icon: "icon-fromSection",
        }),
    ],
    FromSection,
);
export { FromSection };
