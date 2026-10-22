<script setup lang="ts" generic="T extends string | number">
import { ChevronDown } from 'lucide-vue-next'

const model = defineModel<T>({ required: true })
withDefaults(
  defineProps<{
    options: { value: T; label: string }[]
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  { disabled: false, size: 'md' },
)

function onChange(e: Event) {
  const raw = (e.target as HTMLSelectElement).value
  const match = (model.value as unknown as number | string) === undefined ? raw : raw
  model.value = (typeof model.value === 'number' ? Number(match) : match) as T
}
</script>

<template>
  <span class="relative inline-flex">
    <select
      :value="model"
      :disabled="disabled"
      class="appearance-none rounded-md border border-line border-b-line-strong bg-control text-fg pr-8 focus-ring hover:bg-control-hover disabled:opacity-50 cursor-pointer"
      :class="size === 'sm' ? 'h-8 pl-2.5 text-xs' : 'h-9 pl-3 text-sm'"
      @change="onChange"
    >
      <option v-for="o in options" :key="String(o.value)" :value="o.value">{{ o.label }}</option>
    </select>
    <ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
  </span>
</template>
