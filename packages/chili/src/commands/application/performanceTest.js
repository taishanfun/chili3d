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
import { EditableShapeNode, Plane, XYZ, command } from "chili-core";
export class PerformanceTestCommand {
    size = 10;
    gap = 1;
    rowCols = 20;
    async execute(app) {
        let document = await app.newDocument("OCC Performace Test");
        const start = performance.now();
        const distance = this.gap + this.size;
        for (let x = 0; x < this.rowCols; x++) {
            for (let y = 0; y < this.rowCols; y++) {
                for (let z = 0; z < this.rowCols; z++) {
                    let position = XYZ.zero
                        .add(XYZ.unitX.multiply(x * distance))
                        .add(XYZ.unitY.multiply(y * distance))
                        .add(XYZ.unitZ.multiply(z * distance));
                    this.createShape(document, document.materials.at(0), position);
                }
            }
        }
        document.visual.update();
        alert(
            `Create ${this.rowCols * this.rowCols * this.rowCols} shapes, Time: ${performance.now() - start} ms`,
        );
    }
}
let OccPerformanceTestCommand = class OccPerformanceTestCommand extends PerformanceTestCommand {
    index = 1;
    shapes = [];
    createShape(document, material, position) {
        let plane = Plane.XY.translateTo(position);
        let box = document.application.shapeFactory.box(
            plane,
            this.size * Math.random(),
            this.size * Math.random(),
            this.size * Math.random(),
        ).value;
        let node = new EditableShapeNode(document, `box ${this.index++}`, box, material.id);
        document.addNode(node);
    }
};
OccPerformanceTestCommand = __decorate(
    [
        command({
            key: "test.performance",
            icon: "icon-performance",
        }),
    ],
    OccPerformanceTestCommand,
);
export { OccPerformanceTestCommand };
