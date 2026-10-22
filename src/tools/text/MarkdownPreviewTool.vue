<script setup lang="ts">
import { computed, ref } from 'vue'
import { Palette, Download } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import { useSettings } from '@/composables/useSettings'
import { downloadText } from '@/composables/useFiles'
import { htmlDocument, renderMarkdown } from './markdown'

const { t } = useI18n()
const tt = (k: string) => t(`tools.markdown.${k}`)
const { isDark } = useSettings()

type Theme = 'light' | 'dark'
const theme = ref<Theme>(isDark.value ? 'dark' : 'light')
const themeOptions = computed<{ value: Theme; label: string }[]>(() => [
  { value: 'light', label: tt('light') },
  { value: 'dark', label: tt('dark') },
])

const input = ref(`# DevToys Web\n\nA **Swiss Army knife** for developers, _in your browser_.\n\n- Converters\n- Encoders / Decoders\n- Formatters\n\n\`\`\`ts\nconst answer = 42\n\`\`\`\n\n| Tool | Group |\n| --- | --- |\n| JSON | Formatters |\n\n> Everything runs locally.\n`)

const html = computed(() => renderMarkdown(input.value))

function exportHtml() {
  downloadText(htmlDocument(html.value), 'markdown.html', 'text/html')
}
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Palette" :title="tt('theme')" :description="tt('themeDesc')">
        <BaseSelect v-model="theme" :options="themeOptions" />
      </SettingCard>
    </ConfigSection>

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="tt('input')" height-class="min-h-[28rem]" accept=".md,.markdown,.txt" />

      <div class="flex flex-col rounded-card border border-line bg-surface overflow-hidden">
        <div class="flex items-center gap-1 border-b border-line bg-surface-2/60 px-2 py-1.5 min-h-[38px]">
          <span class="px-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('preview') }}</span>
          <span class="flex-1" />
          <IconButton size="sm" :title="tt('exportHtml')" :disabled="!input" @click="exportHtml"><Download class="h-4 w-4" /></IconButton>
        </div>
        <div
          class="flex-1 overflow-auto px-5 py-4 min-h-[24rem] max-h-[48rem]"
          :class="theme === 'dark' ? 'bg-[#0d1117] text-[#e6edf3]' : 'bg-white text-[#1f2328]'"
        >
          <article class="md-preview" :class="theme === 'dark' ? 'prose-invert' : ''" v-html="html" />
        </div>
      </div>
    </div>
  </div>
</template>
