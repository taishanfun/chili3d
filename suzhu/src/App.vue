<script setup>
import { onMounted, ref } from "vue";
import { useChiliApp } from "./composables/useChiliApp";
import ChiliFrame from "./components/ChiliFrame.vue";
import ControlPanel from "./components/ControlPanel.vue";
import LogPanel from "./components/LogPanel.vue";

const chili = useChiliApp();
const sideTab = ref("console");

onMounted(() => {
  chili.init();
});
</script>

<template>
  <div class="page">
    <div class="side">
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
      <ChiliFrame :status-items="chili.statusItems.value">
        <div id="app" class="chili-root"></div>
      </ChiliFrame>
    </div>
  </div>
</template>
