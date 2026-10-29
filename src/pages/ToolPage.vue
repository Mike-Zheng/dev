<script setup lang="ts">
import { computed, defineAsyncComponent, watch } from 'vue'
import { ExternalLink, Moon, Star, Sun } from 'lucide-vue-next'
import { findTool, isExternalTool } from '@/tools/registry'
import { useI18n } from '@/i18n'
import { useSettings } from '@/composables/useSettings'

const props = defineProps<{ id: string }>()
const { t } = useI18n()
const { isFavorite, toggleFavorite, pushRecent, isDark, toggleTheme } = useSettings()

const tool = computed(() => findTool(props.id))
const component = computed(() => {
  const def = tool.value
  return def && !isExternalTool(def) ? defineAsyncComponent(def.component) : null
})
const externalHref = computed(() => {
  const def = tool.value
  return def && isExternalTool(def) ? def.href : null
})

watch(
  () => props.id,
  (id) => {
    if (findTool(id)) pushRecent(id)
    document.title = tool.value ? `${t(`tools.${id}.title`)} - dev` : 'dev'
  },
  { immediate: true },
)

function openNewTab() {
  window.open(`${location.pathname}#/tool/${props.id}`, '_blank', 'noopener')
}
</script>

<template>
  <div class="mx-auto flex min-h-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
    <template v-if="tool">
      <header class="mb-5 flex items-start gap-3">
        <div class="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-surface-2 text-fg">
          <component :is="tool.icon" class="h-5.5 w-5.5" />
        </div>
        <div class="min-w-0 flex-1">
          <nav class="text-[11px] uppercase tracking-wider text-fg-faint">
            <RouterLink :to="{ name: 'group', params: { id: tool.group } }" class="hover:text-accent">{{ t(`groups.${tool.group}`) }}</RouterLink>
          </nav>
          <h1 class="text-xl sm:text-2xl font-semibold tracking-tight text-fg leading-tight">{{ t(`tools.${tool.id}.title`) }}</h1>
          <p class="mt-0.5 text-sm text-fg-muted">{{ t(`tools.${tool.id}.description`) }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <button
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm transition-colors focus-ring"
            :class="isFavorite(tool.id) ? 'text-warning bg-warning-soft' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'"
            :title="isFavorite(tool.id) ? t('app.removeFavorite') : t('app.addFavorite')"
            @click="toggleFavorite(tool.id)"
          >
            <Star class="h-4 w-4" :fill="isFavorite(tool.id) ? 'currentColor' : 'none'" />
            <span class="hidden md:inline">{{ isFavorite(tool.id) ? t('app.removeFavorite') : t('app.addFavorite') }}</span>
          </button>
          <button
            type="button"
            v-if="!externalHref"
            class="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg focus-ring"
            :title="t('app.openInNewTab')"
            @click="openNewTab"
          >
            <ExternalLink class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg focus-ring"
            :title="t('app.theme')"
            @click="toggleTheme"
          >
            <Sun v-if="isDark" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </button>
        </div>
      </header>

      <div v-if="externalHref" class="rounded-card border border-line bg-surface p-6 space-y-4">
        <p class="text-sm text-fg-muted">{{ t('app.externalNote') }}</p>
        <a
          :href="externalHref"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:opacity-90 focus-ring"
        >
          <ExternalLink class="h-4 w-4" />
          {{ t('app.openExternal') }}
        </a>
      </div>

      <div v-else class="flex-1 min-h-0">
        <Suspense>
          <component :is="component" v-if="component" />
          <template #fallback>
            <div class="animate-pulse space-y-3">
              <div class="h-14 rounded-card bg-surface-2" />
              <div class="h-64 rounded-card bg-surface-2" />
            </div>
          </template>
        </Suspense>
      </div>
    </template>

    <div v-else class="rounded-card border border-dashed border-line px-6 py-16 text-center">
      <div class="text-lg font-medium text-fg">{{ t('app.notFound') }}</div>
      <RouterLink to="/" class="mt-2 inline-block text-sm text-accent hover:underline">{{ t('app.backHome') }}</RouterLink>
    </div>
  </div>
</template>
