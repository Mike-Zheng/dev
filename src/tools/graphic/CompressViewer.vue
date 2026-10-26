<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { Maximize, Minus, Plus, Scan } from 'lucide-vue-next'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'

export interface LensRect {
  /** Top-left corner and side of the magnified square, in image pixels */
  x: number
  y: number
  size: number
}

const props = defineProps<{
  src: string
  width: number
  height: number
  /** CSS size of one grid cell: the lens never covers more image pixels than a cell can show 1:1 */
  cellSize: number
}>()
const emit = defineEmits<{ (e: 'lens', rect: LensRect): void }>()

const { t } = useI18n()
const tt = (k: string) => t(`tools.image-compressor.${k}`)

const LENS = 128
const MIN_SCALE = 0.02
const MAX_SCALE = 16

const viewport = ref<HTMLDivElement | null>(null)
const vp = ref({ width: 0, height: 0 })
const scale = ref(1)
const pan = ref({ x: 0, y: 0 })
const center = ref({ x: props.width / 2, y: props.height / 2 })

const fitScale = computed(() =>
  vp.value.width && props.width ? Math.min(1, (vp.value.width - 16) / props.width, (vp.value.height - 16) / props.height) : 1,
)
const dispW = computed(() => props.width * scale.value)
const dispH = computed(() => props.height * scale.value)
const left = computed(() => vp.value.width / 2 - dispW.value / 2 + pan.value.x)
const top = computed(() => vp.value.height / 2 - dispH.value / 2 + pan.value.y)

/** Side of the lens in image pixels */
const lensNat = computed(() => Math.max(1, Math.min(LENS / scale.value, props.cellSize, props.width, props.height)))
const lensRect = computed<LensRect>(() => {
  const s = lensNat.value
  const x = Math.max(0, Math.min(props.width - s, center.value.x - s / 2))
  const y = Math.max(0, Math.min(props.height - s, center.value.y - s / 2))
  return { x, y, size: s }
})
watchEffect(() => emit('lens', lensRect.value))

const lensStyle = computed(() => {
  const r = lensRect.value
  const side = Math.max(10, r.size * scale.value)
  const cx = left.value + (r.x + r.size / 2) * scale.value
  const cy = top.value + (r.y + r.size / 2) * scale.value
  return { left: `${cx - side / 2}px`, top: `${cy - side / 2}px`, width: `${side}px`, height: `${side}px` }
})

const zoomLabel = computed(() => `${Math.round(scale.value * 100)}%`)

function clampPan() {
  const mx = Math.max(0, (dispW.value - vp.value.width) / 2 + 8)
  const my = Math.max(0, (dispH.value - vp.value.height) / 2 + 8)
  pan.value = {
    x: dispW.value + 16 > vp.value.width ? Math.max(-mx, Math.min(mx, pan.value.x)) : 0,
    y: dispH.value + 16 > vp.value.height ? Math.max(-my, Math.min(my, pan.value.y)) : 0,
  }
}

/** Zooms keeping the image point under (px, py) — viewport coordinates — in place. */
function zoomTo(next: number, px = vp.value.width / 2, py = vp.value.height / 2) {
  const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next))
  const nx = (px - left.value) / scale.value
  const ny = (py - top.value) / scale.value
  scale.value = s
  pan.value = {
    x: px - nx * s - (vp.value.width / 2 - (props.width * s) / 2),
    y: py - ny * s - (vp.value.height / 2 - (props.height * s) / 2),
  }
  clampPan()
}

function fit() {
  scale.value = fitScale.value
  pan.value = { x: 0, y: 0 }
}

function actualSize() {
  zoomTo(1, left.value + (center.value.x * scale.value), top.value + (center.value.y * scale.value))
}

function local(e: PointerEvent | WheelEvent) {
  const r = viewport.value!.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

function moveLens(e: PointerEvent) {
  const p = local(e)
  center.value = {
    x: Math.max(0, Math.min(props.width, (p.x - left.value) / scale.value)),
    y: Math.max(0, Math.min(props.height, (p.y - top.value) / scale.value)),
  }
}

// Mouse: hover moves the lens, drag pans. Touch / pen: drag moves the lens.
const drag = ref<{ x: number; y: number; px: number; py: number } | null>(null)
function onDown(e: PointerEvent) {
  if (e.button !== 0) return
  viewport.value?.setPointerCapture(e.pointerId)
  if (e.pointerType === 'mouse') drag.value = { x: e.clientX, y: e.clientY, px: pan.value.x, py: pan.value.y }
  else moveLens(e)
}
function onMove(e: PointerEvent) {
  const d = drag.value
  if (d) {
    pan.value = { x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y }
    clampPan()
  } else if (e.pointerType === 'mouse' || e.buttons) {
    moveLens(e)
  }
}
function onUp() {
  drag.value = null
}
function onWheel(e: WheelEvent) {
  const p = local(e)
  zoomTo(scale.value * (e.deltaY < 0 ? 1.15 : 1 / 1.15), p.x, p.y)
}

let ro: ResizeObserver | null = null
onMounted(() => {
  ro = new ResizeObserver(([entry]) => {
    const first = vp.value.width === 0
    vp.value = { width: entry!.contentRect.width, height: entry!.contentRect.height }
    if (first) fit()
    else clampPan()
  })
  ro.observe(viewport.value!)
})
onBeforeUnmount(() => ro?.disconnect())

watch(
  () => [props.width, props.height],
  () => {
    center.value = { x: props.width / 2, y: props.height / 2 }
    fit()
  },
)
</script>

<template>
  <div class="relative flex flex-col">
    <div
      ref="viewport"
      class="relative min-h-0 flex-1 touch-none select-none overflow-hidden bg-[linear-gradient(45deg,var(--c-surface-3)_25%,transparent_25%,transparent_75%,var(--c-surface-3)_75%),linear-gradient(45deg,var(--c-surface-3)_25%,transparent_25%,transparent_75%,var(--c-surface-3)_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]"
      :class="drag ? 'cursor-grabbing' : 'cursor-crosshair'"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @wheel.prevent="onWheel"
    >
      <img
        :src="src"
        alt=""
        draggable="false"
        class="pointer-events-none absolute max-w-none shadow-sm"
        :class="scale > 1 ? '[image-rendering:pixelated]' : ''"
        :style="{ left: `${left}px`, top: `${top}px`, width: `${dispW}px`, height: `${dispH}px` }"
      />
      <div
        class="pointer-events-none absolute rounded-sm border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)]"
        :style="lensStyle"
      />
    </div>
    <div class="flex items-center gap-1 border-t border-line bg-surface px-2 py-1">
      <span class="mr-auto truncate pl-1 text-[11px] text-fg-muted">{{ tt('viewerHint') }}</span>
      <IconButton size="sm" :title="tt('zoomOut')" @click="zoomTo(scale / 1.25)"><Minus class="h-4 w-4" /></IconButton>
      <span class="w-12 text-center font-mono text-xs tabular-nums text-fg-muted">{{ zoomLabel }}</span>
      <IconButton size="sm" :title="tt('zoomIn')" @click="zoomTo(scale * 1.25)"><Plus class="h-4 w-4" /></IconButton>
      <IconButton size="sm" :title="tt('fit')" @click="fit"><Maximize class="h-4 w-4" /></IconButton>
      <IconButton size="sm" :title="tt('actualSize')" @click="actualSize"><Scan class="h-4 w-4" /></IconButton>
    </div>
  </div>
</template>
