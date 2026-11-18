<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDownWideNarrow, CaseSensitive, Copy, Eraser } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import { useClipboard } from '@/composables/useClipboard'
import { countLines, formatCounts, type LineCountSort } from './lineCount'

const { t } = useI18n()
const tt = (k: string) => t(`tools.line-count.${k}`)
const { copy } = useClipboard()

const sort = ref<LineCountSort>('count')
const caseSensitive = ref(true)
const ignoreEmpty = ref(true)
const input = ref('')

const sortOptions = computed<{ value: LineCountSort; label: string }[]>(() => [
  { value: 'count', label: tt('sortCount') },
  { value: 'first', label: tt('sortFirst') },
  { value: 'alpha', label: tt('sortAlpha') },
])

const result = computed(() =>
  countLines(input.value, { sort: sort.value, caseSensitive: caseSensitive.value, ignoreEmpty: ignoreEmpty.value }),
)
const percent = (n: number) => `${((n / result.value.total) * 100).toFixed(1)}%`
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="ArrowDownWideNarrow" :title="tt('sort')" :description="tt('sortDesc')">
        <BaseSelect v-model="sort" :options="sortOptions" />
      </SettingCard>
      <SettingCard :icon="CaseSensitive" :title="tt('caseSensitive')">
        <BaseSwitch v-model="caseSensitive" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="Eraser" :title="tt('ignoreEmpty')">
        <BaseSwitch v-model="ignoreEmpty" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
    </ConfigSection>

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" :placeholder="tt('placeholder')" height-class="min-h-[18rem]" />

      <div class="flex flex-col overflow-hidden rounded-card border border-line bg-surface">
        <div class="flex min-h-[38px] items-center gap-1 border-b border-line bg-surface-2/60 px-2 py-1.5">
          <span class="truncate px-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ t('common.result') }}</span>
          <span class="flex-1" />
          <IconButton size="sm" :title="tt('copyTsv')" :disabled="!result.entries.length" @click="copy(formatCounts(result.entries))">
            <Copy class="h-4 w-4" />
          </IconButton>
        </div>
        <div class="max-h-[32rem] min-h-[18rem] flex-1 overflow-auto">
          <table v-if="result.entries.length" class="w-full text-sm">
            <thead class="sticky top-0 bg-surface text-xs text-fg-muted">
              <tr class="border-b border-line">
                <th class="px-3 py-1.5 text-left font-semibold">{{ tt('value') }}</th>
                <th class="w-20 px-3 py-1.5 text-right font-semibold">{{ tt('count') }}</th>
                <th class="w-20 px-3 py-1.5 text-right font-semibold">%</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line font-mono">
              <tr v-for="e in result.entries" :key="e.value">
                <td class="break-all px-3 py-1 text-fg">
                  <span v-if="e.value">{{ e.value }}</span><span v-else class="font-sans italic text-fg-faint">{{ tt('emptyLine') }}</span>
                </td>
                <td class="px-3 py-1 text-right text-fg">{{ e.count }}</td>
                <td class="px-3 py-1 text-right text-fg-muted">{{ percent(e.count) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="px-4 py-6 text-center text-sm text-fg-faint">{{ tt('empty') }}</p>
        </div>
        <div class="border-t border-line px-3 py-1 font-mono text-[11px] text-fg-faint">
          {{ t('tools.line-count.summary', { distinct: result.entries.length, total: result.total }) }}
        </div>
      </div>
    </div>
  </div>
</template>
