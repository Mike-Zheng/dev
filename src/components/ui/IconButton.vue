<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    active?: boolean
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  { active: false, disabled: false, size: 'md' },
)
</script>

<template>
  <button
    type="button"
    :title="title"
    :aria-label="title"
    :disabled="disabled"
    class="inline-flex items-center justify-center rounded-md transition-colors focus-ring disabled:opacity-40 disabled:pointer-events-none"
    :class="[
      size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
      active ? 'bg-accent-soft text-accent' : 'text-fg-muted hover:text-fg hover:bg-surface-3',
    ]"
  >
    <slot />
  </button>
</template>
