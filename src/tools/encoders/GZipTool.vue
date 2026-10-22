<script setup lang="ts">
import { computed, ref } from 'vue'
import { FileArchive } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { compressText, decompressText } from './gzip'

const { t } = useI18n()
const tt = (k: string) => t(`tools.gzip.${k}`)

const compress = ref(true)
const input = ref('')

const result = computed<{ output: string; error: string; ratio: number | null }>(() => {
  const src = input.value
  if (!src) return { output: '', error: '', ratio: null }
  try {
    const { output, ratio } = compress.value ? compressText(src) : decompressText(src)
    return { output, error: '', ratio }
  } catch {
    return { output: '', error: tt('invalid'), ratio: null }
  }
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="FileArchive" :title="tt('mode')" :description="tt('modeDesc')">
        <BaseSwitch v-model="compress" :on-label="tt('compress')" :off-label="tt('decompress')" />
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="result.error" severity="error" :title="result.error" />

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" height-class="min-h-[18rem]" :invalid="!!result.error" />
      <CodeEditor :model-value="result.output" :label="t('common.output')" readonly height-class="min-h-[18rem]" filename="gzip.txt">
        <template #footer>
          <span v-if="result.ratio !== null">{{ tt('ratio') }}: {{ result.ratio.toFixed(1) }} %</span>
        </template>
      </CodeEditor>
    </div>
  </div>
</template>
