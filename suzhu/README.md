# suzhu - Chili3D 组件测试工具

## 1. 目标

- 作为宿主项目，加载 Chili3D（WASM + three + UI）并提供一套“可手动触发”的测试控制台
- 用于验证：文档 load/dump、Patch apply、Selection、Command、Mode、Export 等能力

## 2. 启动

```bash
npm install
npm run dev -- --host
```

浏览器打开 Vite 输出的地址（通常是 `http://localhost:5173/`）。

## 3. 控制台功能说明

### 3.1 Document：New / Dump / Load

- New Document：创建一个新文档（name + mode 可编辑）
- Dump：把当前文档序列化为 JSON，写入 Document JSON 文本框
- Load：读取 Document JSON 文本框的 JSON，调用 `app.loadDocument(data)` 反序列化并打开

### Load 输入数据（重点）

- Load 期望的输入就是 `document.serialize()` 的输出（内部格式 `Serialized`，不是 `ChiliDocumentDTO`）
- 工具启动后会自动把当前文档的 `serialize()` 结果写入 Document JSON 文本框，因此默认内容就是一份“可直接 Load 的测试数据”

Serialized（理解用的骨架，实际可执行请以 Dump 输出为准）：

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

### 3.2 Patch：Apply Patch

- Apply Patch：读取 Patch Envelope JSON 文本框，调用 `NodeAdapter.applyPatchEnvelope(envelope)`
- 工具启动后会自动写入一份可直接执行的 Patch 示例（默认对 rootNode 做一次 `update name`）

Patch 示例结构（关键字段）：

- `documentId`: 当前 document.id
- `source`: `"host"`
- `mutationId`: 任意字符串（用于回声抑制/去重）
- `patches`: PatchOp 数组

Patch 示例 1：重命名 rootNode（可直接执行）

```json
{
    "documentId": "<当前 document.id>",
    "source": "host",
    "mutationId": "host-sample-rename-1",
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

Patch 示例 2：更新业务属性（对 VisualNode 生效）

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

### 3.3 Selection：Get / Set / Clear

- Get Selection：读取当前选择的节点 id 列表，写入输入框
- Set Selection：按 `id1,id2,id3` 查找节点并选中
- Clear Selection：清空选择

### 3.4 Command：Execute / Undo / Redo / Save

- Execute Command：发布 `PubSub.executeCommand`（输入 command key）
- Undo/Redo/Save：快捷触发常用命令

### 3.5 Mode：view/edit

- 下拉选择 view/edit 后点击 Set Mode
- view：停止 EditorService 并重置 eventHandler（只读交互）
- edit：启动 EditorService（恢复编辑交互）

### 3.6 Export：导出当前选择

- 选择导出格式（来自 `app.dataExchange.exportFormats()`）
- 点击 Export：对当前选中节点执行 `dataExchange.export(format, selectedNodes)` 并下载文件
- `.dxf (edges)`：把选中节点的 Edge Mesh 写成 DXF R12（仅 LINE；曲线按离散线段输出）

## 4. 对应代码位置

- 初始化与业务逻辑：[useChiliApp.js](src/composables/useChiliApp.js)
- 控制台 UI：[ControlPanel.vue](src/components/ControlPanel.vue)
- 页面拼装与布局：[App.vue](src/App.vue)

## 5. UI 配置（组件显示/隐藏）

当 Chili3D 嵌入不同宿主时，可通过运行时配置控制界面组件显示/隐藏，无需改代码。

### 5.1 配置文件（推荐，运行时生效）

修改 `public/ui-config.json`，刷新页面即可生效：

```json
{
    "sidebar": { "visible": true },
    "ribbon": { "visible": true },
    "profiles": {
        "embed-minimal": {
            "sidebar": { "visible": false },
            "ribbon": { "visible": false }
        }
    }
}
```

- `sidebar.visible`: 是否显示左侧栏（控制台/日志）
- `ribbon.visible`: 是否显示顶部功能区（在 suzhu 中对应 `ChiliFrame` 的 header）
- `profiles`: 可选，用于按“页面/场景”定义不同配置片段

### 5.2 按页面/场景覆盖（同一宿主不同页面）

如果同一个宿主在不同页面/路由嵌入 Chili3D 时需要不同 UI，可以通过 URL 参数做运行时覆盖：

- `?uiProfile=embed-minimal`：从 `ui-config.json` 的 `profiles` 中选择一套配置
- `?ui.sidebar=false` / `?ui.ribbon=false`：直接覆盖单个开关（优先级最高）
- `?uiConfigUrl=/some/path/ui-config.json`：指定配置文件地址（便于宿主按页面下发不同配置）

优先级（从低到高）：

默认值 < `ui-config.json` 根配置 < `uiProfile` < 环境变量 < URL 参数覆盖

### 5.2 环境变量（可选）

也可在 `.env`（或构建环境）中配置：

- `VITE_UI_SIDEBAR_VISIBLE=true|false`
- `VITE_UI_RIBBON_VISIBLE=true|false`

（环境变量优先级高于 `public/ui-config.json`，低于 URL 参数覆盖）

## English (Short)

- This is a host-side Chili3D test console (Vue + Vite).
- “Load” expects the exact JSON produced by `document.serialize()`; the textbox is auto-filled on startup.
- “Apply Patch” expects a `PatchEnvelope`; a runnable sample is auto-filled on startup.
