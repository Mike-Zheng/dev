<script setup lang="ts">
import { computed, ref } from 'vue'
import { CaseSensitive, ArrowDownAZ, WrapText, Undo2 } from 'lucide-vue-next'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'
import {
  applyLineOp,
  caseKeys,
  charFrequency as getCharFrequency,
  convertCase,
  convertLineBreaks,
  lineOpKeys,
  textStats,
  wordFrequency as getWordFrequency,
  type Transform,
} from './analyzer'

const { t } = useI18n()
const tt = (k: string) => t(`tools.text-analyzer.${k}`)

const text = ref('')
const original = ref<string | null>(null)

/* ---------- statistics ---------- */
const stats = computed(() => {
  const s = textStats(text.value)
  const lineBreak = s.lineBreak === 'unknown' ? tt('lbUnknown') : s.lineBreak === 'mixed' ? tt('lbMixed') : s.lineBreak
  return [
    { k: tt('characters'), v: s.characters },
    { k: tt('words'), v: s.words },
    { k: tt('lines'), v: s.lines },
    { k: tt('sentences'), v: s.sentences },
    { k: tt('paragraphs'), v: s.paragraphs },
    { k: tt('bytes'), v: s.bytes },
    { k: tt('lineBreak'), v: lineBreak },
  ]
})

const wordFrequency = computed(() => getWordFrequency(text.value))
const charFrequency = computed(() => getCharFrequency(text.value))

/* ---------- transforms ---------- */
function apply(fn: Transform) {
  if (original.value === null) original.value = text.value
  text.value = fn(text.value)
}
function undo() {
  if (original.value !== null) {
    text.value = original.value
    original.value = null
  }
}

const caseOps = caseKeys.map((key) => ({ key, fn: (s: string) => convertCase(key, s) }))
const lineOps = lineOpKeys.map((key) => ({ key, fn: (s: string) => applyLineOp(key, s) }))
const lbOps: { key: string; fn: Transform }[] = [
  { key: 'LF (\\n)', fn: (s) => convertLineBreaks(s, 'LF') },
  { key: 'CRLF (\\r\\n)', fn: (s) => convertLineBreaks(s, 'CRLF') },
  { key: 'CR (\\r)', fn: (s) => convertLineBreaks(s, 'CR') },
]
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-[1fr_300px]">
    <div class="space-y-4 min-w-0">
      <CodeEditor v-model="text" :label="tt('text')" height-class="min-h-[22rem]" :mono="false">
        <template #actions>
          <IconButton v-if="original !== null" size="sm" :title="tt('undo')" @click="undo"><Undo2 class="h-4 w-4" /></IconButton>
        </template>
      </CodeEditor>

      <div class="space-y-3 rounded-card border border-line bg-surface p-4">
        <div>
          <div class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted"><CaseSensitive class="h-3.5 w-3.5" />{{ tt('convertCase') }}</div>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="op in caseOps" :key="op.key" type="button" class="chip" :disabled="!text" @click="apply(op.fn)">{{ tt(op.key) }}</button>
          </div>
        </div>
        <div>
          <div class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted"><ArrowDownAZ class="h-3.5 w-3.5" />{{ tt('sortLines') }}</div>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="op in lineOps" :key="op.key" type="button" class="chip" :disabled="!text" @click="apply(op.fn)">{{ tt(op.key) }}</button>
          </div>
        </div>
        <div>
          <div class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted"><WrapText class="h-3.5 w-3.5" />{{ tt('convertLineBreak') }}</div>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="op in lbOps" :key="op.key" type="button" class="chip font-mono" :disabled="!text" @click="apply(op.fn)">{{ op.key }}</button>
          </div>
        </div>
      </div>
    </div>

    <aside class="space-y-4">
      <div class="rounded-card border border-line bg-surface">
        <div class="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('statistics') }}</div>
        <dl class="divide-y divide-line">
          <div v-for="s in stats" :key="s.k" class="flex items-center justify-between px-4 py-1.5 text-sm">
            <dt class="text-fg-muted">{{ s.k }}</dt>
            <dd class="font-mono text-fg">{{ s.v }}</dd>
          </div>
        </dl>
      </div>
      <div v-if="wordFrequency.length" class="rounded-card border border-line bg-surface">
        <div class="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('wordFrequency') }}</div>
        <div class="divide-y divide-line">
          <div v-for="[w, n] in wordFrequency" :key="w" class="flex items-center justify-between px-4 py-1 text-sm">
            <span class="truncate font-mono text-fg">{{ w }}</span><span class="font-mono text-fg-muted">{{ n }}</span>
          </div>
        </div>
      </div>
      <div v-if="charFrequency.length" class="rounded-card border border-line bg-surface">
        <div class="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('characterFrequency') }}</div>
        <div class="grid grid-cols-3 gap-x-3 px-4 py-2 text-sm">
          <div v-for="[c, n] in charFrequency" :key="c" class="flex justify-between font-mono"><span class="text-fg">{{ c }}</span><span class="text-fg-muted">{{ n }}</span></div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
@reference "@/style.css";
.chip {
  @apply rounded-md border border-line bg-surface-2 px-2.5 py-1 text-xs text-fg transition-colors hover:border-line-strong hover:bg-surface-3 disabled:opacity-40 disabled:pointer-events-none focus-ring;
}
</style>
