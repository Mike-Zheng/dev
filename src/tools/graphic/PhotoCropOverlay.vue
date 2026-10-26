<script setup lang="ts">
import { computed, ref } from 'vue'
import { moveCrop, resizeCrop, type CropHandle, type CropRect } from './photoEditor'

const rect = defineModel<CropRect>({ required: true })
/** Normalized w / h ratio to keep, or null for free cropping. */
const props = defineProps<{ ratio: number | null }>()

const root = ref<HTMLDivElement | null>(null)
let drag: { handle: CropHandle | 'move'; x: number; y: number; start: CropRect } | null = null

const handles = computed<CropHandle[]>(() => (props.ratio === null ? ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] : ['nw', 'ne', 'se', 'sw']))

const HANDLE_POS: Record<CropHandle, string> = {
  nw: 'left-0 top-0 cursor-nwse-resize',
  n: 'left-1/2 top-0 cursor-ns-resize',
  ne: 'left-full top-0 cursor-nesw-resize',
  e: 'left-full top-1/2 cursor-ew-resize',
  se: 'left-full top-full cursor-nwse-resize',
  s: 'left-1/2 top-full cursor-ns-resize',
  sw: 'left-0 top-full cursor-nesw-resize',
  w: 'left-0 top-1/2 cursor-ew-resize',
}

function start(e: PointerEvent, handle: CropHandle | 'move') {
  e.preventDefault()
  e.stopPropagation()
  drag = { handle, x: e.clientX, y: e.clientY, start: { ...rect.value } }
  root.value?.setPointerCapture(e.pointerId)
}

function onMove(e: PointerEvent) {
  if (!drag || !root.value) return
  const box = root.value.getBoundingClientRect()
  const dx = (e.clientX - drag.x) / box.width
  const dy = (e.clientY - drag.y) / box.height
  rect.value = drag.handle === 'move' ? moveCrop(drag.start, dx, dy) : resizeCrop(drag.start, drag.handle, dx, dy, props.ratio)
}

const pct = (v: number) => `${v * 100}%`
</script>

<template>
  <div ref="root" class="absolute inset-0 touch-none select-none overflow-hidden" @pointermove="onMove" @pointerup="drag = null" @pointercancel="drag = null">
    <div
      class="absolute cursor-move shadow-[0_0_0_9999px_rgb(0_0_0/0.5)] outline outline-1 outline-white/90"
      :style="{ left: pct(rect.x), top: pct(rect.y), width: pct(rect.w), height: pct(rect.h) }"
      @pointerdown="start($event, 'move')"
    >
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-y-0 left-1/3 w-px bg-white/40" />
        <div class="absolute inset-y-0 left-2/3 w-px bg-white/40" />
        <div class="absolute inset-x-0 top-1/3 h-px bg-white/40" />
        <div class="absolute inset-x-0 top-2/3 h-px bg-white/40" />
      </div>
      <span
        v-for="h in handles"
        :key="h"
        class="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        :class="HANDLE_POS[h]"
        @pointerdown="start($event, h)"
      >
        <span class="block h-3 w-3 rounded-sm border border-black/30 bg-white" />
      </span>
    </div>
  </div>
</template>
