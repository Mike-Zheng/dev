<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    icon?: Component
    title: string
    description?: string
    /** Stack control under the text instead of right-aligned (for wide controls). */
    stacked?: boolean
  }>(),
  { stacked: false },
)
</script>

<template>
  <div class="rounded-card border border-line bg-surface">
    <div class="flex gap-3 px-4 py-3" :class="stacked ? 'flex-col sm:flex-row sm:items-center' : 'items-center'">
      <div v-if="icon" class="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center text-fg">
        <component :is="icon" class="h-[18px] w-[18px]" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="text-sm font-medium text-fg leading-tight">{{ title }}</div>
        <div v-if="description" class="text-xs text-fg-muted mt-0.5 leading-snug">{{ description }}</div>
      </div>
      <div class="shrink-0 flex items-center gap-2" :class="stacked ? 'sm:ml-auto' : 'ml-auto'">
        <slot />
      </div>
    </div>
    <div v-if="$slots.content" class="border-t border-line px-4 py-3">
      <slot name="content" />
    </div>
  </div>
</template>
