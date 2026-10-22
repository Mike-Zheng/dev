<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Globe, SlidersHorizontal, Clock } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import TextInput from '@/components/ui/TextInput.vue'
import NumberInput from '@/components/ui/NumberInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { Copy } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useClipboard } from '@/composables/useClipboard'

const { t } = useI18n()
const tt = (k: string) => t(`tools.date.${k}`)
const { copy } = useClipboard()

type Fmt = 'seconds' | 'milliseconds' | 'ticks'
const EPOCH_TICKS = 621355968000000000n

const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const tzList = (() => {
  try {
    return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone')
  } catch {
    return ['UTC', localTz]
  }
})()
const tzOptions = ['UTC', ...tzList.filter((z) => z !== 'UTC')].map((z) => ({ value: z, label: z }))

const timeZone = ref(localTz)
const format = ref<Fmt>('seconds')
const formatOptions: { value: Fmt; label: string }[] = [
  { value: 'seconds', label: tt('seconds') },
  { value: 'milliseconds', label: tt('milliseconds') },
  { value: 'ticks', label: tt('ticks') },
]

/** The single source of truth: instant in ms since epoch. */
const instant = ref<number>(Date.now())
const timestampText = ref('')
const error = ref('')

function toTimestampText(ms: number, f: Fmt): string {
  if (f === 'seconds') return String(Math.floor(ms / 1000))
  if (f === 'milliseconds') return String(Math.floor(ms))
  return (BigInt(Math.floor(ms)) * 10000n + EPOCH_TICKS).toString()
}
function fromTimestampText(s: string, f: Fmt): number | null {
  const v = s.trim()
  if (!/^-?\d+$/.test(v)) return null
  if (f === 'seconds') return Number(v) * 1000
  if (f === 'milliseconds') return Number(v)
  const ticks = BigInt(v)
  return Number((ticks - EPOCH_TICKS) / 10000n)
}

/* ---- Time zone helpers ---- */
function partsIn(ms: number, tz: string) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const p: Record<string, number> = {}
  for (const part of dtf.formatToParts(new Date(ms))) {
    if (part.type !== 'literal') p[part.type] = Number(part.value)
  }
  return { year: p.year ?? 1970, month: p.month ?? 1, day: p.day ?? 1, hour: p.hour === 24 ? 0 : (p.hour ?? 0), minute: p.minute ?? 0, second: p.second ?? 0, ms: ((ms % 1000) + 1000) % 1000 }
}
function offsetMinutes(ms: number, tz: string): number {
  const p = partsIn(ms, tz)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second, p.ms)
  return Math.round((asUtc - ms) / 60000)
}
function instantFromParts(p: { year: number; month: number; day: number; hour: number; minute: number; second: number; ms: number }, tz: string): number {
  const naive = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second, p.ms)
  let guess = naive - offsetMinutes(naive, tz) * 60000
  guess = naive - offsetMinutes(guess, tz) * 60000
  return guess
}
function fmtOffset(min: number): string {
  const sign = min >= 0 ? '+' : '-'
  const a = Math.abs(min)
  return `${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`
}

/* ---- Fields (editable) ---- */
const fields = ref(partsIn(instant.value, timeZone.value))
let syncing = false

function syncFromInstant() {
  syncing = true
  fields.value = partsIn(instant.value, timeZone.value)
  timestampText.value = toTimestampText(instant.value, format.value)
  syncing = false
}
syncFromInstant()

watch([timeZone, format], syncFromInstant)

watch(timestampText, (v) => {
  if (syncing) return
  const ms = fromTimestampText(v, format.value)
  if (ms === null || !Number.isFinite(ms) || Number.isNaN(new Date(ms).getTime())) {
    error.value = tt('invalid')
    return
  }
  error.value = ''
  instant.value = ms
  syncing = true
  fields.value = partsIn(ms, timeZone.value)
  syncing = false
})

watch(
  fields,
  (p) => {
    if (syncing) return
    const ms = instantFromParts(p, timeZone.value)
    if (Number.isNaN(ms)) return
    error.value = ''
    instant.value = ms
    syncing = true
    timestampText.value = toTimestampText(ms, format.value)
    syncing = false
  },
  { deep: true },
)

