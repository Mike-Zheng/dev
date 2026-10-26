<script setup lang="ts">
import { computed, ref } from 'vue'
import { curvePath, moveCurvePoint, type CurvePoint } from './photoEditor'

const points = defineModel<CurvePoint[]>({ required: true })
defineProps<{ label: string; colorClass: string }>()
const emit = defineEmits<{ (e: 'reset'): void }>()

const SIZE = 256
const svg = ref<SVGSVGElement | null>(null)
const active = ref<number | null>(null)
const path = computed(() => curvePath(points.value, SIZE))

function toUnit(e: PointerEvent): [number, number] {
  const r = svg.value!.getBoundingClientRect()
  return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]
}

function onDown(e: PointerEvent) {
  const [x, y] = toUnit(e)
  let best = -1
  let bestDist = Infinity
  points.value.forEach(([px, py], i) => {
    const d = Math.hypot(px - x, py - y)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  if (best < 0 || bestDist > 0.12) return
  active.value = best
  svg.value!.setPointerCapture(e.pointerId)
  points.value = moveCurvePoint(points.value, best, x, y)
}

function onMove(e: PointerEvent) {
  if (active.value === null) return
  const [x, y] = toUnit(e)
  points.value = moveCurvePoint(points.value, active.value, x, y)
}

function onKey(e: KeyboardEvent, i: number) {
  const step = e.shiftKey ? 0.05 : 0.01
  const delta: Record<string, [number, number]> = { ArrowUp: [0, step], ArrowDown: [0, -step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] }
  const d = delta[e.key]
  if (!d) return
  e.preventDefault()
  const [x, y] = points.value[i]!
  points.value = moveCurvePoint(points.value, i, x + d[0], y + d[1])
}
</script>

<template>
  <svg
    ref="svg"
    :viewBox="`-6 -6 ${SIZE + 12} ${SIZE + 12}`"
    class="block aspect-square w-full max-w-72 touch-none select-none rounded-lg border border-line bg-surface-2/60"
    :class="colorClass"
    role="group"
    :aria-label="label"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="active = null"
    @pointercancel="active = null"
    @dblclick="emit('reset')"
  >
    <g class="stroke-line-strong" stroke-width="1">
      <line v-for="i in 3" :key="`v${i}`" :x1="(i * SIZE) / 4" y1="0" :x2="(i * SIZE) / 4" :y2="SIZE" />
      <line v-for="i in 3" :key="`h${i}`" x1="0" :y1="(i * SIZE) / 4" :x2="SIZE" :y2="(i * SIZE) / 4" />
      <line x1="0" :y1="SIZE" :x2="SIZE" y2="0" stroke-dasharray="4 4" />
    </g>
    <path :d="path" fill="none" stroke="currentColor" stroke-width="2.5" />
    <circle
      v-for="(p, i) in points"
      :key="i"
      :cx="p[0] * SIZE"
      :cy="(1 - p[1]) * SIZE"
      :r="active === i ? 7 : 5.5"
      tabindex="0"
      class="cursor-grab fill-surface outline-none focus-visible:stroke-accent"
      stroke="currentColor"
      stroke-width="2.5"
      :aria-label="`${label} ${i + 1}: ${Math.round(p[0] * 255)} → ${Math.round(p[1] * 255)}`"
      @keydown="onKey($event, i)"
    />
  </svg>
</template>
