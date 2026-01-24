// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { IDocument } from "../../document";
import { Matrix4, Plane, XYZ } from "../../math";
import { INode, VisualNode } from "../../model";
import { GeometryNodeDTO, PatchEnvelope, PatchOp, PlaneDTO, VisualNodeDTO, XYZDTO } from "./node";

export type PropertyValueConverter = (value: any) => any;

export class NodeAdapter {
    private converters: Record<string, PropertyValueConverter> = {};
    private lastMutationId: string = "";

    constructor(private readonly document: IDocument) {
        this.registerDefaultConverters();
    }

    private registerDefaultConverters() {
        this.converters["XYZ"] = (dto: XYZDTO) => new XYZ(dto.x, dto.y, dto.z);
        this.converters["Plane"] = (dto: PlaneDTO) =>
            new Plane(
                new XYZ(dto.origin.x, dto.origin.y, dto.origin.z),
                new XYZ(dto.normal.x, dto.normal.y, dto.normal.z),
                new XYZ(dto.xvec.x, dto.xvec.y, dto.xvec.z),
            );
        this.converters["Matrix4"] = (dto: number[]) => Matrix4.fromArray(dto);
    }

    public applyPatchEnvelope(envelope: PatchEnvelope) {
        if (envelope.mutationId === this.lastMutationId) {
            return;
        }
        envelope.patches.forEach((op) => this.applyOp(op));
    }

    private applyOp(op: PatchOp) {
        switch (op.op) {
            case "add":
                break;
            case "remove":
                op.ids
                    .map((id) => this.findNodeById(id))
                    .filter((n): n is INode => !!n)
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

    private applyUpdate(id: string, rev: number, set?: Record<string, unknown>, unset?: string[]) {
        const node = this.findNodeById(id);
        if (!node) return;
        if (!this.shouldApplyPatch(node as any, rev)) return;

        if (set) {
            this.applyNodeProperties(node as any, set as Partial<VisualNodeDTO & GeometryNodeDTO>);
            this.applyDynamicProperties(node as any, set);
        }
        if (unset) {
            unset.forEach((key) => {
                if (key in (node as any)) {
                    (node as any)[key] = undefined;
                }
            });
        }
    }

    private applyUpdateBiz(id: string, rev: number, values: Record<string, any>) {
        const node = this.findNodeById(id);
        if (!node || !(node instanceof VisualNode)) return;
        if (!this.shouldApplyPatch(node as any, rev)) return;

        Object.entries(values).forEach(([key, bizValue]) => {
            const typedValue = bizValue as { t: string; v: any };
            if (typedValue.t === "delete") {
                let props: Record<string, unknown> = {};
                try {
                    props = JSON.parse(node.customProperties || "{}");
                } catch {
                    props = {};
                }
                delete (props as any)[key];
                node.customProperties = JSON.stringify(props);

                let types: Record<string, unknown> = {};
                try {
                    types = JSON.parse(node.customPropertyTypes || "{}");
                } catch {
                    types = {};
                }
                delete (types as any)[key];
                node.customPropertyTypes = JSON.stringify(types);
                return;
            }

            node.setCustomProperty(key, typedValue.v);
            this.updateNodeType(node, key, typedValue.t);
        });
    }

    private shouldApplyPatch(node: any, rev: number) {
        if (typeof node.rev === "number" && node.rev > rev) {
            return false;
        }
        if (typeof node.rev !== "number" || node.rev !== rev) {
            node.rev = rev;
        }
        return true;
    }

    private findNodeById(id: string): INode | undefined {
        return this.findNodeInTree(this.document.rootNode, id);
    }

    private findNodeInTree(node: INode, id: string): INode | undefined {
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

    private updateNodeType(node: any, key: string, type: string) {
        let types = {};
        try {
            types = JSON.parse(node.customPropertyTypes || "{}");
        } catch {}
        (types as any)[key] = type;
        node.customPropertyTypes = JSON.stringify(types);
    }

    private applyNodeProperties(node: VisualNode, dto: Partial<VisualNodeDTO & GeometryNodeDTO>) {
        if (dto.name !== undefined) node.name = dto.name;
        if (dto.visible !== undefined) node.visible = dto.visible;
        if (dto.layerId !== undefined) node.layerId = dto.layerId;
        if (dto.transform !== undefined) node.transform = this.converters["Matrix4"](dto.transform);
        if (dto.materialId !== undefined) (node as any).materialId = dto.materialId;
    }

    private applyDynamicProperties(node: any, dto: Record<string, any>) {
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
