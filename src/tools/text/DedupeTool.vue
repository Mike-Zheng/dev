<script setup lang="ts">
import { computed, ref } from 'vue'
import { CaseSensitive, Filter, Scissors, Eraser } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import { useI18n } from '@/i18n'
import { dedupeLines, type DedupeMode } from './dedupe'

const { t } = useI18n()
const tt = (k: string) => t(`tools.dedupe.${k}`)

const mode = ref<DedupeMode>('unique')
const caseSensitive = ref(true)
const trim = ref(true)
const removeEmpty = ref(true)
const input = ref('')

const modeOptions = computed<{ value: DedupeMode; label: string }[]>(() => [
  { value: 'unique', label: tt('modeUnique') },
  { value: 'singles', label: tt('modeSingles') },
  { value: 'duplicates', label: tt('modeDuplicates') },
])

const result = computed(() =>
  dedupeLines(input.value, { mode: mode.value, caseSensitive: caseSensitive.value, trim: trim.value, removeEmpty: removeEmpty.value }),
)
const output = computed(() => result.value.lines.join('\n'))
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Filter" :title="t('common.mode')" :description="tt('modeDesc')">
        <BaseSelect v-model="mode" :options="modeOptions" />
      </SettingCard>
      <SettingCard :icon="CaseSensitive" :title="tt('caseSensitive')">
        <BaseSwitch v-model="caseSensitive" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="Scissors" :title="tt('trim')" :description="tt('trimDesc')">
        <BaseSwitch v-model="trim" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="Eraser" :title="tt('removeEmpty')">
        <BaseSwitch v-model="removeEmpty" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
    </ConfigSection>

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" height-class="min-h-[18rem]" />
      <CodeEditor :model-value="output" :label="t('common.output')" readonly height-class="min-h-[18rem]" filename="dedupe.txt">
        <template #footer>
          <span>{{ t('tools.dedupe.summary', { kept: result.lines.length, removed: result.removed }) }}</span>
        </template>
      </CodeEditor>
    </div>
  </div>
</template>
