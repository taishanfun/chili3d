import {
    ArcNode,
    BooleanNode,
    BoxNode,
    CircleNode,
    ConeNode,
    CylinderNode,
    EllipseNode,
    FaceNode,
    FuseNode,
    LineNode,
    PolygonNode,
    PrismNode,
    PyramidNode,
    RectNode,
    RevolvedNode,
    SphereNode,
    SweepedNode,
    WireNode,
} from "chili";
import { AppBuilder } from "chili-builder";
import {
    Chili3DNotificationService,
    Component,
    ComponentNode,
    Continuity,
    CustomEventTransport,
    DimensionNode,
    download,
    EditableShapeNode,
    FolderNode,
    GroupNode,
    INode,
    Layer,
    LeaderNode,
    Material,
    Matrix4,
    Mesh,
    MeshNode,
    MTextNode,
    MultiShapeNode,
    NodeAdapter,
    Plane,
    PostMessageTransport,
    PubSub,
    Ray,
    TextNode,
    VisualNode,
    XYZ,
} from "chili-core";
import { ref } from "vue";

const sampleDocumentLayers = [
    {
        classKey: "Layer",
        properties: {
            id: "layer-1",
            name: "Layer 1",
            visible: true,
            locked: false,
            color: "#333333",
            lineType: 0,
        },
    },
    {
        classKey: "Layer",
        properties: {
            id: "layer-2",
            name: "Layer 2",
            visible: true,
            locked: false,
            color: "#00AAFF",
            lineType: 0,
        },
    },
    {
        classKey: "Layer",
        properties: {
            id: "layer-3",
            name: "Layer 3",
            visible: true,
            locked: false,
            color: "#FF8800",
            lineType: 1,
        },
    },
];

const sampleDocumentMaterials = [
    {
        classKey: "Material",
        properties: {
            vertexColors: false,
            transparent: true,
            id: "UCgYJbreeThppW6j-cdgg",
            name: "LightGray",
            color: 14606046,
            opacity: 1,
            map: {
                classKey: "Texture",
                properties: {
                    image: "",
                    wrapS: 1000,
                    wrapT: 1000,
                    rotation: 0,
                    offset: { classKey: "XY", properties: { x: 0, y: 0 } },
                    repeat: { classKey: "XY", properties: { x: 1, y: 1 } },
                    center: { classKey: "XY", properties: { x: 0.5, y: 0.5 } },
                },
            },
        },
    },
    {
        classKey: "Material",
        properties: {
            vertexColors: false,
            transparent: true,
            id: "s60w2Sm_6aJRczQHbzhED",
            name: "DeepGray",
            color: 9013641,
            opacity: 1,
            map: {
                classKey: "Texture",
                properties: {
                    image: "",
                    wrapS: 1000,
                    wrapT: 1000,
                    rotation: 0,
                    offset: { classKey: "XY", properties: { x: 0, y: 0 } },
                    repeat: { classKey: "XY", properties: { x: 1, y: 1 } },
                    center: { classKey: "XY", properties: { x: 0.5, y: 0.5 } },
                },
            },
        },
    },
];

