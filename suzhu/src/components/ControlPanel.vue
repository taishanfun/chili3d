<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  isReady: {
    type: Boolean,
    required: true,
  },
  documentJson: {
    type: String,
    required: true,
  },
  patchJson: {
    type: String,
    required: true,
  },
  selectionIds: {
    type: String,
    required: true,
  },
  selectedNodeSnapshot: {
    type: Object,
    default: undefined,
  },
  layerOptions: {
    type: Array,
    default: () => [],
  },
  materialOptions: {
    type: Array,
    default: () => [],
  },
  commandKey: {
    type: String,
    required: true,
  },
  newDocumentName: {
    type: String,
    required: true,
  },
  newDocumentMode: {
    type: String,
    required: true,
  },
  viewMode: {
    type: String,
    required: true,
  },
  exportFormat: {
    type: String,
    required: true,
  },
  exportFormats: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits([
  "update:documentJson",
  "update:patchJson",
  "update:selectionIds",
  "update:commandKey",
  "update:newDocumentName",
  "update:newDocumentMode",
  "update:viewMode",
  "update:exportFormat",
  "createDocument",
  "dumpDocument",
  "loadDocument",
  "loadSampleDocument2d",
  "loadSampleDocument3d",
  "loadSampleDocumentAll",
  "applyPatch",
  "applyPatchEnvelope",
  "patchAdd",
  "patchDelete",
  "getSelection",
  "setSelection",
  "clearSelection",
  "triggerCommand",
  "executeCommand",
  "fitView",
  "exportSelected",
  "setMode",
]);

const selectedIdList = computed(() =>
  (props.selectionIds || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean),
);
const hasSelection = computed(() => selectedIdList.value.length > 0);
const singleSelection = computed(
  () => selectedIdList.value.length === 1 && !!props.selectedNodeSnapshot?.id,
);

const updateModalOpen = ref(false);
const graphicModalOpen = ref(false);
const bizModalOpen = ref(false);
const activeTab = ref("document");

const updateName = ref("");
const updateVisible = ref(true);

const graphicName = ref("");
const graphicVisible = ref(true);
const graphicLayerId = ref("");
const graphicMaterialId = ref("");
const graphicGeomJson = ref("{}");

const bizRows = ref([]);
const bizInitialKeys = ref([]);

const closeAllModals = () => {
  updateModalOpen.value = false;
  graphicModalOpen.value = false;
  bizModalOpen.value = false;
};

const openUpdateModal = () => {
  if (!props.isReady || !singleSelection.value) return;
  updateName.value = props.selectedNodeSnapshot?.name ?? "";
  updateVisible.value = !!props.selectedNodeSnapshot?.visible;
  updateModalOpen.value = true;
};

const openGraphicModal = () => {
  if (!props.isReady || !singleSelection.value) return;
  graphicName.value = props.selectedNodeSnapshot?.name ?? "";
  graphicVisible.value = !!props.selectedNodeSnapshot?.visible;
  graphicLayerId.value = props.selectedNodeSnapshot?.layerId ?? "";
  graphicMaterialId.value = props.selectedNodeSnapshot?.materialId ?? "";
  graphicGeomJson.value = JSON.stringify(props.selectedNodeSnapshot?.geometry ?? {}, null, 2);
  graphicModalOpen.value = true;
};

const inferBizType = (value) => {
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "object";
};

const normalizeBizRows = () => {
  const snapshot = props.selectedNodeSnapshot;
  if (!snapshot) return;
  const propsObj = snapshot.customProperties ?? {};
  const typesObj = snapshot.customPropertyTypes ?? {};
  const keys = Object.keys(propsObj);
  bizInitialKeys.value = keys;
  bizRows.value = keys.map((key) => {
    const raw = propsObj[key];
    const t = typesObj[key] ?? inferBizType(raw);
    if (t === "object") {
      return { key, t, v: JSON.stringify(raw ?? null, null, 2) };
    }
    return { key, t, v: raw };
  });
};

const openBizModal = () => {
  if (!props.isReady || !singleSelection.value) return;
  normalizeBizRows();
  bizModalOpen.value = true;
};

watch(
  () => props.selectedNodeSnapshot?.id,
  () => {
    if (bizModalOpen.value) normalizeBizRows();
  },
);

