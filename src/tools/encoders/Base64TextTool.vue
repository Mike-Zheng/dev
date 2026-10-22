<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeftRight, Languages, Link2 } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { decodeText, encodeText, type TextEncoding } from './base64Text'

const { t } = useI18n()
const tt = (k: string) => t(`tools.base64-text.${k}`)

const encode = ref(true)
const encoding = ref<TextEncoding>('utf8')
const urlSafe = ref(false)
const input = ref('')

const encodingOptions = [
  { value: 'utf8' as const, label: 'UTF-8' },
  { value: 'ascii' as const, label: 'ASCII' },
]

const result = computed<{ output: string; error: string }>(() => {
  const src = input.value
  if (!src) return { output: '', error: '' }
  try {
    const output = encode.value ? encodeText(src, encoding.value, urlSafe.value) : decodeText(src, encoding.value)
    return { output, error: '' }
  } catch {
    return { output: '', error: tt('invalid') }
  }
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="ArrowLeftRight" :title="t('common.conversion')" :description="tt('conversionDesc')">
        <BaseSwitch v-model="encode" :on-label="t('common.encode')" :off-label="t('common.decode')" />
      </SettingCard>
      <SettingCard :icon="Languages" :title="tt('encoding')" :description="tt('encodingDesc')">
        <BaseSelect v-model="encoding" :options="encodingOptions" />
      </SettingCard>
      <SettingCard :icon="Link2" :title="tt('urlSafe')" :description="tt('urlSafeDesc')">
        <BaseSwitch v-model="urlSafe" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="result.error" severity="error" :title="result.error" />

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" height-class="min-h-[18rem]" :invalid="!!result.error" />
      <CodeEditor :model-value="result.output" :label="t('common.output')" readonly height-class="min-h-[18rem]" filename="base64.txt" />
    </div>
  </div>
</template>
