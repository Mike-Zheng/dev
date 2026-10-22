<script setup lang="ts">
import { computed, ref } from 'vue'
import { Rows3, Eraser } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { useSettings } from '@/composables/useSettings'
import { compareText, type DiffKind } from './compare'

const { t } = useI18n()
const tt = (k: string) => t(`tools.text-compare.${k}`)
const { editorFontSize } = useSettings()

const inline = ref(true)
const ignoreWs = ref(false)
const original = ref('')
const modified = ref('')

const result = computed(() => compareText(original.value, modified.value, ignoreWs.value))

const identical = computed(() => (original.value || modified.value) && result.value.added === 0 && result.value.removed === 0)

function rowClass(k: DiffKind) {
  return k === 'add' ? 'bg-success-soft' : k === 'del' ? 'bg-danger-soft' : ''
}
function partClass(k: DiffKind) {
  return k === 'add' ? 'bg-success/25 rounded-sm' : k === 'del' ? 'bg-danger/25 rounded-sm' : ''
}
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Rows3" :title="tt('inline')" :description="tt('inlineDesc')">
        <BaseSwitch v-model="inline" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="Eraser" :title="tt('ignoreWhitespace')" :description="tt('ignoreWhitespaceDesc')">
        <BaseSwitch v-model="ignoreWs" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
    </ConfigSection>

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="original" :label="tt('original')" height-class="min-h-[14rem]" />
      <CodeEditor v-model="modified" :label="tt('modified')" height-class="min-h-[14rem]" />
    </div>

    <InfoBar v-if="identical" severity="success" :title="tt('identical')" />

    <div v-if="result.rows.length && !identical" class="overflow-hidden rounded-card border border-line bg-surface">
      <div class="flex items-center gap-3 border-b border-line bg-surface-2/60 px-3 py-1.5 text-xs">
        <span class="font-semibold uppercase tracking-wider text-fg-muted">{{ tt('difference') }}</span>
        <span class="flex-1" />
        <span class="font-mono text-success">+{{ result.added }} {{ tt('added') }}</span>
        <span class="font-mono text-danger">−{{ result.removed }} {{ tt('removed') }}</span>
      </div>
      <div class="overflow-auto max-h-[36rem] font-mono leading-relaxed" :style="{ fontSize: editorFontSize + 'px' }">
        <!-- inline -->
        <table v-if="inline" class="w-full border-collapse">
          <tbody>
            <tr v-for="(row, i) in result.rows" :key="i" :class="rowClass(row.kind)">
              <td class="w-10 select-none border-r border-line px-2 text-right text-fg-faint">{{ row.lno ?? '' }}</td>
              <td class="w-10 select-none border-r border-line px-2 text-right text-fg-faint">{{ row.rno ?? '' }}</td>
              <td class="w-5 select-none px-1 text-center" :class="row.kind === 'add' ? 'text-success' : row.kind === 'del' ? 'text-danger' : 'text-fg-faint'">{{ row.kind === 'add' ? '+' : row.kind === 'del' ? '−' : '' }}</td>
              <td class="whitespace-pre-wrap break-all px-2 text-fg">
                <template v-if="row.parts"><span v-for="(p, j) in row.parts" :key="j" :class="partClass(p.kind)">{{ p.text }}</span></template>
                <template v-else>{{ row.text }}</template>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- side by side -->
        <div v-else class="grid grid-cols-2">
          <table class="w-full border-collapse border-r border-line">
            <tbody>
              <tr v-for="(row, i) in result.left" :key="i" :class="rowClass(row.kind)">
                <td class="w-10 select-none border-r border-line px-2 text-right text-fg-faint">{{ row.lno ?? '' }}</td>
                <td class="whitespace-pre-wrap break-all px-2 text-fg min-h-[1.5em]">
                  <template v-if="row.parts"><span v-for="(p, j) in row.parts" :key="j" :class="partClass(p.kind)">{{ p.text }}</span></template>
                  <template v-else>{{ row.text || ' ' }}</template>
                </td>
              </tr>
            </tbody>
          </table>
          <table class="w-full border-collapse">
            <tbody>
              <tr v-for="(row, i) in result.right" :key="i" :class="rowClass(row.kind)">
                <td class="w-10 select-none border-r border-line px-2 text-right text-fg-faint">{{ row.rno ?? '' }}</td>
                <td class="whitespace-pre-wrap break-all px-2 text-fg">
                  <template v-if="row.parts"><span v-for="(p, j) in row.parts" :key="j" :class="partClass(p.kind)">{{ p.text }}</span></template>
                  <template v-else>{{ row.text || ' ' }}</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
