<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeftRight, IndentIncrease } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { convertJsonYaml } from './jsonYaml'

const { t } = useI18n()
const tt = (k: string) => t(`tools.json-yaml.${k}`)

const jsonToYaml = ref(true)
const indent = ref<2 | 4>(2)
const indentOptions = computed(() => [
  { value: 2 as const, label: t('common.twoSpaces') },
  { value: 4 as const, label: t('common.fourSpaces') },
])
const input = ref('')

const result = computed<{ output: string; error: string }>(() => {
  const r = convertJsonYaml(input.value, jsonToYaml.value, indent.value)
  return { output: r.output, error: r.error ? tt(r.error) : '' }
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="ArrowLeftRight" :title="t('common.conversion')" :description="tt('conversionDesc')">
        <BaseSwitch v-model="jsonToYaml" :on-label="tt('jsonToYaml')" :off-label="tt('yamlToJson')" />
      </SettingCard>
      <SettingCard :icon="IndentIncrease" :title="t('common.indentation')" :description="tt('indentationDesc')">
        <BaseSelect v-model="indent" :options="indentOptions" />
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="result.error" severity="error" :title="result.error" />

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" height-class="min-h-[22rem]" :invalid="!!result.error" accept=".json,.yaml,.yml,.txt" />
      <CodeEditor :model-value="result.output" :label="t('common.output')" readonly height-class="min-h-[22rem]" :filename="jsonToYaml ? 'output.yaml' : 'output.json'" />
    </div>
  </div>
</template>
