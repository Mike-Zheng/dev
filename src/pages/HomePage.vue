<script setup lang="ts">
import { computed } from 'vue'
import { Lightbulb } from 'lucide-vue-next'
import ToolCard from '@/components/ui/ToolCard.vue'
import SectionTitle from '@/components/ui/SectionTitle.vue'
import { groups, toolsOfGroup, findTool } from '@/tools/registry'
import { useI18n } from '@/i18n'
import { useSettings } from '@/composables/useSettings'

const { t } = useI18n()
const { favorites, recents } = useSettings()

const favoriteTools = computed(() => favorites.value.map(findTool).filter((x): x is NonNullable<typeof x> => !!x))
const recentTools = computed(() =>
  recents.value
    .map(findTool)
    .filter((x): x is NonNullable<typeof x> => !!x)
    .filter((x) => !favorites.value.includes(x.id))
    .slice(0, 4),
)
</script>

<template>
  <div>
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      <!-- Favorites -->
      <section v-if="favoriteTools.length" class="space-y-4">
        <SectionTitle :title="t('app.favorites')" />
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ToolCard v-for="tool in favoriteTools" :key="tool.id" :tool="tool" />
        </div>
      </section>

      <!-- Recents -->
      <section v-if="recentTools.length" class="space-y-4">
        <SectionTitle :title="t('app.recents')" />
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ToolCard v-for="tool in recentTools" :key="tool.id" :tool="tool" />
        </div>
      </section>

      <!-- All tools by group -->
      <section v-for="g in groups" :key="g.id" class="space-y-4">
        <template v-if="toolsOfGroup(g.id).length">
          <SectionTitle :title="t(`groups.${g.id}`)">
            <RouterLink :to="{ name: 'group', params: { id: g.id } }" class="text-xs text-accent hover:underline">
              {{ toolsOfGroup(g.id).length }} →
            </RouterLink>
          </SectionTitle>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ToolCard v-for="tool in toolsOfGroup(g.id)" :key="tool.id" :tool="tool" />
          </div>
        </template>
      </section>

      <!-- Footer info -->
      <div class="flex items-start gap-3 rounded-card border border-line bg-surface px-4 py-3.5 text-sm">
        <Lightbulb class="mt-0.5 h-4.5 w-4.5 shrink-0 text-warning" />
        <div>
          <div class="font-medium text-fg">{{ t('app.notFinding') }}</div>
          <div class="text-fg-muted">{{ t('app.notFindingHint') }}</div>
          <a href="https://github.com/Mike-Zheng/dev/issues" target="_blank" rel="noreferrer" class="mt-1 inline-block text-accent hover:underline">
            {{ t('app.suggest') }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
