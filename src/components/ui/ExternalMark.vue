<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
import { isExternalTool, type ToolDefinition } from '@/tools/registry'

defineProps<{ tool: ToolDefinition }>()
</script>

<template>
  <ExternalLink v-if="isExternalTool(tool)" class="inline-block h-3 w-3 shrink-0 text-fg-faint" aria-hidden="true" />
</template>
