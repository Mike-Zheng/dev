<script setup lang="ts">
import { computed, ref } from 'vue'
import { ClipboardPaste, Copy, Download, FolderOpen, TextWrap, Trash2 } from 'lucide-vue-next'
import IconButton from './IconButton.vue'
import { useI18n } from '@/i18n'
import { useClipboard } from '@/composables/useClipboard'
import { useSettings } from '@/composables/useSettings'
import { downloadText, readFileAsText } from '@/composables/useFiles'

const model = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    label?: string
    readonly?: boolean
    placeholder?: string
    /** Tailwind height classes, e.g. "h-64" or "min-h-[16rem]" */
    heightClass?: string
    filename?: string
    accept?: string
    invalid?: boolean
    showStats?: boolean
    mono?: boolean
    /** Hide the toolbar's default actions. */
    noActions?: boolean
    /** Fill the available height of the parent flex container. */
    fill?: boolean
    /** Initial word wrap state; defaults to the user's setting. */
    defaultWrap?: boolean
    /** Tight line height, for content like ASCII art where rows must touch. */
    tight?: boolean
  }>(),
  {
    readonly: false,
    heightClass: 'min-h-[14rem]',
    filename: 'output.txt',
    accept: '',
    invalid: false,
    showStats: true,
    mono: true,
    noActions: false,
    fill: false,
    defaultWrap: undefined,
    tight: false,
  },
)

const emit = defineEmits<{ (e: 'file', file: File): void }>()

const { t } = useI18n()
const { copy, paste } = useClipboard()
const { wordWrap, editorFontSize } = useSettings()

const wrap = ref(props.defaultWrap ?? wordWrap.value)
const dragging = ref(false)
const textarea = ref<HTMLTextAreaElement | null>(null)

const stats = computed(() => {
  const v = model.value ?? ''
  const lines = v.length === 0 ? 0 : v.split(/\r\n|\r|\n/).length
  return `${lines} ${t('common.lines')} · ${v.length} ${t('common.chars')}`
})

async function onPaste() {
  const text = await paste()
  if (text !== null) model.value = text
}

async function onOpenFile() {
  const input = document.createElement('input')
  input.type = 'file'
  if (props.accept) input.accept = props.accept
  input.onchange = async () => {
    const f = input.files?.[0]
    if (f) await loadFile(f)
  }
  input.click()
}

async function loadFile(f: File) {
  emit('file', f)
  model.value = await readFileAsText(f)
}

function onSave() {
  downloadText(model.value ?? '', props.filename)
}

async function onDrop(e: DragEvent) {
  dragging.value = false
  if (props.readonly) return
  const f = e.dataTransfer?.files?.[0]
  if (f) await loadFile(f)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Tab' || props.readonly) return
  e.preventDefault()
  const el = e.target as HTMLTextAreaElement
  const start = el.selectionStart
  const end = el.selectionEnd
  const v = el.value
  model.value = v.slice(0, start) + '\t' + v.slice(end)
  requestAnimationFrame(() => {
    el.selectionStart = el.selectionEnd = start + 1
  })
}

defineExpose({ focus: () => textarea.value?.focus() })
</script>

<template>
  <div
    class="flex flex-col rounded-card border bg-surface overflow-hidden transition-colors"
    :class="[
      invalid ? 'border-danger/60' : dragging ? 'border-accent' : 'border-line',
      fill ? 'flex-1 min-h-0' : '',
    ]"
    @dragover.prevent="dragging = !readonly"
    @dragleave="dragging = false"
    @drop.prevent="onDrop"
  >
    <div class="flex flex-wrap items-center gap-1 border-b border-line bg-surface-2/60 px-2 py-1.5 min-h-[38px]">
      <span v-if="label" class="px-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted truncate">{{ label }}</span>
      <span class="flex-1" />
      <slot name="actions" />
      <template v-if="!noActions">
        <IconButton v-if="!readonly" size="sm" :title="t('common.paste')" @click="onPaste"><ClipboardPaste class="h-4 w-4" /></IconButton>
        <IconButton v-if="!readonly" size="sm" :title="t('common.openFile')" @click="onOpenFile"><FolderOpen class="h-4 w-4" /></IconButton>
        <IconButton size="sm" :title="t('common.copy')" :disabled="!model" @click="copy(model)"><Copy class="h-4 w-4" /></IconButton>
        <IconButton v-if="readonly" size="sm" :title="t('common.save')" :disabled="!model" @click="onSave"><Download class="h-4 w-4" /></IconButton>
        <IconButton size="sm" :title="t('common.wrap')" :active="wrap" @click="wrap = !wrap"><TextWrap class="h-4 w-4" /></IconButton>
        <IconButton v-if="!readonly" size="sm" :title="t('common.clear')" :disabled="!model" @click="model = ''"><Trash2 class="h-4 w-4" /></IconButton>
      </template>
    </div>
    <textarea
      ref="textarea"
      v-model="model"
      :readonly="readonly"
      :placeholder="placeholder"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      autocorrect="off"
      class="w-full flex-1 resize-y bg-transparent px-3 py-2.5 text-fg placeholder:text-fg-faint outline-none"
      :class="[heightClass, tight ? 'leading-tight' : 'leading-relaxed', mono ? 'font-mono' : 'font-sans', wrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto', readonly ? 'text-fg/90' : '', fill ? 'resize-none' : '']"
      :style="{ fontSize: editorFontSize + 'px' }"
      @keydown="onKeydown"
    />
    <div v-if="showStats" class="flex items-center justify-between border-t border-line px-3 py-1 text-[11px] text-fg-faint font-mono">
      <span>{{ stats }}</span>
      <slot name="footer" />
    </div>
  </div>
</template>
