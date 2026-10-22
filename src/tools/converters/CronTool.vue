<script setup lang="ts">
import { computed, ref } from 'vue'
import { CronExpressionParser } from 'cron-parser'
import cronstrue from 'cronstrue'
import 'cronstrue/locales/zh_TW'
import { Clock, Hash, CalendarRange } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import NumberInput from '@/components/ui/NumberInput.vue'
import TextInput from '@/components/ui/TextInput.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { formatDate, isValidFormat } from '@/utils/dateFormat'

const { t, isZh } = useI18n()
const tt = (k: string) => t(`tools.cron.${k}`)

const useSeconds = ref(false)
const count = ref(5)
const format = ref('yyyy-MM-dd ddd HH:mm:ss')
const expression = ref('* * * * *')

const result = computed<{ description: string; dates: string; error: string }>(() => {
  const expr = expression.value.trim()
  if (!expr) return { description: '', dates: '', error: '' }
  if (!isValidFormat(format.value)) return { description: '', dates: '', error: tt('formatInvalid') }
  const parts = expr.split(/\s+/)
  const expectedParts = useSeconds.value ? 6 : 5
  if (parts.length !== expectedParts) return { description: '', dates: '', error: tt('invalid') }
  try {
    const description = cronstrue.toString(expr, { locale: isZh.value ? 'zh_TW' : 'en', use24HourTimeFormat: true })
    const it = CronExpressionParser.parse(expr)
    const lines: string[] = []
    for (let i = 0; i < count.value; i++) {
      lines.push(formatDate(it.next().toDate(), format.value, isZh.value ? 'zh-TW' : 'en-US'))
    }
    return { description, dates: lines.join('\n'), error: '' }
  } catch {
    return { description: '', dates: '', error: tt('invalid') }
  }
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Clock" :title="tt('useSeconds')" :description="tt('useSecondsDesc')">
        <BaseSwitch v-model="useSeconds" :on-label="t('common.yes')" :off-label="t('common.no')" />
      </SettingCard>
      <SettingCard :icon="Hash" :title="tt('outputCount')" :description="tt('outputCountDesc')">
        <NumberInput v-model="count" :min="1" :max="100" />
      </SettingCard>
      <SettingCard :icon="CalendarRange" :title="tt('outputFormat')" :description="tt('outputFormatDesc')">
        <div class="w-56"><TextInput v-model="format" mono /></div>
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="result.error" severity="error" :title="result.error" />

    <div class="space-y-4">
      <div class="space-y-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('input') }}</label>
        <TextInput v-model="expression" mono :placeholder="useSeconds ? '0 */5 * * * *' : '*/5 * * * *'" :invalid="!!result.error" />
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('cronDescription') }}</label>
        <div class="rounded-lg border border-line bg-surface px-3 py-2 text-sm min-h-[2.5rem]" :class="result.description ? 'text-fg' : 'text-fg-faint'">
          {{ result.description || '—' }}
        </div>
      </div>
      <CodeEditor :model-value="result.dates" :label="tt('schedule')" readonly height-class="min-h-[12rem]" filename="cron-schedule.txt" />
    </div>
  </div>
</template>
