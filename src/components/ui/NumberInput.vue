<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'

const model = defineModel<number>({ required: true })
const props = withDefaults(
  defineProps<{ min?: number; max?: number; step?: number; disabled?: boolean; size?: 'sm' | 'md' }>(),
  { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY, step: 1, disabled: false, size: 'md' },
)

function clamp(v: number) {
  if (Number.isNaN(v)) return props.min === Number.NEGATIVE_INFINITY ? 0 : props.min
  return Math.min(props.max, Math.max(props.min, v))
}
function onInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  model.value = clamp(v)
}
function bump(d: number) {
  model.value = clamp((model.value ?? 0) + d * props.step)
}
</script>

<template>
  <span
    class="inline-flex items-stretch rounded-lg border border-line bg-surface-2 overflow-hidden focus-within:ring-2 focus-within:ring-accent/60"
    :class="size === 'sm' ? 'h-8' : 'h-9'"
  >
    <button type="button" class="px-2 text-fg-muted hover:text-fg hover:bg-surface-3 disabled:opacity-40" :disabled="disabled || model <= min" @click="bump(-1)">
      <Minus class="h-3.5 w-3.5" />
    </button>
    <input
      type="number"
      :value="model"
      :min="min === Number.NEGATIVE_INFINITY ? undefined : min"
      :max="max === Number.POSITIVE_INFINITY ? undefined : max"
      :step="step"
      :disabled="disabled"
      class="w-16 bg-transparent text-center text-sm text-fg outline-none font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      @input="onInput"
    />
    <button type="button" class="px-2 text-fg-muted hover:text-fg hover:bg-surface-3 disabled:opacity-40" :disabled="disabled || model >= max" @click="bump(1)">
      <Plus class="h-3.5 w-3.5" />
    </button>
  </span>
</template>
