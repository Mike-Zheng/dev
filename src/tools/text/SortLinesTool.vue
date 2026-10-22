<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDownAZ, ArrowUpDown, CaseSensitive, Eraser, Scissors, Shuffle } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import { useI18n } from '@/i18n'
import { sortLines, type SortMode } from './sortLines'

const { t, locale } = useI18n()
const tt = (k: string) => t(`tools.sort-lines.${k}`)

const mode = ref<SortMode>('alpha')
const descending = ref(false)
const caseSensitive = ref(false)
const trim = ref(false)
const removeEmpty = ref(true)
const input = ref('')
/** Bumped by the "shuffle again" button so the random order is recomputed. */
const shuffleSeq = ref(0)

const modeOptions = computed<{ value: SortMode; label: string }[]>(() => [
  { value: 'alpha', label: tt('modeAlpha') },
  { value: 'natural', label: tt('modeNatural') },
  { value: 'numeric', label: tt('modeNumeric') },
  { value: 'length', label: tt('modeLength') },
  { value: 'reverse', label: tt('modeReverse') },
  { value: 'random', label: tt('modeRandom') },
])

const hasDirection = computed(() => mode.value !== 'reverse' && mode.value !== 'random')

const output = computed(() => {
  void shuffleSeq.value
  return sortLines(input.value, {
    mode: mode.value,
    descending: descending.value,
    caseSensitive: caseSensitive.value,
    trim: trim.value,
    removeEmpty: removeEmpty.value,
    locale: locale.value,
  }).join('\n')
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="ArrowDownAZ" :title="t('common.mode')" :description="tt('modeDesc')">
        <BaseButton v-if="mode === 'random'" size="sm" @click="shuffleSeq++"><Shuffle class="h-4 w-4" />{{ tt('shuffle') }}</BaseButton>
        <BaseSelect v-model="mode" :options="modeOptions" />
      </SettingCard>
      <SettingCard v-if="hasDirection" :icon="ArrowUpDown" :title="tt('descending')">
        <BaseSwitch v-model="descending" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard v-if="hasDirection" :icon="CaseSensitive" :title="tt('caseSensitive')">
        <BaseSwitch v-model="caseSensitive" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="Scissors" :title="tt('trim')">
        <BaseSwitch v-model="trim" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="Eraser" :title="tt('removeEmpty')">
        <BaseSwitch v-model="removeEmpty" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
    </ConfigSection>

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="input" :label="t('common.input')" height-class="min-h-[18rem]" />
      <CodeEditor :model-value="output" :label="t('common.output')" readonly height-class="min-h-[18rem]" filename="sorted.txt" />
    </div>
  </div>
</template>
