// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import {
    BoxNode,
    CircleNode,
    ConeNode,
    CylinderNode,
    EllipseNode,
    LineNode,
    RectNode,
    SphereNode,
} from "chili";
import { AppBuilder } from "chili-builder";
import {
    Chili3DNotificationMessage,
    Chili3DNotificationService,
    Chili3DNotificationTransport,
    ChiliWebComponentProps,
    EntityDTO,
    FaceMaterialPair,
    GeometryNode,
    GroupNode,
    IApplication,
    IDocument,
    INode,
    INodeLinkedList,
    Logger,
    Matrix4,
    PatchEnvelope,
    PatchOp,
    Plane,
    PubSub,
    setCurrentApplication,
    VisualNode,
    WebComponentDocumentMode,
    WebComponentMapping,
    WebComponentViewMode,
    XYZ,
} from "chili-core";
import { Loading } from "./loading";

class Chili3DEditorElement extends HTMLElement implements Partial<ChiliWebComponentProps> {
    static get observedAttributes() {
        return Object.keys(WebComponentMapping.attributes);
    }

    private root?: HTMLDivElement;
    private domInited = false;
    private loading?: Loading;

    private appBuildPromise?: Promise<void>;
    private app?: any;
    private doc?: IDocument;

    private notification?: Chili3DNotificationService;

    private _data: EntityDTO[] = [];
    private _documentMode: WebComponentDocumentMode = "3d";
    private _selectedIds: string[] = [];
    private _viewMode: WebComponentViewMode = "edit";

    private suppressSelectionOutbound = false;
    private suppressNodeOutbound = false;
    private suppressCommandOutbound = false;

    constructor() {
        super();
        this._documentMode = this.getAttribute("document-mode") === "2d" ? "2d" : "3d";
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;
        const propName = (WebComponentMapping.attributes as any)[name] as
            | keyof ChiliWebComponentProps
            | undefined;
        if (!propName) return;
        if (propName === "documentMode") {
            this.documentMode = newValue === "2d" ? "2d" : "3d";
        }
        if (propName === "viewMode") {
            this.viewMode = newValue === "view" ? "view" : "edit";
        }
    }

    connectedCallback(): void {
        this.ensureDom();
        this.appBuildPromise ??= this.init();
    }

    disconnectedCallback(): void {
        if (this.app) setCurrentApplication(this.app);
        this.notification?.dispose();
        this.notification = undefined;
        PubSub.default.remove("executeCommand", this.handleExecuteCommand as any);
    }

    get data(): EntityDTO[] {
        return this._data;
    }
    set data(value: EntityDTO | EntityDTO[]) {
        const list = Array.isArray(value) ? value : [value];
        this._data = list;
        void this.appBuildPromise?.then(() => this.applyData());
    }

    get documentMode(): WebComponentDocumentMode {
        return this._documentMode;
    }
    set documentMode(value: WebComponentDocumentMode) {
        const next = value === "2d" ? "2d" : "3d";
        if (this._documentMode === next) return;
        this._documentMode = next;
        if (this.getAttribute("document-mode") !== this._documentMode) {
            this.setAttribute("document-mode", this._documentMode);
        }
        void this.appBuildPromise?.then(() => this.reloadDocument());
    }

    get selectedIds(): string[] {
        return this._selectedIds;
    }
    set selectedIds(value: string[]) {
        this._selectedIds = Array.isArray(value) ? value : [];
        void this.appBuildPromise?.then(() => this.applySelection());
    }

    get viewMode(): WebComponentViewMode {
        return this._viewMode;
    }
    set viewMode(value: WebComponentViewMode) {
        this._viewMode = value === "view" ? "view" : "edit";
        if (this.getAttribute("view-mode") !== this._viewMode) {
            this.setAttribute("view-mode", this._viewMode);
        }
        void this.appBuildPromise?.then(() => this.applyViewMode());
    }

    private ensureDom() {
        if (this.domInited) return;
        this.domInited = true;
        this.style.display = "block";
        this.style.width = "100%";
        this.style.height = "100%";

        this.root = document.createElement("div");
        this.root.style.width = "100%";
        this.root.style.height = "100%";
        this.appendChild(this.root);
    }

    private async init() {
        this.ensureDom();
        this.loading = new Loading();
        this.appendChild(this.loading);

        try {
            this.app = (await new AppBuilder()
                .useIndexedDB()
                .useWasmOcc()
                .useThree()
                .useUI(this.root!)
                .build()) as IApplication;
            setCurrentApplication(this.app);
            this.doc = await this.app.newDocument("Embedded", this._documentMode);
            this.installBridges();
            this.applyViewMode();
            this.applyData();
            this.applySelection();
        } catch (err) {
            Logger.error(err);
        } finally {
            if (this.loading && this.loading.parentElement === this) {
                this.removeChild(this.loading);
            }
            this.loading = undefined;
        }
    }

