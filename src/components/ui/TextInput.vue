<script setup lang="ts">
const model = defineModel<string>({ default: '' })
withDefaults(
  defineProps<{
    placeholder?: string
    type?: 'text' | 'password' | 'search'
    mono?: boolean
    disabled?: boolean
    readonly?: boolean
    size?: 'sm' | 'md'
    invalid?: boolean
  }>(),
  { type: 'text', mono: false, disabled: false, readonly: false, size: 'md', invalid: false },
)
</script>

<template>
  <input
    v-model="model"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    spellcheck="false"
    autocomplete="off"
    class="w-full rounded-lg border bg-surface-2 text-fg placeholder:text-fg-faint focus-ring hover:border-line-strong disabled:opacity-50 read-only:bg-surface"
    :class="[
      size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-sm',
      mono ? 'font-mono' : '',
      invalid ? 'border-danger/60' : 'border-line',
    ]"
  />
</template>
