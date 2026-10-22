<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeftRight } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import { useI18n } from '@/i18n'
import { htmlDecode, htmlEncode } from './html'

const { t } = useI18n()
const tt = (k: string) => t(`tools.html.${k}`)

const encode = ref(true)
const input = ref('')

const output = computed(() => {
  if (!input.value) return ''
  return encode.value ? htmlEncode(input.value) : htmlDecode(input.value)
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="ArrowLeftRight" :title="t('common.conversion')" :description="tt('conversionDesc')">
        <BaseSwitch v-model="encode" :on-label="t('common.encode')" :off-label="t('common.decode')" />
      </SettingCard>
    </ConfigSection>

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" height-class="min-h-[18rem]" />
      <CodeEditor :model-value="output" :label="t('common.output')" readonly height-class="min-h-[18rem]" filename="html.txt" />
    </div>
  </div>
</template>
