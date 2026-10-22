<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    severity?: 'info' | 'success' | 'warning' | 'error'
    title?: string
    message?: string
    closable?: boolean
  }>(),
  { severity: 'info', closable: false },
)
const emit = defineEmits<{ (e: 'close'): void }>()

const style = computed(() => {
  return {
    info: { icon: Info, cls: 'bg-info-soft border-info/30 text-info' },
    success: { icon: CircleCheck, cls: 'bg-success-soft border-success/30 text-success' },
    warning: { icon: TriangleAlert, cls: 'bg-warning-soft border-warning/30 text-warning' },
    error: { icon: CircleX, cls: 'bg-danger-soft border-danger/30 text-danger' },
  }[props.severity]
})
</script>

<template>
  <div class="flex items-start gap-3 rounded-lg border px-3.5 py-2.5 text-sm" :class="style.cls" role="status">
    <component :is="style.icon" class="h-4.5 w-4.5 shrink-0 mt-0.5" />
    <div class="min-w-0 flex-1 text-fg">
      <div v-if="title" class="font-medium">{{ title }}</div>
      <div v-if="message" class="text-fg-muted break-words" :class="title ? 'mt-0.5' : ''">{{ message }}</div>
      <slot />
    </div>
    <button v-if="closable" type="button" class="shrink-0 text-fg-muted hover:text-fg" @click="emit('close')">
      <X class="h-4 w-4" />
    </button>
  </div>
</template>
