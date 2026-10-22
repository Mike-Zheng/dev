<script setup lang="ts">
const model = defineModel<number>({ required: true })
withDefaults(defineProps<{ min?: number; max?: number; step?: number; disabled?: boolean }>(), {
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
})

function onInput(e: Event) {
  model.value = Number((e.target as HTMLInputElement).value)
}
</script>

<template>
  <span class="inline-flex items-center gap-3">
    <input
      type="range"
      :value="model"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      class="w-32 sm:w-44 cursor-pointer accent-accent disabled:opacity-40"
      @input="onInput"
    />
    <span class="w-8 text-right text-sm font-mono text-fg-muted tabular-nums">{{ model }}</span>
  </span>
</template>