const emitEnvelope = (patches) => {
  const snapshot = props.selectedNodeSnapshot;
  if (!snapshot?.documentId || !snapshot?.id) return;
  const envelope = {
    documentId: snapshot.documentId,
    source: "host",
    mutationId: `host-ui-${Date.now()}`,
    ts: Date.now(),
    patches,
  };
  emit("applyPatchEnvelope", envelope);
};

const applyUpdate = () => {
  const snapshot = props.selectedNodeSnapshot;
  if (!snapshot?.id) return;
  emitEnvelope([
    {
      op: "updateVisual",
      id: snapshot.id,
      rev: (snapshot.rev ?? 0) + 1,
      set: { name: updateName.value, visible: updateVisible.value },
    },
  ]);
  closeAllModals();
};

const applyGraphic = () => {
  const snapshot = props.selectedNodeSnapshot;
  if (!snapshot?.id) return;
  const rev = (snapshot.rev ?? 0) + 1;

  let geomSet = {};
  const raw = graphicGeomJson.value?.trim();
  if (raw) {
    try {
      geomSet = JSON.parse(raw);
    } catch {
      window.alert("几何属性 JSON 解析失败");
      return;
    }
  }

  const ops = [];
  ops.push({
    op: "updateVisual",
    id: snapshot.id,
    rev,
    set: {
      name: graphicName.value,
      visible: graphicVisible.value,
      layerId: graphicLayerId.value || snapshot.layerId,
      materialId: graphicMaterialId.value || snapshot.materialId,
    },
  });
  if (geomSet && Object.keys(geomSet).length > 0) {
    ops.push({
      op: "updateGeom",
      id: snapshot.id,
      rev,
      set: geomSet,
    });
  }

  emitEnvelope(ops.length === 1 ? ops : [{ op: "batch", label: "graphic-info", ops }]);
  closeAllModals();
};

const addBizRow = () => {
  bizRows.value.push({ key: "", t: "string", v: "" });
};

const deleteBizRow = (index) => {
  bizRows.value.splice(index, 1);
};

const applyBiz = () => {
  const snapshot = props.selectedNodeSnapshot;
  if (!snapshot?.id) return;
  const rev = (snapshot.rev ?? 0) + 1;

  const values = {};
  const currentKeys = new Set();
  bizRows.value.forEach((row) => {
    const key = String(row.key || "").trim();
    if (!key) return;
    currentKeys.add(key);
    if (row.t === "number") {
      const n = typeof row.v === "number" ? row.v : Number(row.v);
      values[key] = { t: "number", v: Number.isFinite(n) ? n : 0 };
      return;
    }
    if (row.t === "boolean") {
      values[key] = { t: "boolean", v: !!row.v };
      return;
    }
    if (row.t === "object") {
      try {
        values[key] = { t: "object", v: JSON.parse(String(row.v || "")) };
      } catch {
        values[key] = { t: "object", v: {} };
      }
      return;
    }
    values[key] = { t: "string", v: String(row.v ?? "") };
  });

  (bizInitialKeys.value || []).forEach((key) => {
    if (!currentKeys.has(key)) values[key] = { t: "delete", v: null };
  });

  emitEnvelope([{ op: "updateBiz", id: snapshot.id, rev, values }]);
  closeAllModals();
};
</script>

