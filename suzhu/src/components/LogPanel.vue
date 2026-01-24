<script setup>
defineProps({
  logs: {
    type: Array,
    default: () => [],
  },
});
</script>

<template>
  <div class="panel log-panel">
    <div class="panel-title">Event Log</div>
    <div class="log-list">
      <div v-for="item in logs" :key="item.id" class="log-item">
        <div class="log-header">
          <span class="log-time">{{ item.time }}</span>
          <span class="log-type">{{ item.type }}</span>
          <span class="log-message">{{ item.message }}</span>
        </div>
        <pre v-if="item.detail" class="log-detail">{{ item.detail }}</pre>
      </div>
    </div>
  </div>
</template>
