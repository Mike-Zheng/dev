<script setup lang="ts">
import { computed, ref } from 'vue'
import { CaseSensitive, ArrowDownAZ, WrapText, Undo2 } from 'lucide-vue-next'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const tt = (k: string) => t(`tools.text-analyzer.${k}`)

const text = ref('')
const original = ref<string | null>(null)

/* ---------- statistics ---------- */
const stats = computed(() => {
  const v = text.value
  const chars = Array.from(v).length
  const words = v.trim() ? (v.match(/[\p{L}\p{N}_'’-]+/gu) ?? []).length : 0
  const lines = v ? v.split(/\r\n|\r|\n/).length : 0
  const sentences = v.trim() ? (v.match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g) ?? []).filter((s) => s.trim()).length : 0
  const paragraphs = v.trim() ? v.split(/(?:\r?\n){2,}/).filter((p) => p.trim()).length : 0
  const bytes = new TextEncoder().encode(v).length
  const crlf = (v.match(/\r\n/g) ?? []).length
  const lf = (v.match(/(?<!\r)\n/g) ?? []).length
  const cr = (v.match(/\r(?!\n)/g) ?? []).length
  const kinds = [crlf && 'CRLF', lf && 'LF', cr && 'CR'].filter(Boolean)
  const lineBreak = kinds.length === 0 ? tt('lbUnknown') : kinds.length === 1 ? String(kinds[0]) : tt('lbMixed')
  return [
    { k: tt('characters'), v: chars },
    { k: tt('words'), v: words },
    { k: tt('lines'), v: lines },
    { k: tt('sentences'), v: sentences },
    { k: tt('paragraphs'), v: paragraphs },
    { k: tt('bytes'), v: bytes },
    { k: tt('lineBreak'), v: lineBreak },
  ]
})

const wordFrequency = computed(() => {
  const m = new Map<string, number>()
  for (const w of text.value.toLowerCase().match(/[\p{L}\p{N}_'’-]+/gu) ?? []) m.set(w, (m.get(w) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
})
const charFrequency = computed(() => {
  const m = new Map<string, number>()
  for (const c of text.value) if (!/\s/.test(c)) m.set(c, (m.get(c) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
})

/* ---------- transforms ---------- */
function apply(fn: (s: string) => string) {
  if (original.value === null) original.value = text.value
  text.value = fn(text.value)
}
function undo() {
  if (original.value !== null) {
    text.value = original.value
    original.value = null
  }
}

function words(s: string): string[] {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}
const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()

const caseOps: { key: string; fn: (s: string) => string }[] = [
  { key: 'sentenceCase', fn: (s) => s.toLowerCase().replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (m) => m.toUpperCase()) },
  { key: 'lowerCase', fn: (s) => s.toLowerCase() },
  { key: 'upperCase', fn: (s) => s.toUpperCase() },
  { key: 'titleCase', fn: (s) => s.replace(/\p{L}[\p{L}\p{N}'’]*/gu, (w) => cap(w)) },
  { key: 'camelCase', fn: (s) => words(s).map((w, i) => (i === 0 ? w.toLowerCase() : cap(w))).join('') },
  { key: 'pascalCase', fn: (s) => words(s).map(cap).join('') },
  { key: 'snakeCase', fn: (s) => words(s).map((w) => w.toLowerCase()).join('_') },
  { key: 'constantCase', fn: (s) => words(s).map((w) => w.toUpperCase()).join('_') },
  { key: 'kebabCase', fn: (s) => words(s).map((w) => w.toLowerCase()).join('-') },
  { key: 'cobolCase', fn: (s) => words(s).map((w) => w.toUpperCase()).join('-') },
  { key: 'trainCase', fn: (s) => words(s).map(cap).join('-') },
  { key: 'alternatingCase', fn: (s) => Array.from(s).map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join('') },
  { key: 'inverseCase', fn: (s) => Array.from(s).map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('') },
  { key: 'randomCase', fn: (s) => Array.from(s).map((c) => (Math.random() < 0.5 ? c.toUpperCase() : c.toLowerCase())).join('') },
]

const lineOps: { key: string; fn: (s: string) => string }[] = [
  { key: 'alphabetize', fn: (s) => lines(s).sort((a, b) => a.localeCompare(b)).join('\n') },
  { key: 'reverseAlphabetize', fn: (s) => lines(s).sort((a, b) => b.localeCompare(a)).join('\n') },
  { key: 'alphabetizeLast', fn: (s) => lines(s).sort((a, b) => last(a).localeCompare(last(b))).join('\n') },
  { key: 'reverseAlphabetizeLast', fn: (s) => lines(s).sort((a, b) => last(b).localeCompare(last(a))).join('\n') },
  { key: 'reverse', fn: (s) => lines(s).reverse().join('\n') },
  { key: 'randomize', fn: (s) => shuffle(lines(s)).join('\n') },
  { key: 'removeDuplicates', fn: (s) => [...new Set(lines(s))].join('\n') },
  { key: 'trimLines', fn: (s) => lines(s).map((l) => l.trim()).join('\n') },
]
const lbOps: { key: string; fn: (s: string) => string }[] = [
  { key: 'LF (\\n)', fn: (s) => s.replace(/\r\n|\r/g, '\n') },
  { key: 'CRLF (\\r\\n)', fn: (s) => s.replace(/\r\n|\r|\n/g, '\r\n') },
  { key: 'CR (\\r)', fn: (s) => s.replace(/\r\n|\n/g, '\r') },
]

function lines(s: string) {
  return s.split(/\r\n|\r|\n/)
}
function last(l: string) {
  return l.trim().split(/\s+/).pop() ?? ''
}
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}
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
