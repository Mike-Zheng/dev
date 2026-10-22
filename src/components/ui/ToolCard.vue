<script setup lang="ts">
import { Star } from 'lucide-vue-next'
import type { ToolDefinition } from '@/tools/registry'
import { useI18n } from '@/i18n'
import { useSettings } from '@/composables/useSettings'

const props = defineProps<{ tool: ToolDefinition }>()
const { t } = useI18n()
const { isFavorite, toggleFavorite } = useSettings()
const fav = () => isFavorite(props.tool.id)
</script>

<template>
  <RouterLink
    :to="{ name: 'tool', params: { id: tool.id } }"
    class="group relative flex flex-col gap-3 rounded-card border border-line bg-surface p-4 transition-all hover:border-accent/60 hover:shadow-[0_0_0_1px_var(--c-accent),0_8px_30px_-12px_var(--c-glow)] focus-ring"
  >
    <div class="flex items-start justify-between">
      <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-inset ring-accent/20">
        <component :is="tool.icon" class="h-5.5 w-5.5" />
      </div>
      <button
        type="button"
        class="rounded-md p-1.5 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        :class="fav() ? 'text-warning opacity-100' : 'text-fg-faint hover:text-warning'"
        :title="fav() ? t('app.removeFavorite') : t('app.addFavorite')"
        @click.prevent.stop="toggleFavorite(tool.id)"
      >
        <Star class="h-4 w-4" :fill="fav() ? 'currentColor' : 'none'" />
      </button>
    </div>
    <div>
      <div class="text-sm font-semibold text-fg leading-snug">{{ t(`tools.${tool.id}.title`) }}</div>
      <div class="mt-1 text-xs text-fg-muted leading-relaxed line-clamp-2">{{ t(`tools.${tool.id}.description`) }}</div>
    </div>
    <div class="mt-auto text-[11px] uppercase tracking-wider text-fg-faint">{{ t(`groups.${tool.group}`) }}</div>
  </RouterLink>
</template>
