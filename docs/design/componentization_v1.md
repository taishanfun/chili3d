# Chili3D 组件化详细设计规格书 v1.0

基于“1 C、2 Level A、3 稳定 DTO、4 双向同步、5 全类型、6 View/Edit 运行时切换”的落地规格。

## 一、交付形态：Core SDK + Web Component

核心原则：**一个内核，两层适配**。

### 1.1 Core SDK (Framework Agnostic)

- **职责**：提供核心图形能力、数据管理、工具链、导入导出，不依赖特定 UI 框架。
- **特性**：
    - 支持多实例
    - 类型化 API
    - 独立上下文（Document/History/EventBus）

#### 1.1.1 多实例（Multi-Instance）定义与隔离边界

多实例指：在同一宿主（同一浏览器页面/同一 window）中创建多个 Chili3D 应用实例，并分别承载独立的文档与交互。

隔离目标（每个实例独立）：

- Document / History / Selection / View
- Services（CommandService、EditorService、HotkeyService 等以实例为单位）
- EventBus（`PubSub.default` 以 Application 作用域分发事件）

共享或需要特别注意的点（同一 window 下天然共享）：

- `localStorage`（例如 `ObjectStorage.default` 的 key 前缀相同，属于跨实例共享）
- `document.documentElement` 上的全局属性（例如 theme attribute）
- 运行时资源缓存（WASM/模块加载缓存属于页面级共享）

集成建议：

- 需要“强隔离”时，优先使用 iframe（物理隔离 window/global、CSS、事件）。
- 需要“同页多实例（同 DOM）”时，必须保证每个实例有独立 UI Root 容器，并通过“当前实例激活（focus/interaction）”机制把无上下文事件（如 `executeCommand`）路由到正确实例。

### 1.2 Web Component (`<chili3d-editor>`)

- **职责**：作为 SDK 的外壳，适配 HTML 标准属性与事件。
- **桥接**：
    - Attributes/Properties -> SDK Methods
    - SDK Events -> CustomEvents

## 二、对外能力边界

### 2.1 必选能力

- 全量渲染与局部增量更新渲染
- 图元几何属性编辑
- 业务属性编辑（强类型）
- DXF 导出
- View/Edit 运行时切换

### 2.2 不在 v1 覆盖的能力

- 多人实时协同编辑
- 外部依赖的 CAD 标注样式管理（高级样式）
- 复杂装配级约束求解

## 三、稳定 DTO 定义 (External Protocol)

目标：宿主仅依赖 DTO 协议，不依赖内部 Node 类结构。

### 3.1 Document DTO

```typescript
export interface ChiliDocumentDTO {
    schemaVersion: "1.0";
    documentId: string;
    units: "mm" | "cm" | "m" | "inch";
    meta?: Record<string, unknown>;
    layers: LayerDTO[];
    blocks?: BlockDTO[];
    entities: EntityDTO[];
    view?: {
        camera?: unknown;
        workplane?: unknown;
    };
}
```

### 3.2 Entity DTO (Discriminated Union)

```typescript
export type EntityDTO =
    | LineDTO
    | CircleDTO
    | BoxDTO
    | SphereDTO
    | CylinderDTO
    | ConeDTO
    | RectDTO
    | EllipseDTO
    | GroupDTO
    | GeometryNodeDTO;

export interface EntityBase {
    id: string;
    type: string;
    layerId?: string;
    visible?: boolean;
    transform?: number[];
    nativeProps?: Record<string, unknown>;
    bizProps?: BizPropsDTO;
    rev: number;
}
```

### 3.3 业务属性 (BizPropsDTO)

```typescript
export type BizValue =
    | { t: "string"; v: string }
    | { t: "number"; v: number }
    | { t: "boolean"; v: boolean }
    | { t: "object"; v: any };

export interface BizPropsDTO {
    ns?: string;
    values: Record<string, BizValue>;
}
```

## 四、Patch 协议 (Level A 增量更新)

### 4.1 Patch Envelope

```typescript
export interface PatchEnvelope {
    documentId: string;
    source: "host" | "editor";
    mutationId: string;
    baseDocumentRev?: number;
    patches: PatchOp[];
    ts?: number;
}
```

### 4.2 Patch Operations

```typescript
export type PatchOp =
    | { op: "add"; entities: EntityDTO[] }
    | { op: "remove"; ids: string[] }
    | { op: "replace"; entity: EntityDTO }
    | { op: "update"; id: string; rev: number; set?: Record<string, unknown>; unset?: string[] }
    | {
          op: "updateVisual";
          id: string;
          rev: number;
          set?: Partial<VisualNodeDTO & GeometryNodeDTO>;
          unset?: string[];
      }
    | {
          op: "updateGeom";
          id: string;
          rev: number;
          set?: Partial<EntityDTO & VisualNodeDTO & GeometryNodeDTO>;
          unset?: string[];
      }
    | { op: "updateBiz"; id: string; rev: number; values: Record<string, BizValue> }
    | { op: "batch"; label?: string; ops: PatchOp[] };
```

约定说明：

- `update`：通用更新（兼容旧用法）；`set/unset` 采用“弱约束”的 key/value 形式
- `updateVisual`：专用于可见/材质/变换等 VisualNode 级别属性（更易读、更强约束）
- `updateGeom`：专用于图元几何参数（例如 line.start/end、circle.radius、box.dx/dy/dz 等）
- `updateBiz`：专用于业务属性（biz.\*），只对 VisualNode 生效