const sampleDocument2dSerialized = {
    classKey: "Document",
    version: "0.6",
    properties: {
        id: "Q4i3_JUBJaP6gy2BTbILY",
        name: "Embedded Demo (2D)",
        mode: "2d",
        currentLayerId: "layer-1",
        components: [],
        nodes: [
            {
                classKey: "FolderNode",
                properties: {
                    id: "WAj9pF1pPg3C15OuJQ9N3",
                    name: "Embedded Demo (2D)",
                    rev: 0,
                    customProperties: "{}",
                    customPropertyTypes: "{}",
                    visible: true,
                },
            },
            {
                classKey: "GroupNode",
                parentId: "WAj9pF1pPg3C15OuJQ9N3",
                properties: {
                    id: "G-2D",
                    name: "2D Primitives",
                    rev: 0,
                    customProperties: "{}",
                    customPropertyTypes: "{}",
                    visible: true,
                    transform: {
                        classKey: "Matrix4",
                        properties: { array: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] },
                    },
                },
            },
            {
                classKey: "LineNode",
                parentId: "G-2D",
                properties: {
                    id: "L-1",
                    name: "Line",
                    start: { classKey: "XYZ", properties: { x: 0, y: 0, z: 0 } },
                    end: { classKey: "XYZ", properties: { x: 80, y: 0, z: 0 } },
                    visible: true,
                    customProperties: '{"bizKey":"line-1"}',
                    customPropertyTypes: '{"bizKey":"string"}',
                },
            },
            {
                classKey: "CircleNode",
                parentId: "G-2D",
                properties: {
                    id: "C-1",
                    name: "Circle",
                    normal: { classKey: "XYZ", properties: { x: 0, y: 0, z: 1 } },
                    center: { classKey: "XYZ", properties: { x: 40, y: 40, z: 0 } },
                    radius: 20,
                    isFace: false,
                    visible: true,
                },
            },
            {
                classKey: "EllipseNode",
                parentId: "G-2D",
                properties: {
                    id: "E-1",
                    name: "Ellipse",
                    normal: { classKey: "XYZ", properties: { x: 0, y: 0, z: 1 } },
                    center: { classKey: "XYZ", properties: { x: 110, y: 40, z: 0 } },
                    xvec: { classKey: "XYZ", properties: { x: 1, y: 0, z: 0 } },
                    majorRadius: 30,
                    minorRadius: 15,
                    isFace: false,
                    visible: true,
                },
            },
            {
                classKey: "PolygonNode",
                parentId: "G-2D",
                properties: {
                    id: "P-1",
                    name: "Polygon",
                    points: [
                        { classKey: "XYZ", properties: { x: 0, y: 90, z: 0 } },
                        { classKey: "XYZ", properties: { x: 40, y: 120, z: 0 } },
                        { classKey: "XYZ", properties: { x: 90, y: 95, z: 0 } },
                        { classKey: "XYZ", properties: { x: 70, y: 70, z: 0 } },
                        { classKey: "XYZ", properties: { x: 0, y: 90, z: 0 } },
                    ],
                    isFace: false,
                    visible: true,
                },
            },
            {
                classKey: "RectNode",
                parentId: "G-2D",
                properties: {
                    id: "R-1",
                    name: "Rect",
                    plane: {
                        classKey: "Plane",
                        properties: {
                            origin: { classKey: "XYZ", properties: { x: 110, y: 80, z: 0 } },
                            normal: { classKey: "XYZ", properties: { x: 0, y: 0, z: 1 } },
                            xvec: { classKey: "XYZ", properties: { x: 1, y: 0, z: 0 } },
                        },
                    },
                    dx: 60,
                    dy: 30,
                    isFace: false,
                    visible: true,
                },
            },
            {
                classKey: "TextNode",
                parentId: "G-2D",
                properties: {
                    id: "T-1",
                    name: "Text",
                    text: "Hello Chili3D",
                    height: 10,
                    color: 16711680,
                    horizontalAlign: "left",
                    verticalAlign: "bottom",
                    visible: true,
                    transform: {
                        classKey: "Matrix4",
                        properties: { array: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 140, 0, 1] },
                    },
                },
            },
            {
                classKey: "MTextNode",
                parentId: "G-2D",
                properties: {
                    id: "MT-1",
                    name: "MText",
                    text: "Line 1\\nLine 2\\nLine 3",
                    height: 8,
                    color: 255,
                    lineSpacing: 1.2,
                    lineColors: [255, 65280, 16711680],
                    horizontalAlign: "left",
                    verticalAlign: "top",
                    visible: true,
                    transform: {
                        classKey: "Matrix4",
                        properties: { array: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 120, 140, 0, 1] },
                    },
                },
            },
            {
                classKey: "LeaderNode",
                parentId: "G-2D",
                properties: {
                    id: "LD-1",
                    name: "Leader",
                    points: [
                        { classKey: "XYZ", properties: { x: 180, y: 0, z: 0 } },
                        { classKey: "XYZ", properties: { x: 210, y: 20, z: 0 } },
                        { classKey: "XYZ", properties: { x: 240, y: 20, z: 0 } },
                    ],
                    text: "Leader note",
                    height: 8,
                    isAssociative: false,
                    visible: true,
                },
            },
            {
                classKey: "DimensionNode",
                parentId: "G-2D",
                properties: {
                    id: "DIM-1",
                    name: "Horizontal Dimension",
                    type: "horizontal",
                    p1: { classKey: "XYZ", properties: { x: 0, y: 0, z: 0 } },
                    p2: { classKey: "XYZ", properties: { x: 80, y: 0, z: 0 } },
                    location: { classKey: "XYZ", properties: { x: 40, y: -20, z: 0 } },
                    planeOrigin: { classKey: "XYZ", properties: { x: 0, y: 0, z: 0 } },
                    planeX: { classKey: "XYZ", properties: { x: 1, y: 0, z: 0 } },
                    planeY: { classKey: "XYZ", properties: { x: 0, y: 1, z: 0 } },
                    planeNormal: { classKey: "XYZ", properties: { x: 0, y: 0, z: 1 } },
                    visible: true,
                },
            },
        ],
        layers: sampleDocumentLayers,
        materials: sampleDocumentMaterials,
        acts: [],
    },
};

