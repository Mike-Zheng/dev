<script setup lang="ts">
import { ref } from 'vue'
import { Upload } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const props = withDefaults(defineProps<{ accept?: string; multiple?: boolean; label?: string; compact?: boolean }>(), {
  accept: '',
  multiple: false,
  compact: false,
})
const emit = defineEmits<{ (e: 'files', files: File[]): void }>()
const { t } = useI18n()
const dragging = ref(false)
const input = ref<HTMLInputElement | null>(null)

function onDrop(e: DragEvent) {
  dragging.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  if (files.length) emit('files', props.multiple ? files : files.slice(0, 1))
}
function onChange() {
  const files = Array.from(input.value?.files ?? [])
  if (files.length) emit('files', files)
  if (input.value) input.value.value = ''
}
</script>

<template>
  <button
    type="button"
    class="w-full rounded-card border-2 border-dashed text-center transition-colors focus-ring"
    :class="[
      dragging ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong bg-surface',
      compact ? 'px-4 py-4' : 'px-6 py-10',
    ]"
    @click="input?.click()"
    @dragover.prevent="dragging = true"
    @dragleave="dragging = false"
    @drop.prevent="onDrop"
  >
    <Upload class="mx-auto text-accent" :class="compact ? 'h-5 w-5' : 'h-7 w-7'" />
    <div class="mt-2 text-sm text-fg-muted">
      {{ label ?? t('common.dragImage') }}
    </div>
    <input ref="input" type="file" class="hidden" :accept="accept" :multiple="multiple" @change="onChange" />
  </button>
</template>
