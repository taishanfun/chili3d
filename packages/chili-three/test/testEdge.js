// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { LineType, Matrix4, Orientation, ParameterShapeNode, Result, ShapeType } from "chili-core";
export class TestEdge {
    start;
    end;
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
    transformed(matrix) {
        throw new Error("Method not implemented.");
    }
    transformedMul(matrix) {
        throw new Error("Method not implemented.");
    }
    edgesMeshPosition() {
        throw new Error("Method not implemented.");
    }
    clone() {
        throw new Error("Method not implemented.");
    }
    dispose() {
        throw new Error("Method not implemented.");
    }
    update(curve) {
        throw new Error("Method not implemented.");
    }
    trim(start, end) {
        throw new Error("Method not implemented.");
    }
    isClosed() {
        throw new Error("Method not implemented.");
    }
    isNull() {
        throw new Error("Method not implemented.");
    }
    reserve() {
        throw new Error("Method not implemented.");
    }
    section(shape) {
        throw new Error("Method not implemented.");
    }
    splitByWire(edges) {
        throw new Error("Method not implemented.");
    }
    split(shapes) {
        throw new Error("Method not implemented.");
    }
    findAncestor(ancestorType, fromShape) {
        throw new Error("Method not implemented.");
    }
    findSubShapes(subshapeType) {
        throw new Error("Method not implemented.");
    }
    iterShape() {
        throw new Error("Method not implemented.");
    }
    offset(distance, dir) {
        throw new Error("Method not implemented.");
    }
    hlr(position, direction, xDir) {
        throw new Error("Method not implemented.");
    }
    intersect(other) {
        return [];
    }
    length() {
        return this.start.distanceTo(this.end);
    }
    get curve() {
        throw new Error("Method not implemented.");
    }
    get id() {
        return "testEdge";
    }
    shapeType = ShapeType.Edge;
    matrix = Matrix4.identity();
    get mesh() {
        return {
            edges: {
                position: new Float32Array([
                    this.start.x,
                    this.start.y,
                    this.start.z,
                    this.end.x,
                    this.end.y,
                    this.end.z,
                ]),
                color: 0xff0000,
                lineType: LineType.Solid,
                range: [],
            },
            faces: undefined,
        };
    }
    serialize() {
        return {
            classKey: "Shape",
            properties: {},
        };
    }
    orientation() {
        return Orientation.FORWARD;
    }
    isPartner(other) {
        return true;
    }
    isSame(other) {
        return true;
    }
    isEqual(other) {
        if (other instanceof TestEdge) {
            return this.start.isEqualTo(other.start) && this.end.isEqualTo(other.end);
        }
        return false;
    }
}
export class TestNode extends ParameterShapeNode {
    start;
    end;
    display() {
        return "body.line";
    }
    constructor(document, start, end) {
        super(document);
        this.start = start;
        this.end = end;
    }
    setProperty(property, newValue, onPropertyChanged, equals) {
        this.setPrivateValue(property, newValue);
        return true;
    }
    generateShape() {
        return Result.ok(new TestEdge(this.start, this.end));
    }
}