## 五、双向同步与冲突策略

### 5.1 回声抑制

- 变更携带 `mutationId`。
- SDK 收到 `applyPatch` 时，若 `mutationId` 匹配最近发出的变更，则忽略（ACK）。

### 5.2 冲突检测

- 依赖 `rev` 字段。
- `update` 操作携带 `rev`（期望的旧版本或新版本，具体实现为 Optimistic Concurrency Control）。
- 若内部 `rev` > 传入 `rev`，触发 `conflict` 事件。

### 5.3 冲突解决

- **BizProps**: 默认按 Key Merge。
- **Geometry/Native**: 默认 Last-Write-Wins + `conflict` 事件通知。

## 六、View/Edit 模式切换

### 6.1 模式定义

- `view`: 只读。允许选择、缩放、查看属性，但禁止 Tool 操作、禁止属性变更。
- `edit`: 全功能。

### 6.2 切换机制

- SDK: `setMode(mode: "view" | "edit", opts?)`
- 行为：
    - 切换到 `view`：中止当前 Tool，锁定 Property Grid。
    - 切换到 `edit`：恢复 Tool 能力，解锁 Property Grid。
    - 状态保持：Selection 默认保持。

## 七、DXF 导出 (Full Type Coverage)

### 7.1 范围定义

- 覆盖所有 EntityDTO 定义的类型。
- 覆盖编辑器内部支持的所有 GeometryNode 子类。

### 7.2 导出 API

```typescript
exportDxf(options?: {
    scope?: "all" | "selection";
    version?: "R12" | "R2000" | "R2013";
    precision?: number;
    units?: "mm" | "cm" | "m" | "inch";
}): Promise<Blob | string>
```

### 7.3 架构

```typescript
type DxfWriter = (entity: EntityDTO, ctx: DxfContext) => void;
type DxfExporterRegistry = Map<string, DxfWriter>;
```

### 7.4 验收口径

- DTO 定义的每一种 EntityDTO type 都有可导出样例
- 目标软件可正确打开（LibreCAD/AutoCAD）
- 几何外观与关键属性正确（位置、尺寸、层、线型、颜色）

## 八、对外 API 与事件

本章接口定义为“目标形态”（DTO 协议）。当前仓库的可用调用方式与数据协议差异，见 9.1。

```typescript
interface Chili3D {
    load(dto: ChiliDocumentDTO): Promise<void>;
    dump(): ChiliDocumentDTO;
    applyPatch(envelope: PatchEnvelope): void;
    setMode(mode: "view" | "edit", opts?: { preserveSelection?: boolean }): void;
    getSelection(): string[];
    setSelection(ids: string[]): void;
    exportDxf(options?: ExportDxfOptions): Promise<Blob | string>;
    on(event: string, handler: (payload: any) => void): () => void;
    dispose(): void;
}
```

当前仓库对照（使用人员最常用的 3 个入口）：

- load/dump：使用 `Serialized`（`app.loadDocument(serialized)` / `document.serialize()`）
- applyPatch：使用 `PatchEnvelope`（DTO 协议，可直接用于 `NodeAdapter.applyPatchEnvelope(envelope)`）

### 8.1 SDK 事件清单

- ready
- selectionChanged({ ids })
- patchEmitted({ envelope })
- entityChanged({ ids, fields })
- modeChanged({ mode })
- historyChanged({ canUndo, canRedo })
- conflict({ id, reason, localRev, incomingRev, incomingMutationId })
- error({ message, detail })

### 8.2 WebComponent 事件映射

- chili3d:ready
- chili3d:patch
- chili3d:selection-changed
- chili3d:entity-changed
- chili3d:mode-changed
- chili3d:history-changed
- chili3d:conflict
- chili3d:error

### 8.3 变更通知（当前仓库可直接使用）

当用户在编辑器里修改图元/属性时，宿主通常希望收到一个“可解析、可节流、可批量”的通知流。当前仓库已提供可直接集成的通知服务：

- 代码入口：`packages/chili-core/src/foundation/hostNotification.ts`
- 核心类：`Chili3DNotificationService`
- 传输通道（可组合）：`CustomEventTransport`、`PostMessageTransport`

#### 8.3.1 消息协议（JSON）

所有消息都满足以下通用字段：

```ts
type Base = {
    protocol: "chili3d";
    version: 1;
    eventType: string;
    timestamp: number;
    documentId: string;
};
```

事件类型（常用）：

- `selectionChanged`：`{ ids: string[] }`
- `propertyChanged`：`{ entityId, propertyName, oldValue, newValue }`
- `nodeChanged`：`{ action, entityId, oldParentId?, oldPreviousId?, newParentId?, newPreviousId? }`
- `batch`：`{ events: Message[] }`（高频场景下会合并输出）

#### 8.3.2 宿主监听示例

CustomEvent（同页面集成场景）：

```ts
window.addEventListener("chili3d:notify", (e: any) => {
    const msg = e.detail;
    if (msg?.protocol !== "chili3d") return;
    console.log("chili3d notify:", msg.eventType, msg);
});
```

postMessage（iframe 集成场景）：

```ts
window.addEventListener("message", (ev) => {
    const msg = ev.data;
    if (msg?.protocol !== "chili3d") return;
    console.log("chili3d postMessage:", msg.eventType, msg);
});
```

#### 8.3.3 suzhu 集成说明

suzhu 已在 `setActiveDocument` 时创建 `Chili3DNotificationService`，并默认：

