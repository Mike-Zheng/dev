<script setup lang="ts">
const model = defineModel<boolean>({ default: false })
withDefaults(defineProps<{ onLabel?: string; offLabel?: string; disabled?: boolean }>(), { disabled: false })
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :disabled="disabled"
    class="group inline-flex items-center gap-2.5 focus-ring rounded-full disabled:opacity-50"
    @click="model = !model"
  >
    <span class="text-sm text-fg-muted min-w-[2ch] text-right" v-if="onLabel || offLabel">{{ model ? onLabel : offLabel }}</span>
    <span
      class="relative inline-block h-5 w-9 shrink-0 rounded-full border transition-colors"
      :class="model ? 'bg-accent border-accent' : 'bg-surface-3 border-line-strong group-hover:border-fg-faint'"
    >
      <span
        class="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full transition-all"
        :class="model ? 'left-[18px] bg-accent-fg' : 'left-[3px] bg-fg-muted'"
      />
    </span>
  </button>
</template>
