<script setup lang="ts">
import { computed, ref } from 'vue'
import { IndentIncrease, FoldVertical } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { useIndentOptions, type Indent } from '@/utils/indent'
import { formatXml } from './xmlFormatter'

const { t } = useI18n()
const tt = (k: string) => t(`tools.xml-formatter.${k}`)

const indent = ref<Indent>('two')
const indentOptions = useIndentOptions(t)
const collapse = ref(true)
const input = ref('')

const result = computed<{ output: string; error: string }>(() => {
  const r = formatXml(input.value, indent.value, collapse.value)
  return r.error ? { output: '', error: `${tt('invalid')}: ${r.error}` } : r
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="IndentIncrease" :title="t('common.indentation')" :description="tt('indentationDesc')">
        <BaseSelect v-model="indent" :options="indentOptions" />
      </SettingCard>
      <SettingCard :icon="FoldVertical" :title="tt('collapse')" :description="tt('collapseDesc')">
        <BaseSwitch v-model="collapse" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="result.error" severity="error" :title="result.error" />

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" height-class="min-h-[24rem]" :invalid="!!result.error" accept=".xml,.xsd,.svg,.txt" />
      <CodeEditor :model-value="result.output" :label="t('common.output')" readonly height-class="min-h-[24rem]" filename="formatted.xml" />
    </div>
  </div>
</template>