const sampleDocument3dSerialized = {
    classKey: "Document",
    version: "0.6",
    properties: {
        id: "Q4i3_JUBJaP6gy2BTbILY",
        name: "Embedded Demo (3D)",
        mode: "3d",
        currentLayerId: "layer-1",
        components: [],
        nodes: [
            {
                classKey: "FolderNode",
                properties: {
                    id: "WAj9pF1pPg3C15OuJQ9N3",
                    name: "Embedded Demo (3D)",
                    rev: 0,
                    customProperties: "{}",
                    customPropertyTypes: "{}",
                    visible: true,
                },
            },
            {
                classKey: "GroupNode",
                parentId: "WAj9pF1pPg3C15OuJQ9N3",
                properties: {
                    id: "G-3D",
                    name: "3D Solids",
                    rev: 0,
                    customProperties: "{}",
                    customPropertyTypes: "{}",
                    visible: true,
                    transform: {
                        classKey: "Matrix4",
                        properties: { array: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] },
                    },
                },
            },
            {
                classKey: "BoxNode",
                parentId: "G-3D",
                properties: {
                    id: "B-1",
                    name: "Box",
                    plane: {
                        classKey: "Plane",
                        properties: {
                            origin: { classKey: "XYZ", properties: { x: 0, y: 0, z: 0 } },
                            normal: { classKey: "XYZ", properties: { x: 0, y: 0, z: 1 } },
                            xvec: { classKey: "XYZ", properties: { x: 1, y: 0, z: 0 } },
                        },
                    },
                    dx: 30,
                    dy: 30,
                    dz: 30,
                    visible: true,
                },
            },
            {
                classKey: "SphereNode",
                parentId: "G-3D",
                properties: {
                    id: "S-1",
                    name: "Sphere",
                    center: { classKey: "XYZ", properties: { x: 60, y: 0, z: 0 } },
                    radius: 18,
                    visible: true,
                },
            },
            {
                classKey: "CylinderNode",
                parentId: "G-3D",
                properties: {
                    id: "CY-1",
                    name: "Cylinder",
                    normal: { classKey: "XYZ", properties: { x: 0, y: 0, z: 1 } },
                    center: { classKey: "XYZ", properties: { x: 100, y: 0, z: 0 } },
                    radius: 12,
                    dz: 30,
                    visible: true,
                },
            },
            {
                classKey: "ConeNode",
                parentId: "G-3D",
                properties: {
                    id: "CO-1",
                    name: "Cone",
                    normal: { classKey: "XYZ", properties: { x: 0, y: 0, z: 1 } },
                    center: { classKey: "XYZ", properties: { x: 140, y: 0, z: 0 } },
                    radius: 14,
                    dz: 35,
                    visible: true,
                },
            },
            {
                classKey: "PyramidNode",
                parentId: "G-3D",
                properties: {
                    id: "PY-1",
                    name: "Pyramid",
                    plane: {
                        classKey: "Plane",
                        properties: {
                            origin: { classKey: "XYZ", properties: { x: 180, y: 0, z: 0 } },
                            normal: { classKey: "XYZ", properties: { x: 0, y: 0, z: 1 } },
                            xvec: { classKey: "XYZ", properties: { x: 1, y: 0, z: 0 } },
                        },
                    },
                    dx: 30,
                    dy: 30,
                    dz: 40,
                    visible: true,
                },
            },
        ],
        layers: sampleDocumentLayers,
        materials: sampleDocumentMaterials,
        acts: [],
    },
};

const cloneSerialized = (value) => JSON.parse(JSON.stringify(value));

const safeValue = (r) => (r && r.isOk ? r.value : undefined);

