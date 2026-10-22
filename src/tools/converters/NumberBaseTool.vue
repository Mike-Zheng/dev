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

const { t } = useI18n()
const tt = (k: string, p?: Record<string, string>) => t(`tools.number-base.${k}`, p)
const { copy } = useClipboard()

const DEFAULT_DICT = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/'

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

function parseBig(text: string, base: number, dict: string): bigint | null {
  let s = text.replace(/[\s,_]/g, '')
  if (!s) return null
  let neg = false
  if (s.startsWith('-')) {
    neg = true
    s = s.slice(1)
  }
  if (base <= 36) s = s.toUpperCase()
  const digits = dict.slice(0, base)
  let v = 0n
  const B = BigInt(base)
  for (const ch of s) {
    const i = digits.indexOf(ch)
    if (i < 0) return null
    v = v * B + BigInt(i)
  }
  return neg ? -v : v
}

function toBase(v: bigint, base: number, dict: string): string {
  if (v === 0n) return dict[0] ?? '0'
  const neg = v < 0n
  let n = neg ? -v : v
  const B = BigInt(base)
  let out = ''
  while (n > 0n) {
    out = dict[Number(n % B)] + out
    n /= B
  }
  return (neg ? '-' : '') + out
}

function group(s: string, size: number, sep: string): string {
  const neg = s.startsWith('-')
  const body = neg ? s.slice(1) : s
  const parts: string[] = []
  for (let i = body.length; i > 0; i -= size) parts.unshift(body.slice(Math.max(0, i - size), i))
  return (neg ? '-' : '') + parts.join(sep)
}

function formatFor(s: string, base: number): string {
  if (!formatNumber.value) return s
  if (base === 10) return group(s, 3, ',')
  if (base === 16) return group(s, 4, ' ')
  if (base === 8) return group(s, 3, ' ')
  if (base === 2) return group(s, 4, ' ')
  return s
}

const simple = computed<{ rows: { base: number; label: string; value: string }[]; error: string }>(() => {
  const src = input.value.trim()
  if (!src) return { rows: [], error: '' }
  const v = parseBig(src, inputBase.value, DEFAULT_DICT)
  if (v === null) {
    const label = baseOptions.value.find((o) => o.value === inputBase.value)?.label ?? ''
    return { rows: [], error: tt('invalid', { base: label }) }
  }
  const rows = [16, 10, 8, 2].map((b) => ({
    base: b,
    label: baseOptions.value.find((o) => o.value === b)?.label ?? String(b),
    value: formatFor(toBase(v, b, DEFAULT_DICT), b),
  }))
  return { rows, error: '' }
})

const adv = computed<{ value: string; error: string }>(() => {
  const src = input.value.trim()
  if (!src) return { value: '', error: '' }
  if (advInputDict.value.length < 2 || advOutputDict.value.length < 2) return { value: '', error: tt('dictTooSmall') }
  const ib = Math.min(advInputBase.value, advInputDict.value.length)
  const ob = Math.min(advOutputBase.value, advOutputDict.value.length)
  const v = parseBig(src, ib, advInputDict.value)
  if (v === null) return { value: '', error: tt('invalid', { base: String(ib) }) }
  return { value: toBase(v, ob, advOutputDict.value), error: '' }
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
