<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import { useChiliApp } from "./composables/useChiliApp";
import ChiliFrame from "./components/ChiliFrame.vue";
import ControlPanel from "./components/ControlPanel.vue";
import LogPanel from "./components/LogPanel.vue";

const props = defineProps({
  uiConfig: {
    type: Object,
    default: () => ({ sidebar: { visible: true }, ribbon: { visible: true } }),
  },
});

const searchParams = new URLSearchParams(window.location.search || "");
const hostMode = searchParams.get("hostMode") || "single";
const isMultiHost = computed(() => hostMode === "multi");
const isMultiDom = computed(() => hostMode === "multi-dom");

const chili = useChiliApp();
const multiDomInstances = ref([]);
let nextMultiDomIndex = 1;

const addMultiDomInstance = async () => {
  const index = nextMultiDomIndex++;
  const mountId = `appMulti${index}`;
  const instance = {
    index,
    mountId,
    chili: useChiliApp(),
  };
  multiDomInstances.value.push(instance);
  await nextTick();
  await instance.chili.init(mountId);
};

const seedMultiDomInstances = async (count) => {
  for (let i = 0; i < count; i += 1) {
    await addMultiDomInstance();
  }
};
const sideTab = ref("console");
const showSidebar = computed(() => props.uiConfig?.sidebar?.visible !== false);
const showRibbon = computed(() => props.uiConfig?.ribbon?.visible !== false);

onMounted(async () => {
  if (isMultiHost.value) return;
  if (isMultiDom.value) {
    await seedMultiDomInstances(2);
    return;
  }
  await chili.init("app");
});

const buildSrc = (params) => {
  const u = new URL(window.location.href);
  const nextParams = new URLSearchParams(params);
  u.search = nextParams.toString();
  u.hash = "";
  return u.toString();
};

const iframeA = computed(() =>
  buildSrc({
    hostMode: "single",
    uiProfile: "embed-minimal",
  }),
);
const iframeB = computed(() =>
  buildSrc({
    hostMode: "single",
    uiProfile: "embed-no-sidebar",
    "ui.ribbon": "false",
  }),
);
</script>

<template>
  <div v-if="isMultiHost" class="multi-host">
    <div class="multi-grid">
      <div class="multi-card">
        <div class="multi-title">Instance A (embed-minimal)</div>
        <iframe class="multi-iframe" :src="iframeA" />
      </div>
      <div class="multi-card">
        <div class="multi-title">Instance B (embed-no-sidebar + ribbon=false)</div>
        <iframe class="multi-iframe" :src="iframeB" />
      </div>
    </div>
  </div>

  <div v-else-if="isMultiDom" class="multi-host">
    <div class="multi-toolbar">
      <div class="tabs">
        <button class="tab-button" type="button" @click="addMultiDomInstance">添加实例</button>
        <button class="tab-button" type="button" disabled>实例数：{{ multiDomInstances.length }}</button>
      </div>
    </div>
    <div class="multi-grid">
      <ChiliFrame
        v-for="instance in multiDomInstances"
        :key="instance.mountId"
        :status-items="instance.chili.statusItems.value"
        :show-header="showRibbon"
      >
        <div :id="instance.mountId" class="chili-root"></div>
      </ChiliFrame>
    </div>
  </div>

  <div v-else class="page">
    <div v-if="showSidebar" class="side">
      <div class="tabs">
        <button
          class="tab-button"
          :class="{ active: sideTab === 'console' }"
          type="button"
          @click="sideTab = 'console'"
        >
          控制台
        </button>
        <button
          class="tab-button"
          :class="{ active: sideTab === 'logs' }"
          type="button"
          @click="sideTab = 'logs'"
        >
          日志
        </button>
      </div>

      <div class="side-body">
        <div v-show="sideTab === 'console'" class="side-view">
          <ControlPanel
            :is-ready="chili.isReady.value"
            :document-json="chili.documentJson.value"
            :patch-json="chili.patchJson.value"
            :selection-ids="chili.selectionIds.value"
            :selected-node-snapshot="chili.selectedNodeSnapshot.value"
            :layer-options="chili.layerOptions.value"
            :material-options="chili.materialOptions.value"
            :command-key="chili.commandKey.value"
            :new-document-name="chili.newDocumentName.value"
            :new-document-mode="chili.newDocumentMode.value"
            :view-mode="chili.viewMode.value"
            :export-format="chili.exportFormat.value"
            :export-formats="chili.exportFormats.value"
            @update:documentJson="(value) => (chili.documentJson.value = value)"
            @update:patchJson="(value) => (chili.patchJson.value = value)"
            @update:selectionIds="(value) => (chili.selectionIds.value = value)"
            @update:commandKey="(value) => (chili.commandKey.value = value)"
            @update:newDocumentName="(value) => (chili.newDocumentName.value = value)"
            @update:newDocumentMode="(value) => (chili.newDocumentMode.value = value)"
            @update:viewMode="(value) => (chili.viewMode.value = value)"
            @update:exportFormat="(value) => (chili.exportFormat.value = value)"
            @createDocument="chili.createDocument"
            @dumpDocument="chili.dumpDocument"
            @loadDocument="chili.loadDocument"
            @loadSampleDocument2d="chili.loadSampleDocument2d"
            @loadSampleDocument3d="chili.loadSampleDocument3d"
            @loadSampleDocumentAll="chili.loadSampleDocumentAll"
            @applyPatch="chili.applyPatch"
            @applyPatchEnvelope="chili.applyPatchEnvelope"
            @patchAdd="chili.patchAdd"
            @patchDelete="chili.patchDelete"
            @getSelection="chili.getSelection"
            @setSelection="chili.setSelection"
            @clearSelection="chili.clearSelection"
            @triggerCommand="chili.triggerCommand"
            @executeCommand="chili.executeCommand"
            @fitView="chili.fitView"
            @exportSelected="chili.exportSelected"
            @setMode="chili.setMode"
          />
        </div>
        <div v-show="sideTab === 'logs'" class="side-view">
          <LogPanel :logs="chili.logs.value" />
        </div>
      </div>
    </div>
    <div class="main">
      <ChiliFrame :status-items="chili.statusItems.value" :show-header="showRibbon">
        <div id="app" class="chili-root"></div>
      </ChiliFrame>
    </div>
  </div>
</template>
