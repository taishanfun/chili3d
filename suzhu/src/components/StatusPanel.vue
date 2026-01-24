<script setup>
defineProps({
  title: {
    type: String,
    default: "Spec Check",
  },
  items: {
    type: Array,
    default: () => [],
  },
});
</script>

<template>
  <div class="status-panel">
    <div class="status-title">{{ title }}</div>
    <div class="status-list">
      <div v-for="item in items" :key="item.key" class="status-item">
        <span :class="item.ok ? 'status-ok' : 'status-missing'">
          {{ item.ok ? "OK" : "MISSING" }}
        </span>
        <span class="status-name">{{ item.label }}</span>
        <span class="status-mapping">{{ item.mapping }}</span>
      </div>
    </div>
  </div>
</template>