<template>
  <div class="panel">
    <div class="panel-title">Chili3D Test Console</div>

    <div class="tabs">
      <button
        class="tab-button"
        :class="{ active: activeTab === 'document' }"
        type="button"
        @click="activeTab = 'document'"
      >
        Document
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'patch' }"
        type="button"
        @click="activeTab = 'patch'"
      >
        Patch
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'selection' }"
        type="button"
        @click="activeTab = 'selection'"
      >
        Selection
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'command' }"
        type="button"
        @click="activeTab = 'command'"
      >
        Command
      </button>
    </div>

    <div v-show="activeTab === 'document'" class="panel-section">
      <div class="panel-section-title">Document</div>
      <div class="panel-row">
        <input
          class="panel-input"
          :value="newDocumentName"
          placeholder="Document name"
          @input="$emit('update:newDocumentName', $event.target.value)"
        />
        <select
          class="panel-select"
          :value="newDocumentMode"
          @change="$emit('update:newDocumentMode', $event.target.value)"
        >
          <option value="3d">3d</option>
          <option value="2d">2d</option>
        </select>
      </div>
      <div class="panel-actions">
        <button class="panel-button" :disabled="!isReady" @click="$emit('createDocument')">
          New Document
        </button>
        <button class="panel-button" :disabled="!isReady" @click="$emit('dumpDocument')">
          Dump
        </button>
        <button class="panel-button" :disabled="!isReady" @click="$emit('loadDocument')">
          Load
        </button>
        <button class="panel-button" :disabled="!isReady" @click="$emit('loadSampleDocument2d')">
          Load Sample (2D)
        </button>
        <button class="panel-button" :disabled="!isReady" @click="$emit('loadSampleDocument3d')">
          Load Sample (3D)
        </button>
        <button class="panel-button" :disabled="!isReady" @click="$emit('loadSampleDocumentAll')">
          Load Sample (All)
        </button>
        <button class="panel-button" :disabled="!isReady" @click="$emit('fitView')">
          Fit View
        </button>
      </div>
      <textarea
        class="panel-textarea"
        rows="8"
        :value="documentJson"
        placeholder="Document JSON"
        @input="$emit('update:documentJson', $event.target.value)"
      />
    </div>

    <div v-show="activeTab === 'patch'" class="panel-section">
      <div class="panel-section-title">Patch</div>
      <div class="panel-actions">
        <button class="panel-button" :disabled="!isReady" @click="$emit('applyPatch')">
          Apply Patch
        </button>
        <button class="panel-button" :disabled="!isReady" @click="emit('patchAdd')">新增</button>
        <button class="panel-button" :disabled="!isReady || !hasSelection" @click="emit('patchDelete')">
          删除
        </button>
        <button class="panel-button" :disabled="!isReady || !singleSelection" @click="openUpdateModal">
          更新
        </button>
        <button class="panel-button" :disabled="!isReady || !singleSelection" @click="openGraphicModal">
          图元信息
        </button>
        <button class="panel-button" :disabled="!isReady || !singleSelection" @click="openBizModal">
          业务信息
        </button>
      </div>
      <textarea
        class="panel-textarea"
        rows="6"
        :value="patchJson"
        placeholder="Patch Envelope JSON"
        @input="$emit('update:patchJson', $event.target.value)"
      />
    </div>

    <div v-show="activeTab === 'selection'" class="panel-section">
      <div class="panel-section-title">Selection</div>
      <div class="panel-row">
        <input
          class="panel-input"
          :value="selectionIds"
          placeholder="id1,id2,id3"
          @input="$emit('update:selectionIds', $event.target.value)"
        />
      </div>
      <div class="panel-actions">
        <button class="panel-button" :disabled="!isReady" @click="$emit('getSelection')">
          Get Selection
        </button>
        <button class="panel-button" :disabled="!isReady" @click="$emit('setSelection')">
          Set Selection
        </button>
        <button class="panel-button" :disabled="!isReady" @click="$emit('clearSelection')">
          Clear Selection
        </button>
      </div>
    </div>

    <div v-show="activeTab === 'command'" class="panel-section">
      <div class="panel-section-title">Command</div>
      <div class="panel-row">
        <input
          class="panel-input"
          :value="commandKey"
          placeholder="command key"
          @input="$emit('update:commandKey', $event.target.value)"
        />
      </div>
      <div class="panel-actions">
        <button class="panel-button" :disabled="!isReady" @click="$emit('triggerCommand')">
          Execute Command
        </button>
        <button
          class="panel-button"
          :disabled="!isReady"
          title="edit.undo"
          @click="$emit('executeCommand', 'edit.undo')"
        >
          Undo
        </button>
        <button
          class="panel-button"
          :disabled="!isReady"
          title="edit.redo"
          @click="$emit('executeCommand', 'edit.redo')"
        >
          Redo
        </button>
        <button
          class="panel-button"
          :disabled="!isReady"
          title="doc.save"
          @click="$emit('executeCommand', 'doc.save')"
        >
          Save
        </button>
      </div>

      <div class="panel-row">
        <select
          class="panel-select"
          :value="viewMode"
          @change="$emit('update:viewMode', $event.target.value)"
        >
          <option value="edit">edit</option>
          <option value="view">view</option>
        </select>
        <button class="panel-button" :disabled="!isReady" @click="$emit('setMode')">
          Set Mode
        </button>
      </div>

      <div class="panel-row">
        <select
          class="panel-select"
          :value="exportFormat"
          @change="$emit('update:exportFormat', $event.target.value)"
        >
          <option v-for="fmt in exportFormats" :key="fmt" :value="fmt">
            {{ fmt }}
          </option>
        </select>
        <button class="panel-button" :disabled="!isReady" @click="$emit('exportSelected')">
          Export
        </button>
      </div>
    </div>
  </div>

  <div v-if="updateModalOpen || graphicModalOpen || bizModalOpen" class="modal-backdrop" @click="closeAllModals">
    <div class="modal" @click.stop>
      <div class="modal-title">
        <span v-if="updateModalOpen">更新</span>
        <span v-else-if="graphicModalOpen">图元信息</span>
        <span v-else>业务信息</span>
      </div>

      <div v-if="updateModalOpen" class="modal-body">
        <div class="form-row">
          <label class="form-label">名称</label>
          <input class="panel-input" v-model="updateName" />
        </div>
        <div class="form-row">
          <label class="form-label">可见</label>
          <input type="checkbox" v-model="updateVisible" />
        </div>
      </div>

      <div v-else-if="graphicModalOpen" class="modal-body">
        <div class="form-row">
          <label class="form-label">名称</label>
          <input class="panel-input" v-model="graphicName" />
        </div>
        <div class="form-row">
          <label class="form-label">可见</label>
          <input type="checkbox" v-model="graphicVisible" />
        </div>
        <div class="form-row">
          <label class="form-label">图层</label>
          <select class="panel-select" v-model="graphicLayerId">
            <option value="">(保持不变)</option>
            <option v-for="l in layerOptions" :key="l.id" :value="l.id">
              {{ l.name }}
            </option>
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">材质</label>
          <select class="panel-select" v-model="graphicMaterialId">
            <option value="">(保持不变)</option>
            <option v-for="m in materialOptions" :key="m.id" :value="m.id">
              {{ m.name }}
            </option>
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">几何属性 (JSON)</label>
          <textarea class="panel-textarea modal-textarea" rows="10" v-model="graphicGeomJson" />
        </div>
      </div>

      <div v-else class="modal-body">
        <div class="panel-actions modal-actions">
          <button class="panel-button" @click="addBizRow">新增条目</button>
        </div>
        <div class="biz-table">
          <div v-for="(row, index) in bizRows" :key="index" class="biz-row">
            <input class="panel-input biz-key" v-model="row.key" placeholder="key" />
            <select class="panel-select biz-type" v-model="row.t">
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
              <option value="object">object</option>
            </select>
            <input
              v-if="row.t === 'string' || row.t === 'number'"
              class="panel-input biz-value"
              v-model="row.v"
              placeholder="value"
            />
            <input v-else-if="row.t === 'boolean'" type="checkbox" v-model="row.v" class="biz-bool" />
            <textarea v-else class="panel-textarea biz-obj" rows="3" v-model="row.v" placeholder="{}" />
            <button class="panel-button biz-del" @click="deleteBizRow(index)">删除</button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="panel-button" @click="closeAllModals">取消</button>
        <button v-if="updateModalOpen" class="panel-button" :disabled="!singleSelection" @click="applyUpdate">
          保存
        </button>
        <button v-else-if="graphicModalOpen" class="panel-button" :disabled="!singleSelection" @click="applyGraphic">
          保存
        </button>
        <button v-else class="panel-button" :disabled="!singleSelection" @click="applyBiz">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}

.modal {
  width: min(720px, 96vw);
  max-height: 90vh;
  overflow: auto;
  background: #151a24;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 12px;
}

.modal-title {
  font-weight: 600;
  margin-bottom: 10px;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  align-items: center;
}

.form-label {
  opacity: 0.85;
}

.modal-textarea {
  resize: vertical;
}

.biz-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.biz-row {
  display: grid;
  grid-template-columns: 1.2fr 0.7fr 1.6fr 76px;
  gap: 8px;
  align-items: start;
}

.biz-value {
  width: 100%;
}

.biz-obj {
  width: 100%;
}

.biz-del {
  height: 32px;
}

.biz-bool {
  height: 32px;
}

.modal-actions {
  margin-bottom: 4px;
}
</style>
