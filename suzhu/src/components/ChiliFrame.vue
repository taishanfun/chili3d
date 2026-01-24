<script setup>
import StatusPanel from "./StatusPanel.vue";

defineProps({
  statusItems: {
    type: Array,
    default: () => [],
  },
});
</script>

<template>
  <div class="frame">
    <div class="frame-header">
      <div class="frame-title">Chili3D Web Component Frame</div>
      <div class="frame-subtitle">chili3d-main-window</div>
    </div>
    <div class="frame-body">
      <slot />
      <StatusPanel :items="statusItems" />
    </div>
  </div>
</template>