function setNow() {
  instant.value = Date.now()
  syncFromInstant()
  error.value = ''
}

/* ---- Outputs ---- */
const outputs = computed(() => {
  const ms = instant.value
  const d = new Date(ms)
  const off = offsetMinutes(ms, timeZone.value)
  const p = partsIn(ms, timeZone.value)
  const iso = `${String(p.year).padStart(4, '0')}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}T${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}:${String(p.second).padStart(2, '0')}.${String(p.ms).padStart(3, '0')}${fmtOffset(off)}`
  const jan = offsetMinutes(Date.UTC(p.year, 0, 1), timeZone.value)
  const jul = offsetMinutes(Date.UTC(p.year, 6, 1), timeZone.value)
  return [
    { key: 'iso', label: tt('iso'), value: iso },
    { key: 'utc', label: tt('utc'), value: d.toISOString().replace('T', ' ').replace('Z', ' UTC') },
    { key: 'local', label: tt('local'), value: d.toLocaleString(undefined, { timeZone: timeZone.value, dateStyle: 'full', timeStyle: 'long' }) },
    { key: 'offset', label: tt('offset'), value: `UTC${fmtOffset(off)}` },
    { key: 'dst', label: tt('dst'), value: jan !== jul ? tt('dstYes') : tt('dstNo') },
    { key: 'ticks', label: tt('ticks'), value: toTimestampText(ms, 'ticks') },
  ]
})
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Globe" :title="tt('timeZone')">
        <BaseSelect v-model="timeZone" :options="tzOptions" />
      </SettingCard>
      <SettingCard :icon="SlidersHorizontal" :title="tt('format')">
        <BaseSelect v-model="format" :options="formatOptions" />
      </SettingCard>
    </ConfigSection>

    <InfoBar v-if="error" severity="error" :title="error" />

    <div class="grid gap-4 lg:grid-cols-2">
      <!-- Timestamp + fields -->
      <div class="space-y-4 rounded-card border border-line bg-surface p-4">
        <div class="space-y-1.5">
          <label class="text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('timestamp') }}</label>
          <div class="flex gap-2">
            <TextInput v-model="timestampText" mono :invalid="!!error" />
            <BaseButton variant="neutral" @click="setNow"><Clock class="h-4 w-4" />{{ tt('now') }}</BaseButton>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label class="space-y-1 text-xs text-fg-muted"><span>{{ tt('year') }}</span><NumberInput v-model="fields.year" :min="1" :max="9999" /></label>
          <label class="space-y-1 text-xs text-fg-muted"><span>{{ tt('month') }}</span><NumberInput v-model="fields.month" :min="1" :max="12" /></label>
          <label class="space-y-1 text-xs text-fg-muted"><span>{{ tt('day') }}</span><NumberInput v-model="fields.day" :min="1" :max="31" /></label>
          <label class="space-y-1 text-xs text-fg-muted"><span>{{ tt('hour') }}</span><NumberInput v-model="fields.hour" :min="0" :max="23" /></label>
          <label class="space-y-1 text-xs text-fg-muted"><span>{{ tt('minutes') }}</span><NumberInput v-model="fields.minute" :min="0" :max="59" /></label>
          <label class="space-y-1 text-xs text-fg-muted"><span>{{ tt('secondsField') }}</span><NumberInput v-model="fields.second" :min="0" :max="59" /></label>
          <label class="space-y-1 text-xs text-fg-muted"><span>{{ tt('ms') }}</span><NumberInput v-model="fields.ms" :min="0" :max="999" /></label>
        </div>
      </div>

      <!-- Outputs -->
      <div class="divide-y divide-line rounded-card border border-line bg-surface">
        <div v-for="o in outputs" :key="o.key" class="flex items-center gap-3 px-4 py-2.5">
          <div class="min-w-0 flex-1">
            <div class="text-[11px] uppercase tracking-wider text-fg-faint">{{ o.label }}</div>
            <div class="font-mono text-sm text-fg break-all">{{ o.value }}</div>
          </div>
          <IconButton size="sm" :title="t('common.copy')" @click="copy(o.value)"><Copy class="h-4 w-4" /></IconButton>
        </div>
      </div>
    </div>
  </div>
</template>
