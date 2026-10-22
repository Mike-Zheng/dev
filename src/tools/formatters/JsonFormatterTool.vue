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
import { formatJson } from './jsonFormatter'

const { t } = useI18n()
const tt = (k: string) => t(`tools.json-formatter.${k}`)

const indent = ref<Indent>('two')
const indentOptions = useIndentOptions(t)
const sort = ref(false)
const input = ref('')

const result = computed<{ output: string; error: string }>(() => {
  const r = formatJson(input.value, indent.value, sort.value)
  return r.error ? { output: '', error: `${tt('invalid')}: ${r.error}` } : r
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