export function useChiliApp() {
    const isReady = ref(false);
    const statusItems = ref([]);
    const logs = ref([]);
    const documentJson = ref("");
    const patchJson = ref("");
    const selectionIds = ref("");
    const selectedNodeSnapshot = ref(undefined);
    const layerOptions = ref([]);
    const materialOptions = ref([]);
    const commandKey = ref("doc.new");
    const newDocumentName = ref("Embedded Demo");
    const newDocumentMode = ref("3d");
    const viewMode = ref("edit");
    const exportFormat = ref(".stl");
    const exportFormats = ref([]);

    let appRef;
    let documentRef;
    let adapterRef;
    let notificationServiceRef;
    let hostListenersBound = false;
    let editorServiceActive = true;

    const ensureSerializerRegistration = () => {
        return [
            Layer,
            Material,
            FolderNode,
            GroupNode,
            Component,
            ComponentNode,
            Mesh,
            MeshNode,
            MultiShapeNode,
            EditableShapeNode,
            TextNode,
            MTextNode,
            LeaderNode,
            DimensionNode,
            Matrix4,
            Plane,
            Ray,
            XYZ,
            LineNode,
            ArcNode,
            CircleNode,
            EllipseNode,
            PolygonNode,
            RectNode,
            WireNode,
            FaceNode,
            BoxNode,
            SphereNode,
            CylinderNode,
            ConeNode,
            PyramidNode,
            PrismNode,
            RevolvedNode,
            SweepedNode,
            FuseNode,
            BooleanNode,
        ].length;
    };

    const pushLog = (type, message, detail) => {
        const payload =
            detail === undefined
                ? undefined
                : typeof detail === "string"
                  ? detail
                  : JSON.stringify(detail, null, 2);
        logs.value.unshift({
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            time: new Date().toLocaleTimeString(),
            type,
            message,
            detail: payload,
        });
        if (logs.value.length > 200) {
            logs.value.length = 200;
        }
    };

    const pushHostMessage = (channel, message) => {
        if (!message || message.protocol !== "chili3d") return;
        if (message.eventType === "batch" && Array.isArray(message.events)) {
            message.events.forEach((evt) => pushHostMessage(`${channel}/batch`, evt));
            return;
        }
        const title = `${channel}:${message.eventType}`;
        pushLog("host", title, message);
    };

    const bindHostListeners = () => {
        if (hostListenersBound) return;
        hostListenersBound = true;

        window.addEventListener("chili3d:notify", (e) => {
            pushHostMessage("CustomEvent", e?.detail);
        });

        window.addEventListener("message", (e) => {
            pushHostMessage("postMessage", e?.data);
        });
    };

    const getEditorService = () => {
        const services = appRef?.services;
        if (!services) return undefined;
        return services.find((service) => service?.constructor?.name === "EditorService");
    };

    const refreshStatus = () => {
        statusItems.value = [
            {
                key: "load",
                label: "load(dto)",
                mapping: "app.loadDocument",
                ok: typeof appRef?.loadDocument === "function",
            },
            {
                key: "dump",
                label: "dump()",
                mapping: "document.serialize",
                ok: typeof documentRef?.serialize === "function",
            },
            {
                key: "applyPatch",
                label: "applyPatch(envelope)",
                mapping: "NodeAdapter.applyPatchEnvelope",
                ok: typeof adapterRef?.applyPatchEnvelope === "function",
            },
            {
                key: "setMode",
                label: "setMode(view/edit)",
                mapping: "EditorService.start/stop + visual.resetEventHandler",
                ok: !!getEditorService(),
            },
            {
                key: "getSelection",
                label: "getSelection()",
                mapping: "document.selection.getSelectedNodes",
                ok: typeof documentRef?.selection?.getSelectedNodes === "function",
            },
            {
                key: "setSelection",
                label: "setSelection(ids)",
                mapping: "document.selection.setSelection",
                ok: typeof documentRef?.selection?.setSelection === "function",
            },
            {
                key: "exportDxf",
                label: "exportDxf()",
                mapping: "custom dxf exporter (edges)",
                ok: true,
            },
            {
                key: "export",
                label: "export(format)",
                mapping: "app.dataExchange.export + download",
                ok: typeof appRef?.dataExchange?.export === "function",
            },
            {
                key: "events",
                label: "on(event)",
                mapping: "PubSub.default.sub",
                ok: typeof PubSub?.default?.sub === "function",
            },
        ];
    };

    const toXYZDto = (value) => {
        if (!value || typeof value.x !== "number") return undefined;
        return { x: value.x, y: value.y, z: value.z };
    };

    const toPlaneDto = (value) => {
        if (!value) return undefined;
        const origin = toXYZDto(value.origin);
        const normal = toXYZDto(value.normal);
        const xvec = toXYZDto(value.xvec);
        const yvec = toXYZDto(value.yvec);
        if (!origin || !normal || !xvec || !yvec) return undefined;
        return { origin, normal, xvec, yvec };
    };

    const snapshotSelectedNode = () => {
        if (!documentRef) return undefined;
        const selected = documentRef.selection.getSelectedNodes();
        const node = selected.length === 1 ? selected[0] : undefined;
        if (!node) return undefined;

        let customProperties = {};
        try {
            customProperties = JSON.parse(node.customProperties || "{}");
        } catch {
            customProperties = {};
        }

        let customPropertyTypes = {};
        try {
            customPropertyTypes = JSON.parse(node.customPropertyTypes || "{}");
        } catch {
            customPropertyTypes = {};
        }

        const geometry = {};
        [
            "start",
            "end",
            "center",
            "radius",
            "normal",
            "plane",
            "dx",
            "dy",
            "dz",
            "width",
            "height",
            "majorRadius",
            "minorRadius",
            "majorAxis",
            "isFace",
        ].forEach((key) => {
            if (!(key in node)) return;
            const v = node[key];
            if (key === "plane") {
                const dto = toPlaneDto(v);
                if (dto) geometry[key] = dto;
                return;
            }
            if (["start", "end", "center", "normal", "majorAxis"].includes(key)) {
                const dto = toXYZDto(v);
                if (dto) geometry[key] = dto;
                return;
            }
            if (typeof v !== "function") geometry[key] = v;
        });

        return {
            documentId: documentRef.id,
            id: node.id,
            name: node.name,
            rev: typeof node.rev === "number" ? node.rev : 0,
            type: node.constructor?.name,
            visible: !!node.visible,
            layerId: node.layerId,
            transform: node.transform?.toArray ? node.transform.toArray() : undefined,
            materialId:
                "materialId" in node
                    ? Array.isArray(node.materialId)
                        ? node.materialId[0]
                        : node.materialId
                    : undefined,
            customProperties,
            customPropertyTypes,
            geometry,
        };
    };

    const refreshSelectionSnapshot = () => {
        selectedNodeSnapshot.value = snapshotSelectedNode();
    };

    const refreshDocOptions = () => {
        layerOptions.value = (documentRef?.layers ?? []).map((l) => ({ id: l.id, name: l.name }));
        materialOptions.value = (documentRef?.materials ?? []).map((m) => ({ id: m.id, name: m.name }));
    };

    const setActiveDocument = (doc) => {
        notificationServiceRef?.dispose();
        notificationServiceRef = undefined;
        documentRef = doc;
        adapterRef = doc ? new NodeAdapter(doc) : undefined;
        if (doc) {
            const transports = [
                new CustomEventTransport(window, "chili3d:notify"),
                new PostMessageTransport(window, "*"),
            ];
            if (window.parent && window.parent !== window) {
                transports.push(new PostMessageTransport(window.parent, "*"));
            }
            notificationServiceRef = new Chili3DNotificationService(doc, {
                transports,
                scheduleMode: "debounce",
                scheduleMs: 60,
            });
        }
        refreshStatus();
        refreshDocOptions();
        refreshExamples();
        refreshSelectionSnapshot();
    };

    const refreshExamples = () => {
        if (!documentRef) return;
        documentJson.value = JSON.stringify(documentRef.serialize(), null, 2);
        patchJson.value = JSON.stringify(
            {
                documentId: documentRef.id,
                source: "host",
                mutationId: `host-sample-${Date.now()}`,
                baseDocumentRev: 0,
                ts: Date.now(),
                patches: [
                    {
                        op: "update",
                        id: documentRef.rootNode.id,
                        rev: 1,
                        set: {
                            name: `${documentRef.rootNode.name} (patched)`,
                        },
                    },
                ],
            },
            null,
            2,
        );
    };

    const init = async () => {
        ensureSerializerRegistration();
        bindHostListeners();
        const app = await new AppBuilder().useIndexedDB().useWasmOcc().useThree().useUI().build();
        appRef = app;
        exportFormats.value = [".dxf (edges)", ...appRef.dataExchange.exportFormats()];
        const doc = await app.newDocument(newDocumentName.value, newDocumentMode.value);
        setActiveDocument(doc);
        isReady.value = true;
        bindEvents();
        pushLog("info", "App initialized");
    };

    const bindEvents = () => {
        PubSub.default.sub("selectionChanged", (_document, selected) => {
            selectionIds.value = selected.map((node) => node.id).join(",");
            refreshSelectionSnapshot();
            pushLog("event", "selectionChanged", { ids: selected.map((x) => x.id) });
        });
        PubSub.default.sub("modelUpdate", (model) => {
            pushLog("event", "modelUpdate", { id: model.id, name: model.name });
        });
        PubSub.default.sub("activeViewChanged", (view) => {
            pushLog("event", "activeViewChanged", { view: view?.name });
        });
        PubSub.default.sub("documentClosed", (document) => {
            pushLog("event", "documentClosed", { id: document.id, name: document.name });
        });
    };

    const createDocument = async () => {
        if (!appRef) return;
        const doc = await appRef.newDocument(newDocumentName.value || "Untitled", newDocumentMode.value);
        setActiveDocument(doc);
        pushLog("action", "newDocument", { name: doc.name, mode: doc.mode });
    };

    const dumpDocument = () => {
        if (!documentRef) return;
        documentJson.value = JSON.stringify(documentRef.serialize(), null, 2);
        pushLog("action", "dump");
    };

    const loadDocument = async () => {
        if (!appRef) return;
        try {
            const data = JSON.parse(documentJson.value);
            const doc = await appRef.loadDocument(data);
            if (!doc) {
                pushLog("error", "loadDocument failed");
                return;
            }
            setActiveDocument(doc);
            pushLog("action", "loadDocument", { id: doc.id, name: doc.name });
        } catch (error) {
            pushLog("error", "loadDocument parse failed", { error: String(error) });
        }
    };

    const loadSampleDocument = async (sample) => {
        if (!appRef) return;
        try {
            const payload = cloneSerialized(sample);
            documentJson.value = JSON.stringify(payload, null, 2);
            const doc = await appRef.loadDocument(payload);
            if (!doc) {
                pushLog("error", "loadSampleDocument failed");
                return;
            }
            setActiveDocument(doc);
            pushLog("action", "loadSampleDocument", { id: doc.id, name: doc.name });
        } catch (error) {
            pushLog("error", "loadSampleDocument failed", { error: String(error) });
        }
    };

    const loadSampleDocument2d = async () => {
        return loadSampleDocument(sampleDocument2dSerialized);
    };

    const loadSampleDocument3d = async () => {
        return loadSampleDocument(sampleDocument3dSerialized);
    };

    const generateAllPrimitivesSerialized = async () => {
        if (!appRef) return undefined;

        const doc = await appRef.newDocument("Embedded Demo (All Primitives)", "3d");

        try {
            doc.history.disabled = true;

            doc.layers.push(new Layer(doc, "Layer 2", "#00AAFF"), new Layer(doc, "Layer 3", "#FF8800"));
            doc.materials.push(
                new Material(doc, "Default", 0xdddddd),
                new Material(doc, "Accent", 0x00aaff),
            );

            const root = doc.rootNode;
            const g2d = new GroupNode(doc, "2D");
            const g3d = new GroupNode(doc, "3D");
            const gShape = new GroupNode(doc, "Shape-Based");
            const gExtra = new GroupNode(doc, "Extra");
            root.add(g2d, g3d, gShape, gExtra);

            const layer2Id = doc.layers.at(1)?.id;
            const layer3Id = doc.layers.at(2)?.id;

            const l1 = new LineNode(doc, new XYZ(0, 0, 0), new XYZ(80, 0, 0));
            l1.name = "Line";
            if (layer2Id) l1.layerId = layer2Id;

            const a1 = new ArcNode(doc, XYZ.unitZ, new XYZ(40, 30, 0), new XYZ(60, 30, 0), 220);
            a1.name = "Arc";

            const c1 = new CircleNode(doc, XYZ.unitZ, new XYZ(40, 70, 0), 20);
            c1.name = "Circle";
            c1.isFace = false;

            const e1 = new EllipseNode(doc, XYZ.unitZ, new XYZ(110, 70, 0), XYZ.unitX, 30, 15);
            e1.name = "Ellipse";
            e1.isFace = false;

            const p1 = new PolygonNode(doc, [
                new XYZ(0, 110, 0),
                new XYZ(40, 140, 0),
                new XYZ(90, 120, 0),
                new XYZ(70, 90, 0),
                new XYZ(0, 110, 0),
            ]);
            p1.name = "Polygon";
            p1.isFace = false;

            const r1 = new RectNode(doc, new Plane(new XYZ(110, 110, 0), XYZ.unitZ, XYZ.unitX), 60, 30);
            r1.name = "Rect";
            r1.isFace = false;

            const t1 = new TextNode(doc, "Hello Chili3D", "Text");
            t1.transform = Matrix4.fromTranslation(10, 170, 0);
            t1.height = 10;
            t1.color = 0xff0000;
            if (layer3Id) t1.layerId = layer3Id;

            const mt1 = new MTextNode(doc, "Line 1\nLine 2\nLine 3", "MText");
            mt1.transform = Matrix4.fromTranslation(120, 170, 0);
            mt1.height = 8;
            mt1.color = 0x0000ff;
            mt1.lineSpacing = 1.2;
            mt1.lineColors = [0x0000ff, 0x00ff00, 0xff0000];

            const ld1 = new LeaderNode(
                doc,
                [new XYZ(180, 30, 0), new XYZ(210, 50, 0), new XYZ(240, 50, 0)],
                "Leader note",
                "Leader",
            );
            ld1.height = 8;
            ld1.isAssociative = false;

            const dim1 = new DimensionNode(
                doc,
                "horizontal",
                new XYZ(0, 0, 0),
                new XYZ(80, 0, 0),
                new XYZ(40, -20, 0),
                new XYZ(0, 0, 0),
                XYZ.unitX,
                XYZ.unitY,
                XYZ.unitZ,
                "Horizontal Dimension",
            );

            g2d.add(l1, a1, c1, e1, p1, r1, t1, mt1, ld1, dim1);

            const b1 = new BoxNode(doc, new Plane(new XYZ(0, 0, 0), XYZ.unitZ, XYZ.unitX), 30, 30, 30);
            b1.name = "Box";

            const s1 = new SphereNode(doc, new XYZ(60, 0, 0), 18);
            s1.name = "Sphere";

            const cy1 = new CylinderNode(doc, XYZ.unitZ, new XYZ(100, 0, 0), 12, 30);
            cy1.name = "Cylinder";

            const co1 = new ConeNode(doc, XYZ.unitZ, new XYZ(140, 0, 0), 14, 35);
            co1.name = "Cone";

            const py1 = new PyramidNode(
                doc,
                new Plane(new XYZ(180, 0, 0), XYZ.unitZ, XYZ.unitX),
                30,
                30,
                40,
            );
            py1.name = "Pyramid";

            g3d.add(b1, s1, cy1, co1, py1);

            const sf = doc.application.shapeFactory;
            const eLine = safeValue(sf.line({ x: 0, y: 0, z: 0 }, { x: 40, y: 0, z: 0 }));
            const eArc = safeValue(sf.arc(XYZ.unitZ, new XYZ(20, 20, 0), new XYZ(40, 20, 0), 180));
            const eCircle = safeValue(sf.circle(XYZ.unitZ, new XYZ(20, 60, 0), 15));
            const wPath = eLine ? safeValue(sf.wire([eLine])) : undefined;
            const wProfile = eCircle ? safeValue(sf.wire([eCircle])) : undefined;
            const faceRect = safeValue(sf.rect(Plane.XY, 20, 20));
            const solidBox = safeValue(
                sf.box(new Plane(new XYZ(0, 0, 0), XYZ.unitZ, XYZ.unitX), 15, 15, 15),
            );
            const solidSphere = safeValue(sf.sphere(new XYZ(8, 8, 8), 10));

            if (eLine && eArc) {
                const wn = new WireNode(doc, [eLine, eArc]);
                wn.name = "Wire (edges)";
                gShape.add(wn);
            }

            if (eLine && eArc && eCircle) {
                const fn = new FaceNode(doc, [eLine, eArc, eCircle]);
                fn.name = "Face (edges/wires)";
                gShape.add(fn);
            }

            if (faceRect) {
                const pn = new PrismNode(doc, faceRect, 25);
                pn.name = "Prism (profile shape)";
                gShape.add(pn);

                const rn = new RevolvedNode(doc, faceRect, new Ray(new XYZ(0, 0, 0), new XYZ(0, 0, 1)), 270);
                rn.name = "Revolve (profile + axis)";
                gShape.add(rn);
            }

            if (wProfile && wPath) {
                const sn = new SweepedNode(doc, [wProfile], wPath, false);
                sn.name = "Sweep (profile + path)";
                gShape.add(sn);
            }

            const loftEdge1 = safeValue(sf.circle(XYZ.unitZ, new XYZ(20, 120, 0), 14));
            const loftEdge2 = safeValue(sf.circle(XYZ.unitZ, new XYZ(20, 120, 30), 6));
            if (loftEdge1 && loftEdge2) {
                const loftShape = sf.loft([loftEdge1, loftEdge2], true, false, Continuity.C0);
                loftEdge1.dispose();
                loftEdge2.dispose();
                if (loftShape.isOk) {
                    const ln = new EditableShapeNode(
                        doc,
                        "Loft (sections)",
                        loftShape,
                        doc.materials.at(1)?.id,
                    );
                    gShape.add(ln);
                }
            }

            if (solidBox && solidSphere) {
                const fn = new FuseNode(doc, solidBox, solidSphere);
                fn.name = "Fuse (two shapes)";
                gShape.add(fn);

                const bn = new BooleanNode(
                    doc,
                    safeValue(sf.booleanCut([solidBox], [solidSphere])) ?? solidBox,
                );
                bn.name = "Boolean (shape payload)";
                gShape.add(bn);
            }

            if (solidBox && solidSphere) {
                const mn = new MultiShapeNode(
                    doc,
                    "MultiShape",
                    [solidBox, solidSphere],
                    doc.materials.at(0)?.id,
                );
                mn.transform = Matrix4.fromTranslation(220, 0, 0);
                gExtra.add(mn);

                const en = new EditableShapeNode(doc, "EditableShape", solidBox, doc.materials.at(1)?.id);
                en.transform = Matrix4.fromTranslation(260, 0, 0);
                gExtra.add(en);
            }

            const mesh = Mesh.createLineSegments(2);
            mesh.position?.set([0, 0, 0, 0, 30, 0]);
            const meshNode = new MeshNode(doc, mesh, "Mesh (linesegments)", doc.materials.at(0)?.id);
            meshNode.transform = Matrix4.fromTranslation(220, 60, 0);
            gExtra.add(meshNode);

            const cb = new BoxNode(doc, Plane.XY, 15, 15, 15);
            cb.transform = Matrix4.fromTranslation(-10, -10, 0);
            const cc = new CircleNode(doc, XYZ.unitZ, new XYZ(0, 0, 0), 8);
            cc.isFace = true;
            const comp = new Component("ComponentDef", [cb, cc], XYZ.zero);
            doc.components.push(comp);

            const ci = new ComponentNode(doc, "ComponentInstance", comp.id, new XYZ(240, 120, 0));
            ci.transform = Matrix4.fromTranslation(240, 120, 0);
            gExtra.add(ci);
        } finally {
            doc.history.disabled = false;
        }

        return doc.serialize();
    };

    const loadSampleDocumentAll = async () => {
        if (!appRef) return;
        try {
            const payload = await generateAllPrimitivesSerialized();
            if (!payload) return;
            documentJson.value = JSON.stringify(payload, null, 2);
            const doc = await appRef.loadDocument(payload);
            if (!doc) {
                pushLog("error", "loadSampleDocumentAll failed");
                return;
            }
            setActiveDocument(doc);
            pushLog("action", "loadSampleDocumentAll", { id: doc.id, name: doc.name });
        } catch (error) {
            pushLog("error", "loadSampleDocumentAll failed", { error: String(error) });
        }
    };

    const applyPatchEnvelope = (envelope) => {
        if (!adapterRef || !documentRef || !envelope) return;
        patchJson.value = JSON.stringify(envelope, null, 2);
        adapterRef.applyPatchEnvelope(envelope);
        documentRef.visual.update();
        refreshSelectionSnapshot();
        pushLog("action", "applyPatch", { mutationId: envelope.mutationId });
    };

    const applyPatch = () => {
        let envelope;
        if (patchJson.value?.trim()) {
            try {
                envelope = JSON.parse(patchJson.value);
            } catch (error) {
                pushLog("error", "applyPatch parse failed", { error: String(error) });
                return;
            }
        } else {
            if (!documentRef) return;
            envelope = {
                documentId: documentRef.id,
                source: "host",
                mutationId: `host-${Date.now()}`,
                patches: [],
                ts: Date.now(),
            };
        }
        applyPatchEnvelope(envelope);
    };

    const patchAdd = () => {
        if (!documentRef) return;
        const root = documentRef.rootNode;
        if (!root) return;

        const offset = 30 + Math.floor(Math.random() * 60);
        const suffix = Math.random().toString(16).slice(2, 6);

        if (documentRef.mode === "2d") {
            const node = new RectNode(documentRef, Plane.XY, 40, 20);
            node.name = `New Rect ${suffix}`;
            node.transform = Matrix4.fromTranslation(offset, offset, 0);
            root.add(node);
            documentRef.selection.setSelection([node], false);
            selectionIds.value = node.id;
            refreshSelectionSnapshot();
            documentRef.visual.update();
            pushLog("action", "patchAdd", { id: node.id, type: "RectNode" });
            return;
        }

        const node = new BoxNode(documentRef, Plane.XY, 20, 20, 20);
        node.name = `New Box ${suffix}`;
        node.transform = Matrix4.fromTranslation(offset, offset, 0);
        root.add(node);
        documentRef.selection.setSelection([node], false);
        selectionIds.value = node.id;
        refreshSelectionSnapshot();
        documentRef.visual.update();
        pushLog("action", "patchAdd", { id: node.id, type: "BoxNode" });
    };

    const patchDelete = () => {
        if (!documentRef || !adapterRef) return;
        const selected = documentRef.selection.getSelectedNodes();
        if (selected.length === 0) return;
        const ids = selected.map((n) => n.id);
        const envelope = {
            documentId: documentRef.id,
            source: "host",
            mutationId: `host-remove-${Date.now()}`,
            ts: Date.now(),
            patches: [{ op: "remove", ids }],
        };
        applyPatchEnvelope(envelope);
        documentRef.selection.clearSelection();
        selectionIds.value = "";
        refreshSelectionSnapshot();
    };

    const getSelection = () => {
        if (!documentRef) return;
        selectionIds.value = documentRef.selection
            .getSelectedNodes()
            .map((n) => n.id)
            .join(",");
        refreshSelectionSnapshot();
        pushLog("action", "getSelection", { ids: selectionIds.value });
    };

    const setSelection = () => {
        if (!documentRef) return;
        const ids = selectionIds.value
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);
        const nodes = ids
            .map((id) => findNodeById(documentRef.rootNode, id))
            .filter((node) => node !== undefined);
        documentRef.selection.setSelection(nodes, false);
        refreshSelectionSnapshot();
        pushLog("action", "setSelection", { ids });
    };

    const clearSelection = () => {
        if (!documentRef) return;
        documentRef.selection.clearSelection();
        selectionIds.value = "";
        refreshSelectionSnapshot();
        pushLog("action", "clearSelection");
    };

    const triggerCommand = () => {
        if (!commandKey.value) return;
        PubSub.default.pub("executeCommand", commandKey.value);
        pushLog("action", "executeCommand", { command: commandKey.value });
    };

    const executeCommand = (key) => {
        if (!key) return;
        PubSub.default.pub("executeCommand", key);
        pushLog("action", "executeCommand", { command: key });
    };

    const fitView = () => {
        const view = appRef?.activeView;
        view?.cameraController.fitContent();
        pushLog("action", "fitView");
    };

    const exportSelected = async () => {
        if (!appRef || !documentRef) return;
        const selected = documentRef.selection.getSelectedNodes();
        const visualNodes = selected.filter((node) => node instanceof VisualNode);
        const type = exportFormat.value;
        try {
            const content =
                typeof type === "string" && type.startsWith(".dxf")
                    ? exportDxfEdges(documentRef, visualNodes)
                    : await appRef.dataExchange.export(type, visualNodes);
            if (!content) {
                pushLog("warn", "export skipped", { type, selected: visualNodes.length });
                return;
            }
            const extension = typeof type === "string" ? type.split(" ")[0] : ".bin";
            const fileName = `export-${new Date().toISOString().replaceAll(":", "-")}${extension}`;
            download(content, fileName);
            pushLog("action", "export", { type, fileName });
        } catch (error) {
            pushLog("error", "export failed", { error: String(error), type });
        }
    };

    const setMode = () => {
        if (!documentRef) return;
        const service = getEditorService();
        if (!service) {
            pushLog("warn", "EditorService not found");
            return;
        }

        const mode = viewMode.value === "view" ? "view" : "edit";
        if (mode === "view") {
            if (editorServiceActive) {
                service.stop?.();
                editorServiceActive = false;
            }
            documentRef.visual.resetEventHandler();
            pushLog("action", "setMode", { mode });
            return;
        }

        if (!editorServiceActive) {
            service.start?.();
            editorServiceActive = true;
        }
        const selected = documentRef.selection.getSelectedNodes();
        if (selected.length > 0) {
            documentRef.selection.setSelection(selected, false);
        }
        pushLog("action", "setMode", { mode });
    };

    return {
        isReady,
        statusItems,
        logs,
        documentJson,
        patchJson,
        selectionIds,
        selectedNodeSnapshot,
        layerOptions,
        materialOptions,
        commandKey,
        newDocumentName,
        newDocumentMode,
        viewMode,
        exportFormat,
        exportFormats,
        init,
        createDocument,
        dumpDocument,
        loadDocument,
        loadSampleDocument2d,
        loadSampleDocument3d,
        loadSampleDocumentAll,
        applyPatch,
        applyPatchEnvelope,
        patchAdd,
        patchDelete,
        getSelection,
        setSelection,
        clearSelection,
        triggerCommand,
        executeCommand,
        fitView,
        exportSelected,
        setMode,
    };
}

