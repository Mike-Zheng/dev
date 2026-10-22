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
import { bytesToBase64, base64ToBytes } from '@/utils/base64'

const { t } = useI18n()
const tt = (k: string) => t(`tools.base64-text.${k}`)

const encode = ref(true)
const encoding = ref<'utf8' | 'ascii'>('utf8')
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
    if (encode.value) {
      const bytes =
        encoding.value === 'utf8'
          ? new TextEncoder().encode(src)
          : Uint8Array.from(src, (c) => c.charCodeAt(0) & 0x7f)
      return { output: bytesToBase64(bytes, urlSafe.value), error: '' }
    }
    const bytes = base64ToBytes(src)
    const text = encoding.value === 'utf8' ? new TextDecoder('utf-8', { fatal: false }).decode(bytes) : String.fromCharCode(...bytes)
    return { output: text, error: '' }
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
