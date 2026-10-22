<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="flex items-center gap-3">
    <h2 class="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">{{ title }}</h2>
    <div class="h-px flex-1 bg-line" />
    <slot />
  </div>
</template>
