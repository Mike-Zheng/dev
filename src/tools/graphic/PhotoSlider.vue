<script setup lang="ts">
const model = defineModel<number>({ required: true })
withDefaults(defineProps<{ label: string; min?: number; max?: number; step?: number; reset?: number; digits?: number }>(), {
  min: -1,
  max: 1,
  step: 0.01,
  reset: 0,
  digits: 2,
})
</script>

<template>
  <label class="grid grid-cols-[6.5rem_minmax(0,1fr)_3rem] items-center gap-2 py-0.5 text-xs">
    <span class="truncate text-fg-muted">{{ label }}</span>
    <input
      type="range"
      :value="model"
      :min="min"
      :max="max"
      :step="step"
      class="w-full cursor-pointer accent-accent"
      @input="model = Number(($event.target as HTMLInputElement).value)"
      @dblclick="model = reset"
    />
    <span class="text-right font-mono tabular-nums" :class="model === reset ? 'text-fg-faint' : 'text-fg'">{{ model.toFixed(digits) }}</span>
  </label>
</template>
