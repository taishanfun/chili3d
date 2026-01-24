// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { MathUtils, Precision, Result, ShapeType } from "chili-core";
import { GeoUtils } from "chili-geo";
import { OccShapeConverter } from "./converter";
import { OcctHelper } from "./helper";
import { OccShape } from "./shape";
function ensureOccShape(shapes) {
    if (Array.isArray(shapes)) {
        return shapes.map((x) => {
            if (!(x instanceof OccShape)) {
                throw new Error("The OCC kernel only supports OCC geometries.");
            }
            return x.shape;
        });
    }
    if (shapes instanceof OccShape) {
        return [shapes.shape];
    }
    throw new Error("The OCC kernel only supports OCC geometries.");
}
function convertShapeResult(result) {
    let res;
    if (!result.isOk) {
        res = Result.err(result.error);
    } else if (result.shape.isNull()) {
        res = Result.err("The shape is null.");
    } else {
        res = Result.ok(OcctHelper.wrapShape(result.shape));
    }
    result.delete();
    return res;
}
export class ShapeFactory {
    kernelName = "opencascade";
    converter;
    constructor() {
        this.converter = new OccShapeConverter();
    }
    fillet(shape, edges, radius) {
        if (radius < Precision.Distance) {
            return Result.err("The radius is too small.");
        }
        if (edges.length === 0) {
            return Result.err("The edges is empty.");
        }
        if (shape instanceof OccShape) {
            return convertShapeResult(wasm.ShapeFactory.fillet(shape.shape, edges, radius));
        }
        return Result.err("Not OccShape");
    }
    chamfer(shape, edges, distance) {
        if (distance < Precision.Distance) {
            return Result.err("The distance is too small.");
        }
        if (edges.length === 0) {
            return Result.err("The edges is empty.");
        }
        if (shape instanceof OccShape) {
            return convertShapeResult(wasm.ShapeFactory.chamfer(shape.shape, edges, distance));
        }
        return Result.err("Not OccShape");
    }
    removeFeature(shape, faces) {
        if (!(shape instanceof OccShape)) {
            return Result.err("Not OccShape");
        }
        let occFaces = faces.map((x) => {
            if (!(x instanceof OccShape)) {
                throw new Error("The OCC kernel only supports OCC geometries.");
            }
            if (x.shape.isNull()) {
                throw new Error("The shape is null.");
            }
            return x.shape;
        });
        const removed = wasm.Shape.removeFeature(shape.shape, occFaces);
        if (removed.isNull()) {
            return Result.err("Can not remove");
        }
        return Result.ok(OcctHelper.wrapShape(removed));
    }
    removeSubShape(shape, subShapes) {
        const occShape = ensureOccShape(shape);
        const occSubShapes = ensureOccShape(subShapes);
        return OcctHelper.wrapShape(wasm.Shape.removeSubShape(occShape[0], occSubShapes));
    }
    replaceSubShape(shape, subShape, newSubShape) {
        const [occShape, occSubShape, occNewSubShape] = ensureOccShape([shape, subShape, newSubShape]);
        return OcctHelper.wrapShape(wasm.Shape.replaceSubShape(occShape, occSubShape, occNewSubShape));
    }
    face(wire) {
        if (wire.length === 0) {
            return Result.err("The wire is empty.");
        }
        const normal = GeoUtils.normal(wire[0]);
        for (let i = 1; i < wire.length; i++) {
            if (GeoUtils.isCCW(normal, wire[i])) {
                wire[i].reserve();
            }
        }
        const shapes = ensureOccShape(wire);
        return convertShapeResult(wasm.ShapeFactory.face(shapes));
    }
    bezier(points, weights) {
        return convertShapeResult(wasm.ShapeFactory.bezier(points, weights ?? []));
    }
    point(point) {
        return convertShapeResult(wasm.ShapeFactory.point(point));
    }
    line(start, end) {
        if (MathUtils.allEqualZero(start.x - end.x, start.y - end.y, start.z - end.z)) {
            return Result.err("The start and end points are too close.");
        }
        return convertShapeResult(wasm.ShapeFactory.line(start, end));
    }
    arc(normal, center, start, angle) {
        return convertShapeResult(wasm.ShapeFactory.arc(normal, center, start, MathUtils.degToRad(angle)));
    }
    circle(normal, center, radius) {
        return convertShapeResult(wasm.ShapeFactory.circle(normal, center, radius));
    }
    rect(plane, dx, dy) {
        return convertShapeResult(
            wasm.ShapeFactory.rect(
                {
                    location: plane.origin,
                    direction: plane.normal,
                    xDirection: plane.xvec,
                },
                dx,
                dy,
            ),
        );
    }
    polygon(points) {
        return convertShapeResult(wasm.ShapeFactory.polygon(points));
    }
    box(plane, dx, dy, dz) {
        return convertShapeResult(
            wasm.ShapeFactory.box(
                {
                    location: plane.origin,
                    direction: plane.normal,
                    xDirection: plane.xvec,
                },
                dx,
                dy,
                dz,
            ),
        );
    }
    cylinder(dir, center, radius, dz) {
        return convertShapeResult(wasm.ShapeFactory.cylinder(dir, center, radius, dz));
    }
    cone(dir, center, radius, radiusUp, dz) {
        return convertShapeResult(wasm.ShapeFactory.cone(dir, center, radius, radiusUp, dz));
    }
    sphere(center, radius) {
        return convertShapeResult(wasm.ShapeFactory.sphere(center, radius));
    }
    ellipse(normal, center, xvec, majorRadius, minorRadius) {
        return convertShapeResult(wasm.ShapeFactory.ellipse(normal, center, xvec, majorRadius, minorRadius));
    }
    pyramid(plane, dx, dy, dz) {
        return convertShapeResult(
            wasm.ShapeFactory.pyramid(
                {
                    location: plane.origin,
                    direction: plane.normal,
                    xDirection: plane.xvec,
                },
                dx,
                dy,
                dz,
            ),
        );
    }
    wire(edges) {
        return convertShapeResult(wasm.ShapeFactory.wire(ensureOccShape(edges)));
    }
    shell(faces) {
        return convertShapeResult(wasm.ShapeFactory.shell(ensureOccShape(faces)));
    }
    solid(shells) {
        return convertShapeResult(wasm.ShapeFactory.solid(ensureOccShape(shells)));
    }
    prism(shape, vec) {
        if (vec.length() === 0) {
            return Result.err(`The vector length is 0, the prism cannot be created.`);
        }
        return convertShapeResult(wasm.ShapeFactory.prism(ensureOccShape(shape)[0], vec));
    }
    fuse(bottom, top) {
        return convertShapeResult(
            wasm.ShapeFactory.booleanFuse(ensureOccShape(bottom), ensureOccShape(top)),
        );
    }
    sweep(profile, path, isRound) {
        return convertShapeResult(
            wasm.ShapeFactory.sweep(ensureOccShape(profile), ensureOccShape(path)[0], true, isRound),
        );
    }
    revolve(profile, axis, angle) {
        return convertShapeResult(
            wasm.ShapeFactory.revolve(
                ensureOccShape(profile)[0],
                {
                    location: axis.location,
                    direction: axis.direction,
                },
                MathUtils.degToRad(angle),
            ),
        );
    }
    booleanCommon(shape1, shape2) {
        return convertShapeResult(
            wasm.ShapeFactory.booleanCommon(ensureOccShape(shape1), ensureOccShape(shape2)),
        );
    }
    booleanCut(shape1, shape2) {
        return convertShapeResult(
            wasm.ShapeFactory.booleanCut(ensureOccShape(shape1), ensureOccShape(shape2)),
        );
    }
    booleanFuse(shape1, shape2) {
        const fused = wasm.ShapeFactory.booleanFuse(ensureOccShape(shape1), ensureOccShape(shape2));
        if (!fused.isOk) {
            return Result.err(fused.error);
        }
        return convertShapeResult(wasm.ShapeFactory.simplifyShape(fused.shape, true, true));
    }
    combine(shapes) {
        return convertShapeResult(wasm.ShapeFactory.combine(ensureOccShape(shapes)));
    }
    makeThickSolidBySimple(shape, thickness) {
        return convertShapeResult(
            wasm.ShapeFactory.makeThickSolidBySimple(ensureOccShape(shape)[0], thickness),
        );
    }
    makeThickSolidByJoin(shape, closingFaces, thickness) {
        return convertShapeResult(
            wasm.ShapeFactory.makeThickSolidByJoin(
                ensureOccShape(shape)[0],
                ensureOccShape(closingFaces),
                thickness,
            ),
        );
    }
    loft(sections, isSolid, isRuled, continuity) {
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            if (section.shapeType === ShapeType.Edge) {
                sections[i] = this.wire([section]).value;
            }
        }
        return convertShapeResult(
            wasm.ShapeFactory.loft(
                ensureOccShape(sections),
                isSolid,
                isRuled,
                OcctHelper.convertFromContinuity(continuity),
            ),
        );
    }
    curveProjection(curve, targetFace, vec) {
        return convertShapeResult(
            wasm.ShapeFactory.curveProjection(
                ensureOccShape(curve)[0],
                ensureOccShape(targetFace)[0],
                new wasm.gp_Dir(vec.x, vec.y, vec.z),
            ),
        );
    }
}
