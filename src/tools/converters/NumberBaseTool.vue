<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy, Hash, SlidersHorizontal, WandSparkles } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import NumberInput from '@/components/ui/NumberInput.vue'
import TextInput from '@/components/ui/TextInput.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import { useClipboard } from '@/composables/useClipboard'
import { DEFAULT_DICT, convertAdvanced, convertSimple } from './numberBase'

const { t } = useI18n()
const tt = (k: string, p?: Record<string, string>) => t(`tools.number-base.${k}`, p)
const { copy } = useClipboard()

const formatNumber = ref(true)
const advanced = ref(false)
const input = ref('')
const inputBase = ref<2 | 8 | 10 | 16>(10)
const baseOptions = computed(() => [
  { value: 2 as const, label: tt('binary') },
  { value: 8 as const, label: tt('octal') },
  { value: 10 as const, label: tt('decimal') },
  { value: 16 as const, label: tt('hexadecimal') },
])

// Advanced
const advInputBase = ref(10)
const advOutputBase = ref(16)
const advInputDict = ref(DEFAULT_DICT)
const advOutputDict = ref(DEFAULT_DICT)

const simple = computed<{ rows: { base: number; label: string; value: string }[]; error: string }>(() => {
  const r = convertSimple(input.value, inputBase.value, formatNumber.value)
  if (r.error) {
    const label = baseOptions.value.find((o) => o.value === inputBase.value)?.label ?? ''
    return { rows: [], error: tt(r.error, { base: label }) }
  }
  const rows = r.rows.map((row) => ({
    base: row.base,
    label: baseOptions.value.find((o) => o.value === row.base)?.label ?? String(row.base),
    value: row.value,
  }))
  return { rows, error: '' }
})

const adv = computed<{ value: string; error: string }>(() => {
  const r = convertAdvanced(input.value, advInputBase.value, advOutputBase.value, advInputDict.value, advOutputDict.value)
  return { value: r.value, error: r.error ? tt(r.error, { base: String(r.inputBase) }) : '' }
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="SlidersHorizontal" :title="tt('formatNumber')" :description="tt('formatNumberDesc')">
        <BaseSwitch v-model="formatNumber" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <SettingCard :icon="WandSparkles" :title="tt('advanced')" :description="tt('advancedDesc')">
        <BaseSwitch v-model="advanced" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
      <template v-if="!advanced">
        <SettingCard :icon="Hash" :title="tt('inputBase')">
          <BaseSelect v-model="inputBase" :options="baseOptions" />
        </SettingCard>
      </template>
      <template v-else>
        <SettingCard :icon="Hash" :title="tt('inputBase')" stacked>
          <NumberInput v-model="advInputBase" :min="2" :max="64" />
          <template #content>
            <label class="block text-xs text-fg-muted mb-1">{{ tt('inputDictionary') }}</label>
            <TextInput v-model="advInputDict" mono />
          </template>
        </SettingCard>
        <SettingCard :icon="Hash" :title="tt('outputBase')" stacked>
          <NumberInput v-model="advOutputBase" :min="2" :max="64" />
          <template #content>
            <label class="block text-xs text-fg-muted mb-1">{{ tt('outputDictionary') }}</label>
            <TextInput v-model="advOutputDict" mono />
          </template>
        </SettingCard>
      </template>
    </ConfigSection>

    <InfoBar v-if="advanced ? adv.error : simple.error" severity="error" :title="advanced ? adv.error : simple.error" />

    <div class="space-y-4">
      <div class="space-y-1.5">
        <label class="text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ t('common.input') }}</label>
        <TextInput v-model="input" mono :invalid="!!(advanced ? adv.error : simple.error)" placeholder="255" />
      </div>

      <div v-if="!advanced" class="divide-y divide-line rounded-card border border-line bg-surface">
        <div v-for="r in simple.rows.length ? simple.rows : [16, 10, 8, 2].map((b) => ({ base: b, label: baseOptions.find((o) => o.value === b)?.label ?? '', value: '' }))" :key="r.base" class="flex items-center gap-3 px-4 py-2.5">
          <div class="min-w-0 flex-1">
            <div class="text-[11px] uppercase tracking-wider text-fg-faint">{{ r.label }}</div>
            <div class="font-mono text-sm text-fg break-all min-h-[1.25rem]">{{ r.value }}</div>
          </div>
          <IconButton size="sm" :title="t('common.copy')" :disabled="!r.value" @click="copy(r.value)"><Copy class="h-4 w-4" /></IconButton>
        </div>
      </div>

      <div v-else class="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-2.5">
        <div class="min-w-0 flex-1">
          <div class="text-[11px] uppercase tracking-wider text-fg-faint">{{ t('common.output') }}</div>
          <div class="font-mono text-sm text-fg break-all min-h-[1.25rem]">{{ adv.value }}</div>
        </div>
        <IconButton size="sm" :title="t('common.copy')" :disabled="!adv.value" @click="copy(adv.value)"><Copy class="h-4 w-4" /></IconButton>
      </div>
    </div>
  </div>
</template>
