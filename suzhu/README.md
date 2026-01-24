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

## English (Short)

- This is a host-side Chili3D test console (Vue + Vite).
- “Load” expects the exact JSON produced by `document.serialize()`; the textbox is auto-filled on startup.
- “Apply Patch” expects a `PatchEnvelope`; a runnable sample is auto-filled on startup.
