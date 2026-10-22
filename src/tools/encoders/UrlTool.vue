<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeftRight, Rows3 } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const tt = (k: string) => t(`tools.url.${k}`)

const encode = ref(true)
const multiline = ref(false)
const input = ref('')

function enc(s: string) {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}
function dec(s: string) {
  return decodeURIComponent(s.replace(/\+/g, '%20'))
}

const result = computed<{ output: string; error: string }>(() => {
  const src = input.value
  if (!src) return { output: '', error: '' }
  const fn = encode.value ? enc : dec
  try {
    if (multiline.value) return { output: src.split(/\r?\n/).map(fn).join('\n'), error: '' }
    return { output: fn(src), error: '' }
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
      <SettingCard :icon="Rows3" :title="tt('multiline')" :description="tt('multilineDesc')">
        <BaseSwitch v-model="multiline" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="result.error" severity="error" :title="result.error" />

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" height-class="min-h-[18rem]" :invalid="!!result.error" />
      <CodeEditor :model-value="result.output" :label="t('common.output')" readonly height-class="min-h-[18rem]" filename="url.txt" />
    </div>
  </div>
</template>
