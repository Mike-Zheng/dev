<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy, Download, Table2 } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import { useClipboard } from '@/composables/useClipboard'
import { downloadText } from '@/composables/useFiles'

const { t } = useI18n()
const tt = (k: string) => t(`tools.json-table.${k}`)
const { copy } = useClipboard()

type Fmt = 'csv' | 'tsv' | 'fsv'
const format = ref<Fmt>('csv')
const formatOptions = computed(() => [
  { value: 'csv' as Fmt, label: tt('csv') },
  { value: 'tsv' as Fmt, label: tt('tsv') },
  { value: 'fsv' as Fmt, label: tt('fsv') },
])

const input = ref('')

interface TableData {
  columns: string[]
  rows: string[][]
}

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

const table = computed<{ data: TableData | null; error: string }>(() => {
  const src = input.value.trim()
  if (!src) return { data: null, error: '' }
  try {
    const parsed: unknown = JSON.parse(src)
    if (!Array.isArray(parsed) || parsed.length === 0) return { data: null, error: tt('invalid') }
    const columns: string[] = []
    const objects: Record<string, unknown>[] = parsed.map((item: unknown) =>
      item && typeof item === 'object' && !Array.isArray(item) ? (item as Record<string, unknown>) : { value: item },
    )
    for (const obj of objects) for (const k of Object.keys(obj)) if (!columns.includes(k)) columns.push(k)
    const rows = objects.map((obj) => columns.map((c) => cellToString(obj[c])))
    return { data: { columns, rows }, error: '' }
  } catch {
    return { data: null, error: tt('invalid') }
  }
})

function escapeCell(v: string, sep: string): string {
  if (v.includes(sep) || v.includes('"') || v.includes('\n') || v.includes('\r')) return `"${v.replace(/"/g, '""')}"`
  return v
}

const serialized = computed(() => {
  const d = table.value.data
  if (!d) return ''
  const sep = format.value === 'csv' ? ',' : format.value === 'tsv' ? '\t' : ';'
  const lines = [d.columns.map((c) => escapeCell(c, sep)).join(sep), ...d.rows.map((r) => r.map((c) => escapeCell(c, sep)).join(sep))]
  return lines.join('\n')
})

function save() {
  const ext = format.value === 'tsv' ? 'tsv' : 'csv'
  downloadText(serialized.value, `table.${ext}`, format.value === 'tsv' ? 'text/tab-separated-values' : 'text/csv')
}
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Table2" :title="tt('format')" :description="tt('formatDesc')">
        <BaseSelect v-model="format" :options="formatOptions" />
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="table.error" severity="error" :title="table.error" />

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" height-class="min-h-[22rem]" :invalid="!!table.error" accept=".json" placeholder='[{"id": 1, "name": "Ada"}, {"id": 2, "name": "Linus"}]' />

      <div class="flex flex-col rounded-card border border-line bg-surface overflow-hidden">
        <div class="flex items-center gap-1 border-b border-line bg-surface-2/60 px-2 py-1.5 min-h-[38px]">
          <span class="px-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ t('common.output') }}</span>
          <span class="flex-1" />
          <IconButton size="sm" :title="tt('copyAs')" :disabled="!serialized" @click="copy(serialized)"><Copy class="h-4 w-4" /></IconButton>
          <IconButton size="sm" :title="tt('saveAs')" :disabled="!serialized" @click="save"><Download class="h-4 w-4" /></IconButton>
        </div>
        <div class="flex-1 overflow-auto min-h-[18rem] max-h-[40rem]">
          <table v-if="table.data" class="min-w-full text-sm">
            <thead class="sticky top-0 bg-surface-2 text-left text-xs text-fg-muted">
              <tr>
                <th v-for="c in table.data.columns" :key="c" class="whitespace-nowrap border-b border-line px-3 py-2 font-medium">{{ c }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in table.data.rows" :key="i" class="border-b border-line last:border-0 hover:bg-surface-2/50">
                <td v-for="(c, j) in r" :key="j" class="whitespace-nowrap px-3 py-1.5 font-mono text-xs text-fg">{{ c }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="table.data" class="border-t border-line px-3 py-1 text-[11px] text-fg-faint font-mono">
          {{ table.data.rows.length }} {{ tt('rows') }} · {{ table.data.columns.length }} {{ tt('columns') }}
        </div>
      </div>
    </div>
  </div>
</template>
