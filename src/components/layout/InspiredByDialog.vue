<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ExternalLink, X } from 'lucide-vue-next'
import IconButton from '@/components/ui/IconButton.vue'
import ToolLink from '@/components/ui/ToolLink.vue'
import { findTool, isExternalTool, tools, type ToolDefinition } from '@/tools/registry'
import { inspirations, libraries, type Credit } from '@/tools/credits'
import { useI18n } from '@/i18n'
import { useInspiredBy } from '@/composables/useInspiredBy'

const { t } = useI18n()
const { open } = useInspiredBy()

const dialog = ref<HTMLDialogElement | null>(null)

watch([open, dialog], ([isOpen, el]) => {
  if (!el) return
  if (isOpen && !el.open) el.showModal()
  else if (!isOpen && el.open) el.close()
})

function close() {
  open.value = false
}

/** Clicks on the dialog element itself (not its content) land on the backdrop. */
function onBackdrop(e: MouseEvent) {
  if (e.target === dialog.value) close()
}

const externalTools = computed(() => tools.filter(isExternalTool))

function toolsOf(credit: Credit): ToolDefinition[] {
  return credit.tools.map(findTool).filter((x): x is ToolDefinition => !!x)
}

const sections = computed(() => [
  { id: 'projects', title: t('inspired.projects'), credits: inspirations },
  { id: 'libraries', title: t('inspired.libraries'), credits: libraries },
])
</script>

<template>
  <dialog
    ref="dialog"
    class="m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[85vh] overflow-hidden rounded-card border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    :aria-label="t('inspired.title')"
    @close="close"
    @click="onBackdrop"
  >
    <div class="flex max-h-[85vh] flex-col">
      <header class="flex items-start gap-3 border-b border-line px-5 py-4">
        <div class="min-w-0 flex-1">
          <h2 class="text-base font-semibold">{{ t('inspired.title') }}</h2>
          <p class="mt-0.5 text-sm text-fg-muted">{{ t('inspired.intro') }}</p>
        </div>
        <IconButton :title="t('inspired.close')" @click="close">
          <X class="h-4.5 w-4.5" />
        </IconButton>
      </header>

      <div class="flex-1 space-y-6 overflow-y-auto px-5 py-4">
        <section v-for="s in sections" :key="s.id" class="space-y-2">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-fg-faint">{{ s.title }}</h3>
          <ul class="divide-y divide-line rounded-card border border-line">
            <li v-for="c in s.credits" :key="c.url" class="flex flex-col gap-1.5 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
              <a
                :href="c.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-accent hover:underline focus-ring rounded-sm"
              >
                <span class="truncate" :class="s.id === 'libraries' ? 'font-mono text-[13px]' : ''">{{ c.name }}</span>
                <ExternalLink class="h-3 w-3 shrink-0" aria-hidden="true" />
              </a>
              <div class="flex flex-wrap gap-1 sm:ml-auto sm:justify-end">
                <span v-if="c.note" class="text-xs text-fg-muted">{{ t(c.note) }}</span>
                <ToolLink
                  v-for="tool in toolsOf(c)"
                  :key="tool.id"
                  :tool="tool"
                  class="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-xs text-fg-muted hover:bg-surface-3 hover:text-fg focus-ring"
                  @click="close"
                >
                  <component :is="tool.icon" class="h-3 w-3" />
                  {{ t(`tools.${tool.id}.short`) }}
                </ToolLink>
              </div>
            </li>
          </ul>
        </section>

        <section v-if="externalTools.length" class="space-y-2">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-fg-faint">{{ t('inspired.externalTools') }}</h3>
          <ul class="divide-y divide-line rounded-card border border-line">
            <li v-for="tool in externalTools" :key="tool.id" class="flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
              <a
                :href="tool.href"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-accent hover:underline focus-ring rounded-sm"
              >
                <component :is="tool.icon" class="h-4 w-4 shrink-0" />
                <span class="truncate">{{ t(`tools.${tool.id}.title`) }}</span>
                <ExternalLink class="h-3 w-3 shrink-0" aria-hidden="true" />
              </a>
              <span class="truncate font-mono text-xs text-fg-faint sm:ml-auto">{{ tool.href }}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </dialog>
</template>
