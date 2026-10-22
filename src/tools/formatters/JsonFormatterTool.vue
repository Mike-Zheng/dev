<script setup lang="ts">
import { computed, ref } from 'vue'
import { IndentIncrease, ArrowDownAZ } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { useIndentOptions, type Indent } from '@/utils/indent'

const { t } = useI18n()
const tt = (k: string) => t(`tools.json-formatter.${k}`)

const indent = ref<Indent>('two')
const indentOptions = useIndentOptions(t)
const sort = ref(false)
const input = ref('')

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(v as Record<string, unknown>).sort((a, b) => a.localeCompare(b))) {
      out[k] = sortKeys((v as Record<string, unknown>)[k])
    }
    return out
  }
  return v
}

const result = computed<{ output: string; error: string }>(() => {
  const src = input.value
  if (!src.trim()) return { output: '', error: '' }
  try {
    let obj: unknown = JSON.parse(src)
    if (sort.value) obj = sortKeys(obj)
    const space = indent.value === 'two' ? 2 : indent.value === 'four' ? 4 : indent.value === 'tab' ? '\t' : undefined
    return { output: JSON.stringify(obj, null, space), error: '' }
  } catch (e) {
    return { output: '', error: `${tt('invalid')}: ${(e as Error).message}` }
  }
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="IndentIncrease" :title="t('common.indentation')" :description="tt('indentationDesc')">
        <BaseSelect v-model="indent" :options="indentOptions" />
      </SettingCard>
      <SettingCard :icon="ArrowDownAZ" :title="tt('sort')" :description="tt('sortDesc')">
        <BaseSwitch v-model="sort" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="result.error" severity="error" :title="result.error" />

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" height-class="min-h-[24rem]" :invalid="!!result.error" accept=".json,.txt" />
      <CodeEditor :model-value="result.output" :label="t('common.output')" readonly height-class="min-h-[24rem]" filename="formatted.json" />
    </div>
  </div>
</template>