    private installBridges() {
        if (!this.doc) return;
        if (this.app) setCurrentApplication(this.app);

        PubSub.default.remove("executeCommand", this.handleExecuteCommand as any);

        this.notification?.dispose();
        const transport: Chili3DNotificationTransport = {
            send: (message: Chili3DNotificationMessage) => {
                this.handleNotification(message);
            },
        };
        this.notification = new Chili3DNotificationService(this.doc, {
            transports: [transport],
            scheduleMode: "debounce",
            scheduleMs: 60,
            emitSelectionChanged: true,
            emitNodeChanged: true,
            emitPropertyChanged: true,
        });

        PubSub.default.sub("executeCommand", this.handleExecuteCommand as any);
    }

    private docReloadPromise?: Promise<void>;
    private reloadDocument() {
        this.docReloadPromise = (this.docReloadPromise ?? Promise.resolve()).then(async () => {
            if (!this.app) return;
            if (this.doc) {
                try {
                    await this.doc.close();
                } catch {}
            }
            this.doc = await this.app.newDocument("Embedded", this._documentMode);
            this.installBridges();
            this.applyViewMode();
            this.applyData();
            this.applySelection();
        });
        return this.docReloadPromise;
    }

    private readonly handleExecuteCommand = (command: string) => {
        if (this.suppressCommandOutbound) return;
        this.dispatchEvent(
            new CustomEvent(WebComponentMapping.events.commandExecute, {
                detail: { command, args: undefined },
                bubbles: true,
                composed: true,
            }),
        );
    };

