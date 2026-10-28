<script setup lang="ts">
import { isExternalTool, type ToolDefinition } from '@/tools/registry'

defineProps<{ tool: ToolDefinition }>()
</script>

<template>
  <a v-if="isExternalTool(tool)" :href="tool.href" target="_blank" rel="noopener noreferrer">
    <slot />
  </a>
  <RouterLink v-else :to="{ name: 'tool', params: { id: tool.id } }">
    <slot />
  </RouterLink>
</template>
