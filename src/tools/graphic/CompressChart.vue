<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { formatBytes } from '@/composables/useFiles'
import type { QualityMetric } from './imageCompressor'

export interface ChartPoint {
  level: number
  label: string
  size: number | null
  ssim: number | null
  psnr: number | null
}

const props = defineProps<{
  points: ChartPoint[]
  metric: QualityMetric
  selected: number | null
  best: number | null
}>()
const emit = defineEmits<{ (e: 'pick', level: number): void }>()

const H = 150
const M = { l: 44, r: 40, t: 14, b: 20 }
const el = ref<HTMLDivElement | null>(null)
const W = ref(320)
let ro: ResizeObserver | null = null
onMounted(() => {
  ro = new ResizeObserver(([e]) => (W.value = Math.max(200, e!.contentRect.width)))
  ro.observe(el.value!)
})
onBeforeUnmount(() => ro?.disconnect())

const metricColor = computed(() => (props.metric === 'ssim' ? 'var(--c-success)' : 'var(--c-warning)'))
const done = computed(() => props.points.map((p, i) => ({ ...p, i })).filter((p) => p.size !== null && p[props.metric] !== null))

const xOf = (i: number) => M.l + (props.points.length > 1 ? (i / (props.points.length - 1)) * (W.value - M.l - M.r) : (W.value - M.l - M.r) / 2)
const plotH = H - M.t - M.b

const maxSize = computed(() => Math.max(1, ...done.value.map((p) => p.size!)))
const sigRange = computed(() => {
  const v = done.value.map((p) => p[props.metric]!)
  if (props.metric === 'ssim') return { min: Math.max(0, Math.min(...v, 1) - 0.02), max: 1 }
  return { min: Math.max(0, Math.min(...v) - 2), max: Math.max(...v, 1) + 1 }
})
const ySize = (s: number) => M.t + plotH - (s / maxSize.value) * plotH
const ySig = (v: number) => M.t + plotH - ((v - sigRange.value.min) / (sigRange.value.max - sigRange.value.min || 1)) * plotH

const sizePath = computed(() => done.value.map((p, k) => `${k ? 'L' : 'M'}${xOf(p.i)},${ySize(p.size!)}`).join(''))
const sigPath = computed(() => done.value.map((p, k) => `${k ? 'L' : 'M'}${xOf(p.i)},${ySig(p[props.metric]!)}`).join(''))

const ticks = [0, 0.25, 0.5, 0.75, 1]
const sizeTick = (f: number) => {
  const b = maxSize.value * f
  return b < 1024 * 1024 ? `${Math.round(b / 1024)}K` : `${(b / 1024 / 1024).toFixed(1)}M`
}
const sigTick = (f: number) => {
  const v = sigRange.value.min + (sigRange.value.max - sigRange.value.min) * f
  return props.metric === 'ssim' ? `${(v * 100).toFixed(0)}%` : `${v.toFixed(0)}`
}
const markerIndex = (level: number | null) => (level === null ? -1 : props.points.findIndex((p) => p.level === level))
</script>

<template>
  <div ref="el" class="w-full">
    <svg :width="W" :height="H" class="block font-mono text-[10px]" role="img">
      <g v-for="f in ticks" :key="f">
        <line :x1="M.l" :x2="W - M.r" :y1="M.t + plotH * (1 - f)" :y2="M.t + plotH * (1 - f)" stroke="var(--c-line)" />
        <text :x="M.l - 4" :y="M.t + plotH * (1 - f) + 3" text-anchor="end" fill="var(--c-accent)">{{ done.length ? sizeTick(f) : '' }}</text>
        <text :x="W - M.r + 4" :y="M.t + plotH * (1 - f) + 3" :fill="metricColor">{{ done.length ? sigTick(f) : '' }}</text>
      </g>
      <text v-for="(p, i) in points" :key="p.level" :x="xOf(i)" :y="H - 5" text-anchor="middle" fill="var(--c-fg-faint)">{{ p.label }}</text>

      <!-- selected / recommended markers -->
      <line
        v-if="markerIndex(best) >= 0"
        :x1="xOf(markerIndex(best))"
        :x2="xOf(markerIndex(best))"
        :y1="M.t - 4"
        :y2="M.t + plotH"
        stroke="var(--c-warning)"
        stroke-dasharray="2 3"
      />
      <text v-if="markerIndex(best) >= 0" :x="xOf(markerIndex(best))" :y="M.t - 5" text-anchor="middle" fill="var(--c-warning)" class="text-[11px]">★</text>
      <rect
        v-if="markerIndex(selected) >= 0"
        :x="xOf(markerIndex(selected)) - 9"
        :y="M.t"
        width="18"
        :height="plotH"
        rx="4"
        fill="var(--c-accent)"
        opacity="0.08"
      />

      <path :d="sizePath" fill="none" stroke="var(--c-accent)" stroke-width="1.75" />
      <path :d="sigPath" fill="none" :stroke="metricColor" stroke-width="1.75" />
      <g v-for="p in done" :key="p.level">
        <circle :cx="xOf(p.i)" :cy="ySize(p.size!)" r="2.75" fill="var(--c-accent)" />
        <circle :cx="xOf(p.i)" :cy="ySig(p[metric]!)" r="2.75" :fill="metricColor" />
      </g>

      <!-- hit areas -->
      <rect
        v-for="(p, i) in points"
        :key="`hit-${p.level}`"
        :x="xOf(i) - 12"
        :y="0"
        width="24"
        :height="H"
        fill="transparent"
        class="cursor-pointer"
        @click="p.size !== null && emit('pick', p.level)"
      >
        <title>{{ p.label }}{{ p.size !== null ? ` · ${formatBytes(p.size)}` : '' }}</title>
      </rect>
    </svg>
  </div>
</template>