- 触发 `window` 上的 `chili3d:notify` CustomEvent
- 若运行在 iframe 内，额外向 `window.parent` 发送 postMessage

实现见：[useChiliApp.js](file:///f:/person/githup/chili3d/suzhu/src/composables/useChiliApp.js)

### 8.4 页面元素显隐（UI Visibility）

同一宿主在不同页面/路由嵌入 Chili3D 时，经常需要“显示不同的界面组件”（例如：是否显示 ribbon 功能区、是否显示侧边栏、是否只保留画布）。

本能力属于“外壳层（Host / Web Component Wrapper）”职责，不属于 Core SDK（Core 仍保持 framework agnostic）。要求如下：

- **可配置**：通过运行时配置改变显示/隐藏，无需改代码
- **可扩展**：后续可新增更多可控 UI 元素
- **无空白**：隐藏后布局自动回收（不保留占位）

#### 8.4.1 配置模型（建议）

```ts
type UiVisibilityConfig = {
    sidebar?: { visible?: boolean };
    ribbon?: { visible?: boolean };
    profiles?: Record<string, UiVisibilityConfig>;
};
```

- 默认值：`sidebar.visible = true`、`ribbon.visible = true`
- `profiles`：为“页面/场景”提供预设配置片段（例如 `embed-minimal`、`embed-no-sidebar`）

#### 8.4.2 配置来源与优先级（建议）

配置可按集成环境选择其一或组合使用：

- 配置文件（运行时生效）：例如 `/ui-config.json`
- Web Component attributes/properties：例如 `ui-profile` / `ui-config-url` / `sidebar-visible` / `ribbon-visible`
- URL 参数：用于同一宿主不同页面快速覆盖（例如 `?uiProfile=embed-minimal&ui.sidebar=false`）
- 环境变量：用于按构建环境（dev/staging/prod）切换默认策略

优先级建议（从低到高）：

默认值 < 配置文件根配置 < profile < 环境变量 < URL/属性覆盖

#### 8.4.3 suzhu 示例（当前仓库已实现）

suzhu 示例实现了基于运行时配置的显隐控制：

- 配置文件：`suzhu/public/ui-config.json`
- 配置加载：`suzhu/src/uiConfig.js`（支持 `uiProfile`、`uiConfigUrl`、`ui.sidebar`、`ui.ribbon` 等 URL 覆盖）
- 渲染控制：`suzhu/src/App.vue`（控制侧边栏）、`suzhu/src/components/ChiliFrame.vue`（控制 header）

### 8.5 多实例（Multi-Instance）

本节记录“同一宿主嵌入多个 Chili3D 组件实例”的支持范围、典型方案与已落地实现点。

#### 8.5.1 两种集成形态

1. 多 iframe（推荐，强隔离）

- 每个实例运行在独立 window 中，天然隔离全局事件、样式与热键。
- 宿主与实例的通信使用 `postMessage` 或 `CustomEvent` 转发。

2. 同页多实例（同 DOM）

- 多个实例共享同一 window，需要主动处理全局单例与事件路由问题。
- 要求每个实例有独立 UI Root（例如 `#appA/#appB`）以挂载 `chili3d-main-window`。

#### 8.5.2 已落地的隔离策略（当前仓库）

- EventBus：`PubSub.default` 按 Application 作用域进行订阅/发布分发，避免跨实例串线（若事件携带 `document/view` 参数，会路由到对应实例）。
- Current Application：通过在 UI 交互（pointerdown/focusin/keydown）时激活当前实例，保证无上下文事件（例如 `executeCommand`）也能路由到正确实例。
- Hotkey：热键监听从 `window` 收敛到 `app.mainWindow`，降低多实例争抢键盘事件的概率。

#### 8.5.3 suzhu 示例入口

suzhu 提供了两种多实例演示入口（便于对照）：

- 多 iframe：`/?hostMode=multi`（同一页面嵌入两个 iframe）
- 同页多实例（同 DOM）：`/?hostMode=multi-dom`（同一页面创建两个 Chili3D 实例并分别挂载到不同容器）

## 九、对外 API 详细说明（面向使用人员）

本章节给出“对外 API / 对外事件”的可操作说明，并说明与当前仓库实现的对应关系，便于集成与测试。

### 9.1 两套数据协议：DTO vs Serialized（现状说明）

Chili3D 当前仓库里同时存在两套“对外数据形态”：

1. 稳定 DTO（目标协议）

- 定义位置：`packages/chili-core/src/foundation/dto/node.ts`
- 典型用途：Patch 增量（`PatchEnvelope/PatchOp`）与业务属性（`BizPropsDTO`）同步

2. Serialized（当前可用的文档 load/dump 格式）

- 定义位置：`packages/chili-core/src/serialize/serializer.ts`（`Serialized`）
- 典型用途：`document.serialize()` 与 `app.loadDocument(serialized)` 的全量保存/加载

重要结论：

- “load/dump”在当前仓库实现中，使用的是 `Serialized`，不是 `ChiliDocumentDTO`
- “applyPatch”在当前仓库实现中，可直接使用 `PatchEnvelope`（DTO 协议）
- 注意：当前 `Document.serialize()` 的实际返回结构包含 `version` 字段（见 `packages/chili/src/document.ts`），但 `chili-core` 的 `Serialized` 类型定义未包含该字段，使用时以运行时数据为准。

### 9.2 Core SDK（宿主侧）推荐使用方式

宿主侧建议用 `AppBuilder` 构建应用并挂载 UI：

- `new AppBuilder().useIndexedDB().useWasmOcc().useThree().useUI().build()`
- `useUI(dom?: HTMLElement | string)`：不传入参数时挂载到 `#app`；传入时可挂载到指定容器（用于同页多实例）
- `useUI()` 会创建 `chili3d-main-window` 并把 UI 插入到目标容器

### 9.3 Chili3D 对外 API（详细行为）

> 下述接口是“目标形态”，并在每一项后标注“当前仓库可用的等价调用”。

#### 9.3.1 load(dto)

- 目的：用宿主提供的“全量数据”替换当前编辑器内容并渲染
- 输入（目标形态）：`ChiliDocumentDTO`
- 输入（当前仓库可用）：`Serialized`
- 输出：Promise<void>
- 错误：
    - schemaVersion 不支持
    - entities/layers 不合法
- 当前仓库等价调用：
    - `app.loadDocument(serialized)`（注意这里是 `Serialized`）
    - 在 suzhu 测试工具里：Document 面板的 Load 按钮

##### 9.3.1.1 当前仓库 `Serialized`（load/dump 实际格式）

`app.loadDocument(serialized)` 的输入数据来自 `Document.serialize()`（实现见 [document.ts](file:///f:/person/githup/chili3d/packages/chili/src/document.ts#L173-L189)），结构要点如下：

- 顶层必须是 `{ classKey: "Document", version: "0.6", properties: {...} }`
- `version` 必须等于当前运行时的 `__DOCUMENT_VERSION__`（根仓库 `package.json` 的 `documentVersion`，当前为 `0.6`）
- `properties.nodes` 是一个数组（`NodeSerializer.serialize(rootNode)` 的输出），每一项都是 `{ classKey, properties, parentId? }`
    - `parentId` 用来表示树结构（父节点必须先于子节点出现）
    - 只有 `FolderNode/GroupNode` 这类“可挂子节点”的 LinkedListNode 才能作为父节点

##### 9.3.1.2 load 输入样例（多图元覆盖）

下面提供两份 JSON，可直接复制到 suzhu 的 Document 文本框后点击 `Load`：

- 2D 版本：`properties.mode = "2d"`，只包含 2D 图元
- 3D 版本：`properties.mode = "3d"`，只包含 3D 图元

更推荐的方式（无需手写 JSON）：

- 直接在 suzhu 控制台点击 `Load Sample (2D)` / `Load Sample (3D)` / `Load Sample (All)`，再用 `Dump` 导出一份可编辑的基准数据

###### 9.3.1.2.1 load 输入样例（2D）

```json
{
    "classKey": "Document",
    "version": "0.6",
    "properties": {
        "id": "Q4i3_JUBJaP6gy2BTbILY",
        "name": "Embedded Demo (2D)",
        "mode": "2d",
        "currentLayerId": "layer-1",
        "components": [],
        "nodes": [
            {
                "classKey": "FolderNode",
                "properties": {
                    "id": "WAj9pF1pPg3C15OuJQ9N3",
                    "name": "Embedded Demo",
                    "rev": 0,
                    "customProperties": "{}",
                    "customPropertyTypes": "{}",
                    "visible": true
                }
            },
            {
                "classKey": "GroupNode",
                "parentId": "WAj9pF1pPg3C15OuJQ9N3",
                "properties": {
                    "id": "G-2D",
                    "name": "2D Primitives",
                    "rev": 0,
                    "customProperties": "{}",
                    "customPropertyTypes": "{}",
                    "visible": true,
                    "transform": {
                        "classKey": "Matrix4",
                        "properties": { "array": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] }
                    }
                }
            },
            {
                "classKey": "LineNode",
                "parentId": "G-2D",
                "properties": {
                    "id": "L-1",
                    "name": "Line",
                    "start": { "classKey": "XYZ", "properties": { "x": 0, "y": 0, "z": 0 } },
                    "end": { "classKey": "XYZ", "properties": { "x": 80, "y": 0, "z": 0 } },
                    "visible": true,
                    "customProperties": "{\"bizKey\":\"line-1\"}",
                    "customPropertyTypes": "{\"bizKey\":\"string\"}"
                }
            },
            {
                "classKey": "CircleNode",
                "parentId": "G-2D",
                "properties": {
                    "id": "C-1",
                    "name": "Circle",
                    "normal": { "classKey": "XYZ", "properties": { "x": 0, "y": 0, "z": 1 } },
                    "center": { "classKey": "XYZ", "properties": { "x": 40, "y": 40, "z": 0 } },
                    "radius": 20,
                    "isFace": false,
                    "visible": true
                }
            },
            {
                "classKey": "EllipseNode",
                "parentId": "G-2D",
                "properties": {
                    "id": "E-1",
                    "name": "Ellipse",
                    "normal": { "classKey": "XYZ", "properties": { "x": 0, "y": 0, "z": 1 } },
                    "center": { "classKey": "XYZ", "properties": { "x": 110, "y": 40, "z": 0 } },
                    "xvec": { "classKey": "XYZ", "properties": { "x": 1, "y": 0, "z": 0 } },
                    "majorRadius": 30,
                    "minorRadius": 15,
                    "isFace": false,
                    "visible": true
                }
            },
            {
                "classKey": "PolygonNode",
                "parentId": "G-2D",
                "properties": {
                    "id": "P-1",
                    "name": "Polygon",
                    "points": [
                        { "classKey": "XYZ", "properties": { "x": 0, "y": 90, "z": 0 } },
                        { "classKey": "XYZ", "properties": { "x": 40, "y": 120, "z": 0 } },
                        { "classKey": "XYZ", "properties": { "x": 90, "y": 95, "z": 0 } },
                        { "classKey": "XYZ", "properties": { "x": 70, "y": 70, "z": 0 } },
                        { "classKey": "XYZ", "properties": { "x": 0, "y": 90, "z": 0 } }
                    ],
                    "isFace": false,
                    "visible": true
                }
            },
            {
                "classKey": "RectNode",
                "parentId": "G-2D",
                "properties": {
                    "id": "R-1",
                    "name": "Rect",
                    "plane": {
                        "classKey": "Plane",
                        "properties": {
                            "origin": { "classKey": "XYZ", "properties": { "x": 110, "y": 80, "z": 0 } },
                            "normal": { "classKey": "XYZ", "properties": { "x": 0, "y": 0, "z": 1 } },
                            "xvec": { "classKey": "XYZ", "properties": { "x": 1, "y": 0, "z": 0 } }
                        }
                    },
                    "dx": 60,
                    "dy": 30,
                    "isFace": false,
                    "visible": true
                }
            },
            {
                "classKey": "TextNode",
                "parentId": "G-2D",
                "properties": {
                    "id": "T-1",
                    "name": "Text",
                    "text": "Hello Chili3D",
                    "height": 10,
                    "color": 16711680,
                    "horizontalAlign": "left",
                    "verticalAlign": "bottom",
                    "visible": true,
                    "transform": {
                        "classKey": "Matrix4",
                        "properties": { "array": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 140, 0, 1] }
                    }
                }
            },
            {
                "classKey": "MTextNode",
                "parentId": "G-2D",
                "properties": {
                    "id": "MT-1",
                    "name": "MText",
                    "text": "Line 1\\nLine 2\\nLine 3",
                    "height": 8,
                    "color": 255,
                    "lineSpacing": 1.2,
                    "lineColors": [255, 65280, 16711680],
                    "horizontalAlign": "left",
                    "verticalAlign": "top",
                    "visible": true,
                    "transform": {
                        "classKey": "Matrix4",
                        "properties": { "array": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 120, 140, 0, 1] }
                    }
                }
            },
            {
                "classKey": "LeaderNode",
                "parentId": "G-2D",
                "properties": {
                    "id": "LD-1",
                    "name": "Leader",
                    "points": [
                        { "classKey": "XYZ", "properties": { "x": 180, "y": 0, "z": 0 } },
                        { "classKey": "XYZ", "properties": { "x": 210, "y": 20, "z": 0 } },
                        { "classKey": "XYZ", "properties": { "x": 240, "y": 20, "z": 0 } }
                    ],
                    "text": "Leader note",
                    "height": 8,
                    "isAssociative": false,
                    "visible": true
                }
            },
            {
                "classKey": "DimensionNode",
                "parentId": "G-2D",
                "properties": {
                    "id": "DIM-1",
                    "name": "Horizontal Dimension",
                    "type": "horizontal",
                    "p1": { "classKey": "XYZ", "properties": { "x": 0, "y": 0, "z": 0 } },
                    "p2": { "classKey": "XYZ", "properties": { "x": 80, "y": 0, "z": 0 } },
                    "location": { "classKey": "XYZ", "properties": { "x": 40, "y": -20, "z": 0 } },
                    "planeOrigin": { "classKey": "XYZ", "properties": { "x": 0, "y": 0, "z": 0 } },
                    "planeX": { "classKey": "XYZ", "properties": { "x": 1, "y": 0, "z": 0 } },
                    "planeY": { "classKey": "XYZ", "properties": { "x": 0, "y": 1, "z": 0 } },
                    "planeNormal": { "classKey": "XYZ", "properties": { "x": 0, "y": 0, "z": 1 } },
                    "visible": true
                }
            }
        ],
        "layers": [
            {
                "classKey": "Layer",
                "properties": {
                    "id": "layer-1",
                    "name": "Layer 1",
                    "visible": true,
                    "locked": false,
                    "color": "#333333",
                    "lineType": 0
                }
            },
            {
                "classKey": "Layer",
                "properties": {
                    "id": "layer-2",
                    "name": "Layer 2",
                    "visible": true,
                    "locked": false,
                    "color": "#00AAFF",
                    "lineType": 0
                }
            },
            {
                "classKey": "Layer",
                "properties": {
                    "id": "layer-3",
                    "name": "Layer 3",
                    "visible": true,
                    "locked": false,
                    "color": "#FF8800",
                    "lineType": 1
                }
            }
        ],
        "materials": [
            {
                "classKey": "Material",
                "properties": {
                    "vertexColors": false,
                    "transparent": true,
                    "id": "UCgYJbreeThppW6j-cdgg",
                    "name": "LightGray",
                    "color": 14606046,
                    "opacity": 1,
                    "map": {
                        "classKey": "Texture",
                        "properties": {
                            "image": "",
                            "wrapS": 1000,
                            "wrapT": 1000,
                            "rotation": 0,
                            "offset": { "classKey": "XY", "properties": { "x": 0, "y": 0 } },
                            "repeat": { "classKey": "XY", "properties": { "x": 1, "y": 1 } },
                            "center": { "classKey": "XY", "properties": { "x": 0.5, "y": 0.5 } }
                        }
                    }
                }
            },
            {
                "classKey": "Material",
                "properties": {
                    "vertexColors": false,
                    "transparent": true,
                    "id": "s60w2Sm_6aJRczQHbzhED",
                    "name": "DeepGray",
                    "color": 9013641,
                    "opacity": 1,
                    "map": {
                        "classKey": "Texture",
                        "properties": {
                            "image": "",
                            "wrapS": 1000,
                            "wrapT": 1000,
                            "rotation": 0,
                            "offset": { "classKey": "XY", "properties": { "x": 0, "y": 0 } },
                            "repeat": { "classKey": "XY", "properties": { "x": 1, "y": 1 } },
                            "center": { "classKey": "XY", "properties": { "x": 0.5, "y": 0.5 } }
                        }
                    }
                }
            }
        ],
        "acts": []
    }
}
```

###### 9.3.1.2.2 load 输入样例（3D）

```json
{
    "classKey": "Document",
    "version": "0.6",
    "properties": {
        "id": "Q4i3_JUBJaP6gy2BTbILY",
        "name": "Embedded Demo (3D)",
        "mode": "3d",
        "currentLayerId": "layer-1",
        "components": [],
        "nodes": [
            {
                "classKey": "FolderNode",
                "properties": {
                    "id": "WAj9pF1pPg3C15OuJQ9N3",
                    "name": "Embedded Demo (3D)",
                    "rev": 0,
                    "customProperties": "{}",
                    "customPropertyTypes": "{}",
                    "visible": true
                }
            },
            {
                "classKey": "GroupNode",
                "parentId": "WAj9pF1pPg3C15OuJQ9N3",
                "properties": {
                    "id": "G-3D",
                    "name": "3D Solids",
                    "rev": 0,
                    "customProperties": "{}",
                    "customPropertyTypes": "{}",
                    "visible": true,
                    "transform": {
                        "classKey": "Matrix4",
                        "properties": { "array": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] }
                    }
                }
            },
            {
                "classKey": "BoxNode",
                "parentId": "G-3D",
                "properties": {
                    "id": "B-1",
                    "name": "Box",
                    "plane": {
                        "classKey": "Plane",
                        "properties": {
                            "origin": { "classKey": "XYZ", "properties": { "x": 0, "y": 0, "z": 0 } },
                            "normal": { "classKey": "XYZ", "properties": { "x": 0, "y": 0, "z": 1 } },
                            "xvec": { "classKey": "XYZ", "properties": { "x": 1, "y": 0, "z": 0 } }
                        }
                    },
                    "dx": 30,
                    "dy": 30,
                    "dz": 30,
                    "visible": true
                }
            },
            {
                "classKey": "SphereNode",
                "parentId": "G-3D",
                "properties": {
                    "id": "S-1",
                    "name": "Sphere",
                    "center": { "classKey": "XYZ", "properties": { "x": 60, "y": 0, "z": 0 } },
                    "radius": 18,
                    "visible": true
                }
            },
            {
                "classKey": "CylinderNode",
                "parentId": "G-3D",
                "properties": {
                    "id": "CY-1",
                    "name": "Cylinder",
                    "normal": { "classKey": "XYZ", "properties": { "x": 0, "y": 0, "z": 1 } },
                    "center": { "classKey": "XYZ", "properties": { "x": 100, "y": 0, "z": 0 } },
                    "radius": 12,
                    "dz": 30,
                    "visible": true
                }
            },
            {
                "classKey": "ConeNode",
                "parentId": "G-3D",
                "properties": {
                    "id": "CO-1",
                    "name": "Cone",
                    "normal": { "classKey": "XYZ", "properties": { "x": 0, "y": 0, "z": 1 } },
                    "center": { "classKey": "XYZ", "properties": { "x": 140, "y": 0, "z": 0 } },
                    "radius": 14,
                    "dz": 35,
                    "visible": true
                }
            },
            {
                "classKey": "PyramidNode",
                "parentId": "G-3D",
                "properties": {
                    "id": "PY-1",
                    "name": "Pyramid",
                    "plane": {
                        "classKey": "Plane",
                        "properties": {
                            "origin": { "classKey": "XYZ", "properties": { "x": 180, "y": 0, "z": 0 } },
                            "normal": { "classKey": "XYZ", "properties": { "x": 0, "y": 0, "z": 1 } },
                            "xvec": { "classKey": "XYZ", "properties": { "x": 1, "y": 0, "z": 0 } }
                        }
                    },
                    "dx": 30,
                    "dy": 30,
                    "dz": 40,
                    "visible": true
                }
            }
        ],
        "layers": [
            {
                "classKey": "Layer",
                "properties": {
                    "id": "layer-1",
                    "name": "Layer 1",
                    "visible": true,
                    "locked": false,
                    "color": "#333333",
                    "lineType": 0
                }
            },
            {
                "classKey": "Layer",
                "properties": {
                    "id": "layer-2",
                    "name": "Layer 2",
                    "visible": true,
                    "locked": false,
                    "color": "#00AAFF",
                    "lineType": 0
                }
            },
            {
                "classKey": "Layer",
                "properties": {
                    "id": "layer-3",
                    "name": "Layer 3",
                    "visible": true,
                    "locked": false,
                    "color": "#FF8800",
                    "lineType": 1
                }
            }
        ],
        "materials": [
            {
                "classKey": "Material",
                "properties": {
                    "vertexColors": false,
                    "transparent": true,
                    "id": "UCgYJbreeThppW6j-cdgg",
                    "name": "LightGray",
                    "color": 14606046,
                    "opacity": 1,
                    "map": {
                        "classKey": "Texture",
                        "properties": {
                            "image": "",
                            "wrapS": 1000,
                            "wrapT": 1000,
                            "rotation": 0,
                            "offset": { "classKey": "XY", "properties": { "x": 0, "y": 0 } },
                            "repeat": { "classKey": "XY", "properties": { "x": 1, "y": 1 } },
                            "center": { "classKey": "XY", "properties": { "x": 0.5, "y": 0.5 } }
                        }
                    }
                }
            },
            {
                "classKey": "Material",
                "properties": {
                    "vertexColors": false,
                    "transparent": true,
                    "id": "s60w2Sm_6aJRczQHbzhED",
                    "name": "DeepGray",
                    "color": 9013641,
                    "opacity": 1,
                    "map": {
                        "classKey": "Texture",
                        "properties": {
                            "image": "",
                            "wrapS": 1000,
                            "wrapT": 1000,
                            "rotation": 0,
                            "offset": { "classKey": "XY", "properties": { "x": 0, "y": 0 } },
                            "repeat": { "classKey": "XY", "properties": { "x": 1, "y": 1 } },
                            "center": { "classKey": "XY", "properties": { "x": 0.5, "y": 0.5 } }
                        }
                    }
                }
            }
        ],
        "acts": []
    }
}
```

#### 9.3.2 dump()

- 目的：获取当前文档的“全量数据快照”
- 输出（目标形态）：`ChiliDocumentDTO`
- 输出（当前仓库可用）：`Serialized`
- 当前仓库等价调用：
    - `document.serialize()`（返回 `Serialized`）
    - 在 suzhu 测试工具里：Document 面板的 Dump 按钮

#### 9.3.3 applyPatch(envelope)

- 目的：把增量变更应用到当前文档（局部更新/业务属性更新/删除等）
- 输入：`PatchEnvelope`
    - `documentId`：目标文档 id
    - `source`：来源（`host`/`editor`）
    - `mutationId`：变更标识，用于回声抑制（见 5.1）
    - `baseDocumentRev?`：可选的基准版本（用于并发控制/冲突检测，见 5.2）
    - `ts?`：可选时间戳
    - `patches`：`PatchOp[]`（每一项是一条增量操作，定义见 4.2）
- 当前仓库等价调用：
    - `new NodeAdapter(document).applyPatchEnvelope(envelope)`
    - 在 suzhu 测试工具里：Patch 面板的 Apply Patch 按钮
- 与下文示例的关系：
    - 9.5 给出的 JSON 就是 `PatchEnvelope` 的“可复制示例”
    - 把 9.5 的 JSON 粘贴到 suzhu 的 Patch 文本框，替换其中的 `<...>` 占位符后点击 Apply Patch，即在当前文档上执行对应的 `PatchOp`

#### 9.3.4 setMode(mode, opts?)

- 目的：在 view/edit 间切换运行时行为
- 输入：
    - `mode: "view" | "edit"`
    - `opts?.preserveSelection`：默认保持 Selection
- 行为建议：
    - view：禁止编辑 Tool、禁止属性修改、保持浏览/选择/缩放能力
    - edit：恢复编辑能力
- 当前仓库实现方式（suzhu）：
    - 通过启停 `EditorService` + `document.visual.resetEventHandler()` 达成“只读/可编辑”的行为差异

#### 9.3.5 getSelection()

- 输出：`string[]`（节点 id 列表）
- 当前仓库等价调用：
    - `document.selection.getSelectedNodes().map(n => n.id)`

#### 9.3.6 setSelection(ids)

- 输入：`string[]` 节点 id 列表
- 行为：更新当前选择，并触发 selectionChanged 事件
- 当前仓库等价调用：
    - 根据 id 在 rootNode 树中查找并 `document.selection.setSelection(nodes, false)`

#### 9.3.7 exportDxf(options?)

- 目的：导出 DXF（全类型覆盖）
- 当前仓库状态：
    - 设计中：全类型覆盖的 DXF 导出尚未落地到 Core SDK
    - suzhu 测试工具已提供 `.dxf (edges)`：把选中节点的 Edge Mesh 写成 DXF R12（仅 LINE；曲线按离散线段输出），用于验证“导出下载通路”
    - 当前仓库已支持导出 `.step/.iges/.brep/.stl/.obj/.ply` 等格式（见 `dataExchange.exportFormats()`）

#### 9.3.8 on(event, handler)

- 目的：订阅对外事件（ready/selectionChanged/patchEmitted/...）
- 返回：unsubscribe 函数
- 当前仓库等价方式：
    - 使用 `PubSub.default.sub(eventName, handler)` 订阅内部事件

#### 9.3.9 dispose()

- 目的：释放资源（WASM/three/事件订阅/DOM）
- 当前仓库建议：
    - 移除挂载到 DOM 的 UI 元素
    - 释放 view/visual 相关对象（由内部实现承担）

### 9.4 对外事件（详细说明）

> 目标：宿主仅依赖“事件名 + payload 结构”，不依赖内部类。

#### 9.4.1 ready

- 触发时机：编辑器初始化完成，可开始调用 API
- payload：`{}` 或 `{ documentId }`

#### 9.4.2 selectionChanged

- 触发时机：选择变化
- payload：`{ ids: string[] }`
- 当前仓库内部事件：
    - `PubSub.selectionChanged(document, selected, unselected)`

#### 9.4.3 patchEmitted

- 触发时机：编辑器侧产生增量变更并向宿主“上报”
- payload：`{ envelope: PatchEnvelope }`
- 当前仓库状态：设计中（需在编辑器变更处统一收敛并 emit）

#### 9.4.4 entityChanged

- 触发时机：实体属性变化（几何/可见性/层/业务属性等）
- payload：`{ ids: string[]; fields: string[] }`
- 当前仓库内部事件参考：
    - `PubSub.modelUpdate(model)`

#### 9.4.5 modeChanged

- payload：`{ mode: "view" | "edit" }`

#### 9.4.6 historyChanged

- payload：`{ canUndo: boolean; canRedo: boolean }`

#### 9.4.7 conflict

- payload：`{ id: string; reason: string; localRev: number; incomingRev: number; incomingMutationId: string }`

#### 9.4.8 error

- payload：`{ message: string; detail?: any }`

### 9.5 applyPatch 可复制示例（可直接用于 suzhu Patch 面板）

使用方式（两步）：

1. 在 suzhu 里点一次 `Dump`，从输出里拿到当前 `documentId`、目标节点的 `id`（例如 `rootNode.id`）
2. 把下面任意示例 JSON 粘贴到 Patch 文本框，替换占位符后点 `Apply Patch`

#### 9.5.1 updateVisual：更新可见/变换等通用属性（示例：移动/隐藏）

```json
{
    "documentId": "<当前 document.id>",
    "source": "host",
    "mutationId": "host-sample-visual-1",
    "baseDocumentRev": 0,
    "ts": 0,
    "patches": [
        {
            "op": "updateVisual",
            "id": "<某个可见节点 id>",
            "rev": 1,
            "set": {
                "visible": true,
                "transform": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 100, 0, 0, 1]
            }
        }
    ]
}
```

#### 9.5.2 updateGeom：更新图元几何参数（示例：修改 Line 的起终点）

```json
{
    "documentId": "<当前 document.id>",
    "source": "host",
    "mutationId": "host-sample-geom-1",
    "patches": [
        {
            "op": "updateGeom",
            "id": "<某个 LineNode id>",
            "rev": 2,
            "set": {
                "start": { "x": 0, "y": 0, "z": 0 },
                "end": { "x": 120, "y": 20, "z": 0 }
            }
        }
    ]
}
```

#### 9.5.3 updateBiz：更新业务属性（只对 VisualNode 生效）

```json
{
    "documentId": "<当前 document.id>",
    "source": "host",
    "mutationId": "host-sample-biz-1",
    "patches": [
        {
            "op": "updateBiz",
            "id": "<某个可见节点 id>",
            "rev": 2,
            "values": {
                "biz.name": { "t": "string", "v": "hello" },
                "biz.count": { "t": "number", "v": 3 }
            }
        }
    ]
}
```

#### 9.5.4 update：通用更新（示例：重命名 rootNode）

```json
{
    "documentId": "<当前 document.id>",
    "source": "host",
    "mutationId": "host-sample-update-1",
    "baseDocumentRev": 0,
    "ts": 0,
    "patches": [
        {
            "op": "update",
            "id": "<rootNode.id>",
            "rev": 1,
            "set": { "name": "Root (patched)" }
        }
    ]
}
```

### 9.6 Web Component 使用说明（目标形态 + 当前实现对照）

目标形态（设计）：

- `<chili3d-editor>` 作为宿主可直接使用的 Web Component
- 通过属性/事件桥接 DTO 与编辑器行为（见 `WebComponentMapping`）

当前仓库实现对照：

- UI 外壳元素：`<chili3d-main-window>`（挂载到 `#app`，由 `AppBuilder.useUI()` 创建）
- 编辑器主体元素：`<chili-editor>`（由 main window 内部创建）
- DTO 层已有基础映射表：`packages/chili-core/src/foundation/dto/webComponent.ts`（attributes/properties/events 的 key 与事件名：`selection-change`、`node-change`、`command-execute`）

## 十、suzhu 测试工具：使用说明与测试数据

项目路径：`suzhu`

### 10.1 运行

```bash
cd suzhu
npm install
npm run dev -- --host
```

### 10.2 可直接使用的测试数据（无需手写）

- Document JSON：启动后会自动填入当前文档的 `document.serialize()` 输出，可直接点 Load 验证“dump -> load”闭环
- Patch Envelope JSON：启动后会自动填入一份可执行 Patch（默认 `update rootNode.name`），可直接点 Apply Patch 验证 Patch 通道（更多可复制示例见 9.5）
- Sample Document：可一键加载内置样例（`Load Sample (2D)` / `Load Sample (3D)` / `Load Sample (All)`），用于快速验证渲染与序列化兼容性

### 10.3 load 输入数据说明（结构概览）

Load 输入是 `Serialized`（内部格式），关键字段：

- `classKey`: `"Document"`
- `version`: `__DOCUMENT_VERSION__`（必须匹配，否则拒绝加载）
- `properties`：
    - `id/name/mode/currentLayerId`
    - `layers/materials/acts/components`
    - `nodes`：节点树的线性序列（含 parentId 关系）

建议获取方式：

- 直接点击 suzhu 控制台的 Dump，获得一份 100% 可用的输入数据，再按需修改。

理解用骨架（实际可执行请以 Dump 输出为准）：

```json
{
    "classKey": "Document",
    "version": "<__DOCUMENT_VERSION__>",
    "properties": {
        "id": "doc-1",
        "name": "Demo",
        "mode": "3d",
        "currentLayerId": "layer-1",
        "components": [],
        "nodes": [],
        "layers": [],
        "materials": [],
        "acts": []
    }
}
```
