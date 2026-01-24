// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Matrix4, Plane, XYZ } from "../../math";
import { INode, VisualNode } from "../../model";
export class NodeAdapter {
    document;
    converters = {};
    lastMutationId = "";
    constructor(document) {
        this.document = document;
        this.registerDefaultConverters();
    }
    registerDefaultConverters() {
        this.converters["XYZ"] = (dto) => new XYZ(dto.x, dto.y, dto.z);
        this.converters["Plane"] = (dto) =>
            new Plane(
                new XYZ(dto.origin.x, dto.origin.y, dto.origin.z),
                new XYZ(dto.normal.x, dto.normal.y, dto.normal.z),
                new XYZ(dto.xvec.x, dto.xvec.y, dto.xvec.z),
            );
        this.converters["Matrix4"] = (dto) => Matrix4.fromArray(dto);
    }
    applyPatchEnvelope(envelope) {
        if (envelope.mutationId === this.lastMutationId) {
            return;
        }
        envelope.patches.forEach((op) => this.applyOp(op));
    }
    applyOp(op) {
        switch (op.op) {
            case "add":
                break;
            case "remove":
                op.ids
                    .map((id) => this.findNodeById(id))
                    .filter((n) => !!n)
                    .forEach((node) => node.parent?.remove(node));
                break;
            case "update":
                this.applyUpdate(op.id, op.rev, op.set, op.unset);
                break;
            case "updateVisual":
                this.applyUpdate(op.id, op.rev, op.set, op.unset);
                break;
            case "updateGeom":
                this.applyUpdate(op.id, op.rev, op.set, op.unset);
                break;
            case "updateBiz":
                this.applyUpdateBiz(op.id, op.rev, op.values);
                break;
            case "batch":
                op.ops.forEach((subOp) => this.applyOp(subOp));
                break;
            default:
                break;
        }
    }
    applyUpdate(id, rev, set, unset) {
        const node = this.findNodeById(id);
        if (!node) return;
        if (!this.shouldApplyPatch(node, rev)) return;
        if (set) {
            this.applyNodeProperties(node, set);
            this.applyDynamicProperties(node, set);
        }
        if (unset) {
            unset.forEach((key) => {
                if (key in node) {
                    node[key] = undefined;
                }
            });
        }
    }
    applyUpdateBiz(id, rev, values) {
        const node = this.findNodeById(id);
        if (!node || !(node instanceof VisualNode)) return;
        if (!this.shouldApplyPatch(node, rev)) return;
        Object.entries(values).forEach(([key, bizValue]) => {
            const typedValue = bizValue;
            if (typedValue.t === "delete") {
                let props = {};
                try {
                    props = JSON.parse(node.customProperties || "{}");
                } catch {
                    props = {};
                }
                delete props[key];
                node.customProperties = JSON.stringify(props);
                let types = {};
                try {
                    types = JSON.parse(node.customPropertyTypes || "{}");
                } catch {
                    types = {};
                }
                delete types[key];
                node.customPropertyTypes = JSON.stringify(types);
                return;
            }
            node.setCustomProperty(key, typedValue.v);
            this.updateNodeType(node, key, typedValue.t);
        });
    }
    shouldApplyPatch(node, rev) {
        if (typeof node.rev === "number" && node.rev > rev) {
            return false;
        }
        if (typeof node.rev !== "number" || node.rev !== rev) {
            node.rev = rev;
        }
        return true;
    }
    findNodeById(id) {
        return this.findNodeInTree(this.document.rootNode, id);
    }
    findNodeInTree(node, id) {
        if (node.id === id) return node;
        if (INode.isLinkedListNode(node)) {
            let child = node.firstChild;
            while (child) {
                const found = this.findNodeInTree(child, id);
                if (found) return found;
                child = child.nextSibling;
            }
        }
        return undefined;
    }
    updateNodeType(node, key, type) {
        let types = {};
        try {
            types = JSON.parse(node.customPropertyTypes || "{}");
        } catch {}
        types[key] = type;
        node.customPropertyTypes = JSON.stringify(types);
    }
    applyNodeProperties(node, dto) {
        if (dto.name !== undefined) node.name = dto.name;
        if (dto.visible !== undefined) node.visible = dto.visible;
        if (dto.layerId !== undefined) node.layerId = dto.layerId;
        if (dto.transform !== undefined) node.transform = this.converters["Matrix4"](dto.transform);
        if (dto.materialId !== undefined) node.materialId = dto.materialId;
    }
    applyDynamicProperties(node, dto) {
        if (dto["start"]) node.start = this.converters["XYZ"](dto["start"]);
        if (dto["end"]) node.end = this.converters["XYZ"](dto["end"]);
        if (dto["center"]) node.center = this.converters["XYZ"](dto["center"]);
        if (dto["radius"]) node.radius = dto["radius"];
        if (dto["normal"]) node.normal = this.converters["XYZ"](dto["normal"]);
        if (dto["plane"]) node.plane = this.converters["Plane"](dto["plane"]);
        if (dto["dx"]) node.dx = dto["dx"];
        if (dto["dy"]) node.dy = dto["dy"];
        if (dto["dz"]) node.dz = dto["dz"];
        if (dto["width"]) node.width = dto["width"];
        if (dto["height"]) node.height = dto["height"];
        if (dto["majorRadius"]) node.majorRadius = dto["majorRadius"];
        if (dto["minorRadius"]) node.minorRadius = dto["minorRadius"];
        if (dto["majorAxis"]) node.majorAxis = this.converters["XYZ"](dto["majorAxis"]);
        if (dto["isFace"] !== undefined) node.isFace = dto["isFace"];
    }
}
