<script setup lang="ts">
import { computed, ref } from 'vue'
import { diffLines, diffWordsWithSpace } from 'diff'
import { Rows3, Eraser } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { useSettings } from '@/composables/useSettings'

const { t } = useI18n()
const tt = (k: string) => t(`tools.text-compare.${k}`)
const { editorFontSize } = useSettings()

const inline = ref(true)
const ignoreWs = ref(false)
const original = ref('')
const modified = ref('')

type Kind = 'same' | 'add' | 'del'
interface Line {
  kind: Kind
  text: string
  lno?: number
  rno?: number
  parts?: { text: string; kind: Kind }[]
}

const result = computed(() => {
  const a = original.value
  const b = modified.value
  if (!a && !b) return { rows: [] as Line[], left: [] as Line[], right: [] as Line[], added: 0, removed: 0 }
  const changes = diffLines(a, b, { ignoreWhitespace: ignoreWs.value })
  const rows: Line[] = []
  let l = 1
  let r = 1
  let added = 0
  let removed = 0
  const splitLines = (s: string) => {
    const arr = s.split('\n')
    if (arr[arr.length - 1] === '') arr.pop()
    return arr
  }
  for (let i = 0; i < changes.length; i++) {
    const c = changes[i]!
    const next = changes[i + 1]
    if (c.removed && next?.added) {
      const dl = splitLines(c.value)
      const al = splitLines(next.value)
      const n = Math.max(dl.length, al.length)
      for (let k = 0; k < n; k++) {
        const d = dl[k]
        const ad = al[k]
        if (d !== undefined && ad !== undefined) {
          const wd = diffWordsWithSpace(d, ad)
          rows.push({ kind: 'del', text: d, lno: l++, parts: wd.filter((p) => !p.added).map((p) => ({ text: p.value, kind: p.removed ? 'del' : 'same' })) })
          rows.push({ kind: 'add', text: ad, rno: r++, parts: wd.filter((p) => !p.removed).map((p) => ({ text: p.value, kind: p.added ? 'add' : 'same' })) })
        } else if (d !== undefined) rows.push({ kind: 'del', text: d, lno: l++ })
        else if (ad !== undefined) rows.push({ kind: 'add', text: ad, rno: r++ })
      }
      removed += dl.length
      added += al.length
      i++
      continue
    }
    for (const line of splitLines(c.value)) {
      if (c.added) {
        rows.push({ kind: 'add', text: line, rno: r++ })
        added++
      } else if (c.removed) {
        rows.push({ kind: 'del', text: line, lno: l++ })
        removed++
      } else rows.push({ kind: 'same', text: line, lno: l++, rno: r++ })
    }
  }
  // side-by-side pairing
  const left: Line[] = []
  const right: Line[] = []
  let i = 0
  while (i < rows.length) {
    const row = rows[i]!
    if (row.kind === 'same') {
      left.push(row)
      right.push(row)
      i++
      continue
    }
    const dels: Line[] = []
    const adds: Line[] = []
    while (i < rows.length && rows[i]!.kind !== 'same') {
      if (rows[i]!.kind === 'del') dels.push(rows[i]!)
      else adds.push(rows[i]!)
      i++
    }
    const n = Math.max(dels.length, adds.length)
    for (let k = 0; k < n; k++) {
      left.push(dels[k] ?? { kind: 'same', text: '' })
      right.push(adds[k] ?? { kind: 'same', text: '' })
    }
  }
  return { rows, left, right, added, removed }
})

const identical = computed(() => (original.value || modified.value) && result.value.added === 0 && result.value.removed === 0)

function rowClass(k: Kind) {
  return k === 'add' ? 'bg-success-soft' : k === 'del' ? 'bg-danger-soft' : ''
}
function partClass(k: Kind) {
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