    private handleNotification(message: Chili3DNotificationMessage) {
        if (!this.doc) return;
        if (message.eventType !== "batch" && message.documentId !== this.doc.id) return;

        if (message.eventType === "selectionChanged") {
            if (this.suppressSelectionOutbound) return;
            this.dispatchEvent(
                new CustomEvent(WebComponentMapping.events.selectionChange, {
                    detail: message.ids,
                    bubbles: true,
                    composed: true,
                }),
            );
            return;
        }

        if (message.eventType === "batch") {
            message.events.forEach((x) => this.handleNotification(x));
            return;
        }

        if (this.suppressNodeOutbound) return;

        if (message.eventType === "nodeChanged") {
            const patches: PatchOp[] = [];
            if (message.action === "remove") {
                patches.push({ op: "remove", ids: [message.entityId] });
            } else if (message.action === "add") {
                const dto = this.nodeToDto(this.findNodeById(message.entityId));
                if (dto) patches.push({ op: "add", entities: [dto] });
            } else {
                const parentIds = new Set<string>();
                if (message.oldParentId) parentIds.add(message.oldParentId);
                if (message.newParentId) parentIds.add(message.newParentId);
                for (const id of parentIds) {
                    const dto = this.nodeToDto(this.findNodeById(id));
                    if (dto && (dto as any).type === "GroupNode") {
                        patches.push({ op: "replace", entity: dto });
                    }
                }
                if (!patches.length) {
                    const dto = this.nodeToDto(this.findNodeById(message.entityId));
                    if (dto) patches.push({ op: "replace", entity: dto });
                }
            }

            if (patches.length) {
                const envelope: PatchEnvelope = {
                    documentId: this.doc.id,
                    source: "editor",
                    mutationId: `editor-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    patches,
                    ts: Date.now(),
                };
                this.dispatchEvent(
                    new CustomEvent(WebComponentMapping.events.nodeChange, {
                        detail: envelope,
                        bubbles: true,
                        composed: true,
                    }),
                );
            }
            return;
        }

        if (message.eventType === "propertyChanged") {
            if (message.propertyName === "rev") return;

            const node = this.findNodeById(message.entityId);
            if (!node) return;

            const currentRev = typeof (node as any).rev === "number" ? (node as any).rev : 0;
            const nextRev = currentRev + 1;
            try {
                (node as any).rev = nextRev;
            } catch {}

            const patch = this.propertyChangeToPatch(
                node,
                message.propertyName,
                message.oldValue,
                message.newValue,
                nextRev,
            );
            if (!patch) return;

            this.dispatchEvent(
                new CustomEvent(WebComponentMapping.events.nodeChange, {
                    detail: {
                        documentId: this.doc.id,
                        source: "editor",
                        mutationId: `editor-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        patches: [patch],
                        ts: Date.now(),
                    } satisfies PatchEnvelope,
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }

    private applyViewMode() {
        if (!this.doc || !this.app) return;
        const editorService = (this.app.services as any[])?.find(
            (x) => x?.constructor?.name === "EditorService",
        );
        if (!editorService) return;

        if (this._viewMode === "view") {
            editorService.stop?.();
            this.doc.visual.resetEventHandler();
            return;
        }

        editorService.start?.();
        const selected = this.doc.selection.getSelectedNodes();
        if (selected.length > 0) {
            this.doc.selection.setSelection(selected, false);
        }
    }

    private applyData() {
        if (!this.doc) return;
        const rootNode = this.doc.rootNode;
        this.suppressNodeOutbound = true;
        try {
            const children: INode[] = [];
            for (let c = rootNode.firstChild; c; c = c.nextSibling) {
                children.push(c);
            }
            if (children.length) {
                rootNode.remove(...children);
            }

            const nodes = this._data.map((dto) => this.dtoToNode(dto)).filter((x): x is INode => !!x);
            if (nodes.length) {
                rootNode.add(...nodes);
            }
        } finally {
            this.suppressNodeOutbound = false;
        }

        try {
            this.app.activeView?.cameraController?.fitContent?.();
        } catch {}
    }

    private applySelection() {
        if (!this.doc) return;
        this.suppressSelectionOutbound = true;
        try {
            const nodes = this._selectedIds
                .map((id) => this.findNodeById(id))
                .filter((x): x is INode => !!x);
            this.doc.selection.setSelection(nodes, false);
        } finally {
            this.suppressSelectionOutbound = false;
        }
    }

    private findNodeById(id: string): INode | undefined {
        if (!this.doc) return undefined;
        const root = this.doc.rootNode;
        return this.findNodeInTree(root, id);
    }

    private findNodeInTree(node: INode, id: string): INode | undefined {
        if ((node as any).id === id) return node;
        if (this.isLinkedListNode(node)) {
            let child = (node as INodeLinkedList).firstChild;
            while (child) {
                const found = this.findNodeInTree(child, id);
                if (found) return found;
                child = child.nextSibling;
            }
        }
        return undefined;
    }

    private isLinkedListNode(node: INode): node is INodeLinkedList {
        return typeof (node as INodeLinkedList).add === "function" && "firstChild" in node;
    }

    private dtoToNode(dto: EntityDTO): INode | undefined {
        if (!this.doc) return undefined;

        if (dto.type === "GroupNode") {
            const group = new GroupNode(this.doc, dto.name, dto.id);
            this.applyEntityBase(group, dto as any);
            const children: EntityDTO[] = (dto as any).children ?? [];
            const nodes = children.map((c) => this.dtoToNode(c)).filter((x): x is INode => !!x);
            if (nodes.length) {
                group.add(...nodes);
            }
            return group;
        }

        const planeFromDto = (p: any) =>
            new Plane(
                new XYZ(p.origin.x, p.origin.y, p.origin.z),
                new XYZ(p.normal.x, p.normal.y, p.normal.z),
                new XYZ(p.xvec.x, p.xvec.y, p.xvec.z),
            );

        const xyzFromDto = (p: any) => new XYZ(p.x, p.y, p.z);

        let node: INode | undefined;
        switch (dto.type) {
            case "LineNode":
                node = new LineNode(this.doc, xyzFromDto((dto as any).start), xyzFromDto((dto as any).end));
                break;
            case "CircleNode":
                node = new CircleNode(
                    this.doc,
                    xyzFromDto((dto as any).normal),
                    xyzFromDto((dto as any).center),
                    (dto as any).radius,
                );
                (node as any).isFace = (dto as any).isFace ?? false;
                break;
            case "BoxNode":
                node = new BoxNode(
                    this.doc,
                    planeFromDto((dto as any).plane),
                    (dto as any).dx,
                    (dto as any).dy,
                    (dto as any).dz,
                );
                break;
            case "SphereNode":
                node = new SphereNode(this.doc, xyzFromDto((dto as any).center), (dto as any).radius);
                break;
            case "CylinderNode":
                node = new CylinderNode(
                    this.doc,
                    xyzFromDto((dto as any).plane?.normal ?? (dto as any).normal),
                    xyzFromDto((dto as any).center),
                    (dto as any).radius,
                    (dto as any).height ?? (dto as any).dz,
                );
                break;
            case "ConeNode":
                node = new ConeNode(
                    this.doc,
                    xyzFromDto((dto as any).plane?.normal ?? (dto as any).normal),
                    xyzFromDto((dto as any).center),
                    (dto as any).radius,
                    (dto as any).height ?? (dto as any).dz,
                );
                break;
            case "RectNode":
                node = new RectNode(
                    this.doc,
                    planeFromDto((dto as any).plane),
                    (dto as any).width,
                    (dto as any).height,
                );
                (node as any).isFace = (dto as any).isFace ?? false;
                break;
            case "EllipseNode":
                node = new EllipseNode(
                    this.doc,
                    xyzFromDto((dto as any).normal),
                    xyzFromDto((dto as any).center),
                    xyzFromDto((dto as any).majorAxis),
                    (dto as any).majorRadius,
                    (dto as any).minorRadius,
                );
                (node as any).isFace = (dto as any).isFace ?? false;
                break;
            default:
                return undefined;
        }

        this.applyEntityBase(node, dto as any);
        return node;
    }

    private applyEntityBase(node: any, dto: any) {
        try {
            node.id = dto.id;
        } catch {}
        if (dto.name !== undefined) node.name = dto.name;
        if (dto.visible !== undefined) node.visible = dto.visible;
        if (dto.parentVisible !== undefined) node.parentVisible = dto.parentVisible;
        if (dto.layerId !== undefined && "layerId" in node) node.layerId = dto.layerId;
        if (dto.transform !== undefined && "transform" in node)
            node.transform = Matrix4.fromArray(dto.transform);
        if (dto.rev !== undefined) node.rev = dto.rev;

        if (dto.nativeProps !== undefined) {
            try {
                node.nativeProps = dto.nativeProps;
            } catch {}
        }

        if (dto.materialId !== undefined && node instanceof GeometryNode) {
            node.materialId = dto.materialId;
        }
        if (dto.faceMaterialPair !== undefined && node instanceof GeometryNode) {
            node.faceMaterialPair = (dto.faceMaterialPair ?? []).map(
                (x: any) => new FaceMaterialPair(x.faceIndex, x.materialIndex),
            );
        }

        if (dto.bizProps?.values && node instanceof VisualNode) {
            const values = dto.bizProps.values as Record<string, { t: string; v: any }>;
            const props: Record<string, any> = {};
            const types: Record<string, any> = {};
            Object.entries(values).forEach(([key, tv]) => {
                if (!tv || tv.t === "delete") return;
                props[key] = tv.v;
                types[key] = tv.t;
            });
            node.customProperties = JSON.stringify(props);
            node.customPropertyTypes = JSON.stringify(types);
        }
    }

    private nodeToDto(node: INode | undefined): EntityDTO | undefined {
        if (!node) return undefined;
        const base: any = {
            id: (node as any).id,
            type: node.constructor?.name ?? "Unknown",
            name: (node as any).name ?? "",
            visible: (node as any).visible,
            parentVisible: (node as any).parentVisible,
            layerId: (node as any).layerId,
            transform: (node as any).transform?.toArray?.() ?? undefined,
            nativeProps: (node as any).nativeProps,
            rev: (node as any).rev ?? 0,
        };

        if (node instanceof VisualNode) {
            const bizValues: Record<string, any> = {};
            const props = this.tryParseJson(node.customProperties);
            const types = this.tryParseJson(node.customPropertyTypes);
            if (props && typeof props === "object") {
                Object.keys(props).forEach((k) => {
                    const t = (types as any)?.[k] ?? typeof (props as any)[k];
                    bizValues[k] = { t: String(t), v: (props as any)[k] };
                });
            }
            if (Object.keys(bizValues).length) {
                base.bizProps = { values: bizValues };
            }
        }

        if (node instanceof GeometryNode) {
            base.materialId = node.materialId;
            base.faceMaterialPair =
                node.faceMaterialPair?.map((x) => ({
                    faceIndex: x.faceIndex,
                    materialIndex: x.materialIndex,
                })) ?? [];
        }

        if (node instanceof LineNode) {
            return {
                ...base,
                type: "LineNode",
                start: this.xyzToDto(node.start),
                end: this.xyzToDto(node.end),
            } as EntityDTO;
        }
        if (node instanceof CircleNode) {
            return {
                ...base,
                type: "CircleNode",
                center: this.xyzToDto(node.center),
                radius: node.radius,
                normal: this.xyzToDto(node.normal),
                isFace: (node as any).isFace ?? false,
            } as EntityDTO;
        }
        if (node instanceof BoxNode) {
            return {
                ...base,
                type: "BoxNode",
                plane: this.planeToDto(node.plane),
                dx: node.dx,
                dy: node.dy,
                dz: node.dz,
            } as EntityDTO;
        }
        if (node instanceof SphereNode) {
            return {
                ...base,
                type: "SphereNode",
                center: this.xyzToDto(node.center),
                radius: node.radius,
            } as EntityDTO;
        }
        if (node instanceof CylinderNode) {
            return {
                ...base,
                type: "CylinderNode",
                center: this.xyzToDto(node.center),
                radius: node.radius,
                height: (node as any).dz ?? (node as any).height,
                plane: {
                    origin: this.xyzToDto(node.center),
                    normal: this.xyzToDto((node as any).normal),
                    xvec: this.xyzToDto(Plane.XY.xvec),
                    yvec: this.xyzToDto(Plane.XY.yvec),
                },
            } as EntityDTO;
        }
        if (node instanceof ConeNode) {
            return {
                ...base,
                type: "ConeNode",
                center: this.xyzToDto((node as any).center),
                radius: (node as any).radius,
                height: (node as any).dz ?? (node as any).height,
                plane: {
                    origin: this.xyzToDto((node as any).center),
                    normal: this.xyzToDto((node as any).normal),
                    xvec: this.xyzToDto(Plane.XY.xvec),
                    yvec: this.xyzToDto(Plane.XY.yvec),
                },
            } as EntityDTO;
        }
        if (node instanceof RectNode) {
            return {
                ...base,
                type: "RectNode",
                plane: this.planeToDto((node as any).plane),
                width: (node as any).width,
                height: (node as any).height,
                isFace: (node as any).isFace ?? false,
            } as EntityDTO;
        }
        if (node instanceof EllipseNode) {
            return {
                ...base,
                type: "EllipseNode",
                center: this.xyzToDto((node as any).center),
                majorRadius: (node as any).majorRadius,
                minorRadius: (node as any).minorRadius,
                normal: this.xyzToDto((node as any).normal),
                majorAxis: this.xyzToDto((node as any).majorAxis),
                isFace: (node as any).isFace ?? false,
            } as EntityDTO;
        }

        if (this.isLinkedListNode(node)) {
            const children: EntityDTO[] = [];
            for (let c = node.firstChild; c; c = c.nextSibling) {
                const dto = this.nodeToDto(c);
                if (dto) children.push(dto);
            }
            if (children.length) {
                return { ...base, type: "GroupNode", children } as EntityDTO;
            }
        }

        return base as EntityDTO;
    }

    private propertyChangeToPatch(
        node: INode,
        propertyName: string,
        oldValue: unknown,
        newValue: unknown,
        rev: number,
    ): PatchOp | undefined {
        if (propertyName === "customPropertyTypes") return undefined;

        if (propertyName === "customProperties" && node instanceof VisualNode) {
            const oldObj = this.tryParseJson(oldValue as any) ?? {};
            const newObj = this.tryParseJson(newValue as any) ?? {};
            const types = this.tryParseJson(node.customPropertyTypes) ?? {};
            const values: Record<string, any> = {};
            const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
            keys.forEach((k) => {
                if (!(k in newObj)) {
                    values[k] = { t: "delete", v: null };
                    return;
                }
                if (!(k in oldObj) || (oldObj as any)[k] !== (newObj as any)[k]) {
                    const t = (types as any)[k] ?? typeof (newObj as any)[k];
                    values[k] = { t: String(t), v: (newObj as any)[k] };
                }
            });
            if (!Object.keys(values).length) return undefined;
            return { op: "updateBiz", id: (node as any).id, rev, values };
        }

        const dtoValue = this.valueToDto(newValue);
        if (dtoValue === undefined) {
            return { op: "update", id: (node as any).id, rev, unset: [propertyName] as any };
        }
        return { op: "update", id: (node as any).id, rev, set: { [propertyName]: dtoValue } as any };
    }

    private valueToDto(value: any) {
        if (value instanceof XYZ) return this.xyzToDto(value);
        if (value instanceof Plane) return this.planeToDto(value);
        if (value instanceof Matrix4) return value.toArray();
        return value;
    }

    private xyzToDto(p: XYZ) {
        return { x: p.x, y: p.y, z: p.z };
    }

    private planeToDto(p: Plane) {
        return {
            origin: this.xyzToDto(p.origin),
            normal: this.xyzToDto(p.normal),
            xvec: this.xyzToDto(p.xvec),
            yvec: this.xyzToDto(p.yvec),
        };
    }

    private tryParseJson(value: any) {
        if (typeof value !== "string") return value;
        try {
            return JSON.parse(value);
        } catch {
            return undefined;
        }
    }
}

if (!customElements.get("chili3d-editor")) {
    customElements.define("chili3d-editor", Chili3DEditorElement);
}