function findNodeById(node, id) {
    if (!node) return undefined;
    if (node.id === id) return node;
    if (INode.isLinkedListNode(node)) {
        let child = node.firstChild;
        while (child) {
            const found = findNodeById(child, id);
            if (found) return found;
            child = child.nextSibling;
        }
    }
    return undefined;
}

function exportDxfEdges(document, nodes) {
    const layerNameById = new Map(document.layers.map((layer) => [layer.id, layer.name]));
    const segments = [];
    for (const node of nodes) {
        let edges;
        try {
            edges = node.mesh?.edges;
        } catch {
            edges = undefined;
        }
        if (!edges?.position || edges.position.length < 6) continue;

        const layerName = layerNameById.get(node.layerId) ?? "0";
        const points = node.worldTransform().ofPoints(edges.position);
        for (let i = 0; i + 5 < points.length; i += 6) {
            segments.push({
                layer: layerName,
                start: [points[i], points[i + 1], points[i + 2]],
                end: [points[i + 3], points[i + 4], points[i + 5]],
            });
        }
    }

    if (segments.length === 0) return undefined;
    return [buildDxfR12(segments)];
}

function buildDxfR12(segments) {
    const lines = [];
    const pushPair = (code, value) => {
        lines.push(String(code), String(value));
    };
    const formatNumber = (value) => {
        if (!Number.isFinite(value)) return "0";
        const fixed = value.toFixed(6);
        const trimmed = fixed.replace(/\.?0+$/, "");
        return trimmed === "-0" ? "0" : trimmed;
    };

    pushPair(0, "SECTION");
    pushPair(2, "HEADER");
    pushPair(9, "$ACADVER");
    pushPair(1, "AC1009");
    pushPair(0, "ENDSEC");

    pushPair(0, "SECTION");
    pushPair(2, "ENTITIES");

    for (const seg of segments) {
        pushPair(0, "LINE");
        pushPair(8, seg.layer ?? "0");
        pushPair(10, formatNumber(seg.start[0]));
        pushPair(20, formatNumber(seg.start[1]));
        pushPair(30, formatNumber(seg.start[2]));
        pushPair(11, formatNumber(seg.end[0]));
        pushPair(21, formatNumber(seg.end[1]));
        pushPair(31, formatNumber(seg.end[2]));
    }

    pushPair(0, "ENDSEC");
    pushPair(0, "EOF");
    return lines.join("\n") + "\n";
}
