<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'neutral' | 'ghost' | 'danger' | 'outline'
    size?: 'sm' | 'md'
    disabled?: boolean
    type?: 'button' | 'submit'
    title?: string
    block?: boolean
  }>(),
  { variant: 'neutral', size: 'md', disabled: false, type: 'button', block: false },
)

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap select-none transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none'
  const size = props.size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3.5 text-sm'
  const variant = {
    primary: 'bg-accent text-accent-fg border border-transparent hover:opacity-90 active:opacity-80',
    neutral: 'bg-control border border-line border-b-line-strong text-fg hover:bg-control-hover active:text-fg-muted',
    outline: 'bg-transparent border border-line-strong text-fg hover:bg-surface-2',
    ghost: 'bg-transparent text-fg-muted hover:text-fg hover:bg-surface-2',
    danger: 'bg-danger-soft text-danger border border-danger/30 hover:bg-danger/20',
  }[props.variant]
  return [base, size, variant, props.block ? 'w-full' : '']
})
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled" :title="title">
    <slot />
  </button>
</template>
