# Chili3D 组件使用指南（user.md）

本文档基于：

- 设计规格：[componentization_v1.md](file:///f:/person/githup/chili3d/docs/design/componentization_v1.md)
- 可运行参考工程：suzhu（`f:\person\githup\chili3d\suzhu`）
- WebComponent 协议定义：[`webComponent.ts`](file:///f:/person/githup/chili3d/packages/chili-core/src/foundation/dto/webComponent.ts)
- DTO/Patch 协议定义：[`node.ts`](file:///f:/person/githup/chili3d/packages/chili-core/src/foundation/dto/node.ts)
- WebComponent 实现：[`chili-web/src/index.ts`](file:///f:/person/githup/chili3d/packages/chili-web/src/index.ts)

目标：指导你在自己的项目里嵌入 Chili3D 组件，并完成：

- 输入数据（`data: EntityDTO[]`）
- 模式切换（`viewMode: "view" | "edit"`）
- 选中同步（`selectedIds: string[]`）
- 监听事件（`selection-change` / `node-change` / `command-execute`）

---

## 0. 你将得到什么

完成本文档后，你可以在任意 Vue 3 页面里：

- 嵌入一个 `<chili3d-editor>`，像使用普通 DOM 组件一样使用它
- 从宿主推送初始模型（DTO）
- 监听编辑器输出的增量变更（PatchEnvelope），再转发给后端或其他协同端

---

## 1. 集成形态选择

### 1.1 Web Component（推荐：宿主只关心 DOM + DTO）

- 组件：`<chili3d-editor>`
- 特点：宿主通过 attributes/properties 输入，通过 CustomEvent 输出
- 适用：业务侧希望“黑盒嵌入”，以最小成本接入编辑器

### 1.2 SDK 方式（适合深度定制 UI/流程）

- 方式：直接调用 `AppBuilder` 创建 `Application`，并通过 `useUI(dom)` 把完整 UI（`<chili3d-main-window>`）挂载到指定容器
- 适用：需要定制 Ribbon/命令/窗口布局，或深度介入 Document 生命周期
- 入口：[`AppBuilder.useUI`](file:///f:/person/githup/chili3d/packages/chili-builder/src/appBuilder.ts#L60-L75)

---

## 2. 快速开始（Vue 3）

这一节以 Vue 3 为例给出“最短闭环”：渲染组件 + 设置数据 + 监听事件。

### 2.1 安装与依赖

在你的业务项目中安装依赖（包名以仓库 workspace 为准；若你已通过 monorepo/私服接入，可略过这一步）：

```bash
npm i chili-web chili-core
```

说明：

- `chili-web` 负责注册 `<chili3d-editor>` 并在内部通过 `AppBuilder` 动态加载 UI/渲染/存储等模块
- `chili-core` 提供 DTO 与 Patch 的类型定义（给宿主侧做类型约束）

### 2.2 在项目入口注册 Web Component（只需要一次）

例如 `src/main.ts`：

```ts
import { createApp } from "vue";
import App from "./App.vue";

import "chili-web";

createApp(App).mount("#app");
```

### 2.3 在组件里使用（最小示例）

```vue
<template>
    <div class="page">
        <div ref="hostRef" class="editor-host"></div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import type { EntityDTO, PatchEnvelope, WebComponentViewMode } from "chili-core";

const hostRef = ref<HTMLDivElement | null>(null);
let editorEl: HTMLElement | null = null;

const initialData: EntityDTO[] = [
    {
        id: "G-1",
        type: "GroupNode",
        name: "Root Group",
        rev: 0,
        children: [
            {
                id: "L-1",
                type: "LineNode",
                name: "Line",
                rev: 0,
                start: { x: 0, y: 0, z: 0 },
                end: { x: 80, y: 0, z: 0 },
                visible: true,
                materialId: "",
            },
        ],
    } as any,
];

const handleSelectionChange = (ev: Event) => {
    const ids = (ev as CustomEvent<string[]>).detail;
    console.log("selection-change:", ids);
};

const handleNodeChange = (ev: Event) => {
    const envelope = (ev as CustomEvent<PatchEnvelope>).detail;
    console.log("node-change:", envelope);
};

const handleCommandExecute = (ev: Event) => {
    const { command, args } = (ev as CustomEvent<{ command: string; args: any }>).detail;
    console.log("command-execute:", command, args);
};

onMounted(() => {
    if (!hostRef.value) return;

    editorEl = document.createElement("chili3d-editor");
    editorEl.style.width = "100%";
    editorEl.style.height = "100%";

    editorEl.addEventListener("selection-change", handleSelectionChange);
    editorEl.addEventListener("node-change", handleNodeChange);
    editorEl.addEventListener("command-execute", handleCommandExecute);

    hostRef.value.appendChild(editorEl);

    (editorEl as any).viewMode = "edit" satisfies WebComponentViewMode;
    (editorEl as any).data = initialData;
});

onBeforeUnmount(() => {
    if (!editorEl) return;
    editorEl.removeEventListener("selection-change", handleSelectionChange);
    editorEl.removeEventListener("node-change", handleNodeChange);
    editorEl.removeEventListener("command-execute", handleCommandExecute);
    editorEl.remove();
    editorEl = null;
});
</script>

<style scoped>
.editor-host {
    width: 100%;
    height: 600px;
    min-height: 400px;
}
</style>
```

要点：

- 容器必须有明确高度，否则编辑器会“看起来没渲染”
- 事件监听建议在 append 之后立即绑定，避免漏掉启动阶段的事件

---

## 3. Web Component API（`<chili3d-editor>`）

本节以“Vue 用户文档”风格给出 API 参考：props/attributes/events 的含义、类型、默认值与行为。

### 3.1 Props / Properties

类型来自：[`ChiliWebComponentProps`](file:///f:/person/githup/chili3d/packages/chili-core/src/foundation/dto/webComponent.ts#L7-L13)

#### 3.1.1 data

- 类型：`EntityDTO | EntityDTO[]`
- 默认值：`[]`
- 用途：向编辑器输入“当前应该展示的实体树/实体集合”

行为：

- 当前实现采用“全量替换”：会清空 root 下现有子节点，然后根据 DTO 重新创建
- 支持 `GroupNode.children` 递归构建树
- 当前实现覆盖的基础 DTO 类型：Line/Circle/Rect/Ellipse/Box/Sphere/Cylinder/Cone/Group

建议：

- 若你需要“增量更新”而不是全量替换，优先走 Patch 协议（目前 `<chili3d-editor>` 侧只负责向外派发 PatchEnvelope；宿主侧应用 patch 需要在你自己的数据层完成）

#### 3.1.2 viewMode

- 类型：`"view" | "edit"`
- 默认值：`"edit"`
- 用途：切换只读/可编辑模式

行为（与设计文档一致）：

- `view`：停止 EditorService，并重置事件处理器为只读交互
- `edit`：启动 EditorService，恢复编辑交互

#### 3.1.3 selectedIds

- 类型：`string[]`
- 默认值：`[]`
- 用途：由宿主指定“编辑器内部应当选中的节点 id 列表”

行为：

- 会在当前文档树中查找 id 并设置 selection
- 找不到的 id 会被忽略

---

### 3.2 Attributes

属性映射表：[`WebComponentMapping`](file:///f:/person/githup/chili3d/packages/chili-core/src/foundation/dto/webComponent.ts#L30-L37)

目前仅实现：

#### 3.2.1 view-mode

- 对应 property：`viewMode`
- 值：`view` / `edit`

示例：

```html
<chili3d-editor view-mode="view"></chili3d-editor>
```

---

### 3.3 Events

事件类型来自：[`ChiliWebComponentEvents`](file:///f:/person/githup/chili3d/packages/chili-core/src/foundation/dto/webComponent.ts#L15-L28)

#### 3.3.1 selection-change

- `detail`：`string[]`（当前选中的实体 id 列表）
- 触发时机：selection 变化（点击选择、框选、程序设置 selection 等）

```js
el.addEventListener("selection-change", (ev) => {
    const ids = ev.detail;
});
```

#### 3.3.2 node-change

- `detail`：`PatchEnvelope`
- 触发时机：模型结构变化、属性变化、业务属性变化

```js
el.addEventListener("node-change", (ev) => {
    const envelope = ev.detail;
});
```

PatchEnvelope 结构见：[`PatchEnvelope`](file:///f:/person/githup/chili3d/packages/chili-core/src/foundation/dto/node.ts#L188-L195)

当前组件派发规则（对应实现）：[`handleNotification`](file:///f:/person/githup/chili3d/packages/chili-web/src/index.ts#L179-L273)

- 属性变化：派发 `update` 或 `updateBiz`（包含 `rev`）
- 节点增加/删除：派发 `add` / `remove`
- 结构变化（move/insert/transfer）：优先派发 `replace`（替换父 `GroupNode` 的 children 快照），避免外部难以重建树结构

#### 3.3.3 command-execute

- `detail`：`{ command: string; args: any }`
- 触发时机：内部 UI 触发 `PubSub.executeCommand`

```js
el.addEventListener("command-execute", (ev) => {
    const { command, args } = ev.detail;
});
```

---

## 4. 数据协议（DTO 与 Patch）速查

这部分用于宿主侧“正确建模数据结构”，并理解为什么要有 `rev` 与 `mutationId`。

### 4.1 EntityDTO

定义：[`EntityDTO`](file:///f:/person/githup/chili3d/packages/chili-core/src/foundation/dto/node.ts#L145-L155)

关键字段：

- `id`：实体唯一 id（用于 selection、patch 定位）
- `type`：判别字段（例如 `LineNode` / `GroupNode`）
- `rev`：版本号（用于冲突检测与 OCC）
- `bizProps`：业务属性容器（推荐所有业务扩展都放这里）

### 4.2 PatchEnvelope / PatchOp

定义：[`PatchEnvelope`](file:///f:/person/githup/chili3d/packages/chili-core/src/foundation/dto/node.ts#L188-L195) / [`PatchOp`](file:///f:/person/githup/chili3d/packages/chili-core/src/foundation/dto/node.ts#L172-L187)

实用建议：

- 宿主在收到 `node-change` 后，建议把 `envelope` 作为“增量日志”存储（便于回放/审计/协同）
- 多端协同时，`mutationId` 用于回声抑制（ACK），`rev` 用于冲突检测

---

## 5. 多实例（Multi-Instance）建议

设计建议见 [componentization_v1.md](file:///f:/person/githup/chili3d/docs/design/componentization_v1.md#L17-L37)。

### 5.1 两种典型方案

- 强隔离（推荐）：多个 iframe，各自一套 window/global
- 同页多实例（同 DOM）：多个容器分别挂载多个实例

### 5.2 同页多实例注意事项

- 每个实例使用独立容器：`<div id="appA">` / `<div id="appB">`
- 事件总线 `PubSub.default` 采用 Application scope 路由：无上下文事件（如 executeCommand）依赖“当前激活 Application”

suzhu 示例：

- 同页多实例（同 DOM）：[`App.vue`](file:///f:/person/githup/chili3d/suzhu/src/App.vue#L92-L109)
- 多 iframe：[`App.vue`](file:///f:/person/githup/chili3d/suzhu/src/App.vue#L78-L90)

---

## 6. SDK 方式嵌入（AppBuilder）

如果你不使用 `<chili3d-editor>`，而是希望完全按 SDK 方式控制：

```ts
import { AppBuilder } from "chili-builder";

const root = document.getElementById("app");
const app = await new AppBuilder().useIndexedDB().useWasmOcc().useThree().useUI(root).build();

const doc = await app.newDocument("MyDoc", "3d");
```

说明：

- `useUI(root)` 会创建并挂载 `chili-ui` 的 `<chili3d-main-window>`
- 默认 services 包含 CommandService/HotkeyService/EditorService：见 [`AppBuilder.getServices`](file:///f:/person/githup/chili3d/packages/chili-builder/src/appBuilder.ts#L148-L156)

---

## 7. 变更通知（可选：通用 CustomEvent/postMessage 协议）

如果你希望收到更“可节流、可批量”的通知流（并不仅限于 WebComponent 的三个事件），可以使用通知服务：

- 核心实现：[`Chili3DNotificationService`](file:///f:/person/githup/chili3d/packages/chili-core/src/foundation/hostNotification.ts#L103-L190)
- 支持 transport：`CustomEventTransport` / `PostMessageTransport`

协议示例见设计文档 [8.3 节](file:///f:/person/githup/chili3d/docs/design/componentization_v1.md#L282-L340)。

---

## 8. 常见问题（FAQ）与排错

### 8.1 编辑器区域空白 / 只有 loading

优先检查：

- 容器有没有高度（`height` / `min-height`）
- 是否被父级 flex/grid 计算为 0 高度
- 控制台是否有 WASM 加载失败、网络错误

### 8.2 设置了 data 但不显示

优先检查：

- `EntityDTO.type` 是否是已支持的类型（例如 `LineNode`/`GroupNode` 等）
- DTO 的关键字段是否完整（`id/name/rev` 等）
- 你的 `GroupNode.children` 是否为数组，且子节点结构正确

### 8.3 如何把编辑器的变更同步回业务数据

推荐做法：

- 监听 `node-change`，拿到 `PatchEnvelope`
- 业务侧维护一份“DTO 树/列表”作为单一数据源
- 用 `patches` 驱动业务数据更新（或把 patch 直接送后端做事件溯源）
