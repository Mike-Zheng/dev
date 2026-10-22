<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeftRight } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { escapeText, unescapeText } from './escapeUnescape'

const { t } = useI18n()
const tt = (k: string) => t(`tools.escape.${k}`)

const escapeMode = ref(true)
const input = ref('')

const result = computed<{ output: string; error: string }>(() => {
  const src = input.value
  if (!src) return { output: '', error: '' }
  try {
    return { output: escapeMode.value ? escapeText(src) : unescapeText(src), error: '' }
  } catch (e) {
    return { output: '', error: `${tt('invalid')}: ${(e as Error).message}` }
  }
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="ArrowLeftRight" :title="t('common.conversion')" :description="tt('conversionDesc')">
        <BaseSwitch v-model="escapeMode" :on-label="tt('escape')" :off-label="tt('unescape')" />
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="result.error" severity="error" :title="result.error" />

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" height-class="min-h-[18rem]" :invalid="!!result.error" />
      <CodeEditor :model-value="result.output" :label="t('common.output')" readonly height-class="min-h-[18rem]" filename="escaped.txt" />
    </div>
  </div>
</template>
