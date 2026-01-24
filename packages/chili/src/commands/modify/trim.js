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
    CancelableCommand,
    EditableShapeNode,
    I18n,
    ShapeType,
    Transaction,
    VisualConfig,
    command,
} from "chili-core";
import { GeoUtils } from "chili-geo";
import { ShapeSelectionHandler } from "chili-vis";
let Trim = class Trim extends CancelableCommand {
    async executeAsync() {
        let transaction = new Transaction(this.document, I18n.translate("command.modify.trim"));
        transaction.start();
        try {
            await this.trimAsync();
        } catch (e) {
            transaction.rollback();
            throw e;
        }
        transaction.commit();
    }
    async trimAsync() {
        this.document.visual.highlighter.clear();
        this.document.selection.clearSelection();
        while (!this.isCompleted) {
            this.controller = new AsyncController();
            let handler = new PickTrimEdgeEventHandler(this.document, this.controller);
            await this.document.selection.pickAsync(
                handler,
                "prompt.select.edges",
                this.controller,
                false,
                "select.default",
            );
            if (this.controller.result?.status !== "success" || !handler.selected) {
                break;
            }
            this.trimEdge(handler.selected);
            handler.dispose();
        }
    }
    trimEdge(selected) {
        let model = this.document.visual.context.getNode(selected.edge.owner);
        let materialId = model?.materialId;
        selected.segments.retainSegments.forEach((segment) => {
            let newEdge = selected.curve.trim(segment.start, segment.end).makeEdge();
            model?.parent?.add(new EditableShapeNode(this.document, model.name, newEdge, materialId));
        });
        model?.parent?.remove(model);
    }
};
Trim = __decorate(
    [
        command({
            key: "modify.trim",
            icon: "icon-trim",
        }),
    ],
    Trim,
);
export { Trim };
export class EdgeFilter {
    allow(shape) {
        return shape.shapeType === ShapeType.Edge;
    }
}
export class PickTrimEdgeEventHandler extends ShapeSelectionHandler {
    #selected;
    highlightedEdge;
    highlight;
    releaseStack = new Set();
    get selected() {
        return this.#selected;
    }
    constructor(document, controller) {
        super(document, ShapeType.Shape, false, controller, new EdgeFilter());
    }
    highlightDetecteds(view, detecteds) {
        this.cleanHighlights();
        if (detecteds.length !== 1 || detecteds[0].shape.shapeType !== ShapeType.Edge) return;
        const box = BoundingBox.transformed(detecteds[0].owner.boundingBox(), detecteds[0].transform);
        const edges = this.filterByBoundingBox(box, view, detecteds[0].shape.id);
        const edge = detecteds[0].shape.transformedMul(detecteds[0].transform);
        this.releaseStack.add(edge);
        let segments = findSegments(edge.curve, edge, edges, detecteds);
        let mesh = edge.trim(segments.deleteSegment.start, segments.deleteSegment.end).mesh.edges;
        mesh.color = VisualConfig.highlightEdgeColor;
        mesh.lineWidth = 3;
        this.highlightedEdge = view.document.visual.highlighter.highlightMesh(mesh);
        this.highlight = { edge: detecteds[0], segments, curve: edge.curve };
        view.update();
    }
    cleanHighlights() {
        if (this.highlightedEdge !== undefined) {
            this.document.visual.highlighter.removeHighlightMesh(this.highlightedEdge);
            this.highlightedEdge = undefined;
            this.highlight = undefined;
            this.document.application.activeView?.update();
        }
    }
    clearSelected(document) {
        this.#selected = undefined;
    }
    select(view, event) {
        this.#selected = this.highlight;
        return this.#selected ? 1 : 0;
    }
    filterByBoundingBox(box, view, currentId) {
        let boundingBox = BoundingBox.expand(box, 1e-3);
        return view.document.visual.context
            .boundingBoxIntersectFilter(boundingBox, new EdgeFilter())
            .map((x) => {
                const node = x?.geometryNode;
                const shape = node?.shape?.value;
                if (!shape || shape?.id === currentId) return undefined;
                const edge = shape.transformedMul(node.worldTransform());
                this.releaseStack.add(edge);
                return edge;
            })
            .filter((x) => x !== undefined);
    }
    disposeInternal() {
        super.disposeInternal();
        this.releaseStack.forEach((x) => x.dispose());
        this.releaseStack.clear();
    }
}
function findSegments(curve, edge, otherEdges, detecteds) {
    let intersections = GeoUtils.intersects(edge, otherEdges).map((x) => x.parameter);
    intersections.push(curve.firstParameter(), curve.lastParameter());
    intersections = Array.from(new Set(intersections)).sort((a, b) => a - b);
    if (intersections.length === 2) return allSegment(intersections);
    let parameter = curve.parameter(detecteds[0].point, 5);
    for (let i = 1; i < intersections.length; i++) {
        if (parameter < intersections[i]) {
            if (i === 1) {
                return startSegment(intersections);
            } else if (i === intersections.length - 1) {
                return lastSegment(intersections);
            } else {
                return centerSegment(intersections, i);
            }
        }
    }
    return allSegment(intersections);
}
function allSegment(intersections) {
    return {
        deleteSegment: {
            start: intersections[0],
            end: intersections.at(-1),
        },
        retainSegments: [],
    };
}
function centerSegment(intersections, i) {
    return {
        deleteSegment: {
            start: intersections.at(i - 1),
            end: intersections.at(i),
        },
        retainSegments: [
            {
                start: intersections[0],
                end: intersections[i - 1],
            },
            {
                start: intersections[i],
                end: intersections.at(-1),
            },
        ],
    };
}
function lastSegment(intersections) {
    return {
        deleteSegment: {
            start: intersections.at(-2),
            end: intersections.at(-1),
        },
        retainSegments: [
            {
                start: intersections[0],
                end: intersections.at(-2),
            },
        ],
    };
}
function startSegment(intersections) {
    return {
        deleteSegment: {
            start: intersections[0],
            end: intersections[1],
        },
        retainSegments: [
            {
                start: intersections[1],
                end: intersections.at(-1),
            },
        ],
    };
}
