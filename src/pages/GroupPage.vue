<script setup lang="ts">
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'
import ToolCard from '@/components/ui/ToolCard.vue'
import { groups, toolsOfGroup, findTool, type ToolGroupId } from '@/tools/registry'
import { useI18n } from '@/i18n'
import { useSettings } from '@/composables/useSettings'

const props = defineProps<{ id: string }>()
const { t } = useI18n()
const { favorites } = useSettings()

const isFavorites = computed(() => props.id === 'favorites')
const group = computed(() => groups.find((g) => g.id === props.id))
const list = computed(() => {
  if (isFavorites.value) return favorites.value.map(findTool).filter((x): x is NonNullable<typeof x> => !!x)
  return group.value ? toolsOfGroup(group.value.id as ToolGroupId) : []
})
const title = computed(() => (isFavorites.value ? t('app.favorites') : group.value ? t(`groups.${group.value.id}`) : t('app.notFound')))
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
    <header class="flex items-center gap-3">
      <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-inset ring-accent/20">
        <Star v-if="isFavorites" class="h-5.5 w-5.5" />
        <component :is="group.icon" v-else-if="group" class="h-5.5 w-5.5" />
      </div>
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-fg">{{ title }}</h1>
        <p class="text-sm text-fg-muted">{{ t('app.toolCount', { count: list.length }) }}</p>
      </div>
    </header>

    <div v-if="list.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <ToolCard v-for="tool in list" :key="tool.id" :tool="tool" />
    </div>
    <div v-else class="rounded-card border border-dashed border-line px-6 py-12 text-center text-sm text-fg-muted">
      {{ t('app.noResults') }}
      <div class="mt-2"><RouterLink to="/" class="text-accent hover:underline">{{ t('app.backHome') }}</RouterLink></div>
    </div>
  </div>
</template>
