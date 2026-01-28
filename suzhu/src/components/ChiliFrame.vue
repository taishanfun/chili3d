<script setup>
import StatusPanel from "./StatusPanel.vue";

defineProps({
  statusItems: {
    type: Array,
    default: () => [],
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
});
</script>

<template>
  <div class="frame">
    <div v-if="showHeader" class="frame-header">
      <div class="frame-title">Chili3D Web Component Frame</div>
      <div class="frame-subtitle">chili3d-main-window</div>
    </div>
    <div class="frame-body">
      <slot />
      <StatusPanel :items="statusItems" />
    </div>
  </div>
</template>
