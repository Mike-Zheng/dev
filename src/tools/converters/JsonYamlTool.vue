<script setup lang="ts">
import { computed, ref } from 'vue'
import yaml from 'js-yaml'
import { ArrowLeftRight, IndentIncrease } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'

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
  const src = input.value
  if (!src.trim()) return { output: '', error: '' }
  if (jsonToYaml.value) {
    try {
      const obj: unknown = JSON.parse(src)
      return { output: yaml.dump(obj, { indent: indent.value, lineWidth: -1, noRefs: true }), error: '' }
    } catch {
      return { output: '', error: tt('invalidJson') }
    }
  }
  try {
    const obj: unknown = yaml.load(src)
    return { output: JSON.stringify(obj, null, indent.value), error: '' }
  } catch {
    return { output: '', error: tt('invalidYaml') }
  }
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
