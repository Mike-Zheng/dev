<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowUpFromLine, Copy, Eraser, FileText, Hash, ListFilter, WrapText } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import IconButton from '@/components/ui/IconButton.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { useClipboard } from '@/composables/useClipboard'
import {
  decodeField,
  decodeMixed,
  defaultOptions,
  encodeField,
  extractEscapes,
  separateEscapes,
  type CodecError,
  type CodecOptions,
  type FieldId,
  type NumberMode,
} from './unicodeCodec'

const { t } = useI18n()
const tt = (k: string, p?: Record<string, string>) => t(`tools.unicode.${k}`, p)
const { copy } = useClipboard()

type BoolOption = { [K in keyof CodecOptions]: CodecOptions[K] extends boolean ? K : never }[keyof CodecOptions]

interface FieldDef {
  id: FieldId
  wide?: boolean
  toggles?: { key: BoolOption; label: string }[]
  pad?: boolean
  separate?: boolean
}

const fields: FieldDef[] = [
  { id: 'chars', wide: true },
  { id: 'html', wide: true, toggles: [{ key: 'htmlInvisibles', label: 'invisibles' }, { key: 'htmlBidi', label: 'bidi' }] },
  { id: 'hexNcr', toggles: [{ key: 'hexNcrAscii', label: 'showAscii' }] },
  { id: 'decNcr', toggles: [{ key: 'decNcrAscii', label: 'showAscii' }] },
  {
    id: 'js',
    toggles: [
      { key: 'jsEs6', label: 'es6' },
      { key: 'jsCStyle', label: 'cStyle' },
      { key: 'jsEscNl', label: 'escNl' },
    ],
  },
  { id: 'rust', toggles: [{ key: 'rustEscNl', label: 'escNl' }] },
  { id: 'css' },
  { id: 'perl', toggles: [{ key: 'perlEscNl', label: 'escNl' }] },
  { id: 'percent', wide: true },
  { id: 'uhex', toggles: [{ key: 'uhexAscii', label: 'showAscii' }], separate: true },
  { id: 'zerox', toggles: [{ key: 'zeroxAscii', label: 'showAscii' }], separate: true },
  { id: 'utf8' },
  { id: 'utf16' },
  { id: 'hexcp', toggles: [{ key: 'hexcpAscii', label: 'keepAscii' }], pad: true },
  { id: 'deccp', toggles: [{ key: 'deccpAscii', label: 'keepAscii' }] },
]

const numberMode = ref<NumberMode>('none')
const numberOptions = computed(() =>
  (['none', 'hex', 'dec', 'utf8', 'utf16'] as const).map((value) => ({ value, label: tt(`num_${value}`) })),
)
const shortEscapes = ref(true)
const padOptions = [2, 4, 8].map((value) => ({ value, label: String(value) }))

const opts = reactive<CodecOptions>({ ...defaultOptions })
const input = ref('')
const texts = reactive(Object.fromEntries(fields.map((f) => [f.id, ''])) as Record<FieldId, string>)
const errors = ref<CodecError[]>([])

/** Write `str` into every box except the one the conversion came from. */
function render(str: string, except?: FieldId) {
  for (const f of fields) if (f.id !== except) texts[f.id] = encodeField(f.id, str, opts)
}

function convertInput() {
  const d = decodeMixed(input.value, numberMode.value, shortEscapes.value)
  errors.value = d.errors
  render(d.text)
}

watch([input, numberMode, shortEscapes], convertInput)

function convertFrom(id: FieldId) {
  const d = decodeField(id, texts[id], opts)
  errors.value = d.errors
  render(d.text, id)
}

/** Re-express a box's own content after one of its options changed. */
function reformat(id: FieldId, before: CodecOptions) {
  texts[id] = encodeField(id, decodeField(id, texts[id], before).text, opts)
}

function toggle(id: FieldId, key: BoolOption) {
  const before = { ...opts }
  opts[key] = !opts[key]
  // ES6 and C-style are alternative ways to write supplementary characters.
  if (key === 'jsEs6' && opts.jsEs6) opts.jsCStyle = false
  if (key === 'jsCStyle' && opts.jsCStyle) opts.jsEs6 = false
  reformat(id, before)
}

function setPad(pad: number) {
  const before = { ...opts }
  opts.hexcpPad = pad as CodecOptions['hexcpPad']
  reformat('hexcp', before)
}

function clearAll() {
  input.value = ''
  for (const f of fields) texts[f.id] = ''
  errors.value = []
}

function extract() {
  input.value = extractEscapes(input.value, numberMode.value)
}

const SAMPLE = [
  'Plain: naïve café 國際 👽',
  'U+hex: U+0063U+0061U+0066U+00E9 U+1F47D  0x...: 0x570B0x969B',
  'NCRs: &#x570B;&#x969B; &#22283;&#38555; &eacute;&rlm;',
  'JS: \\u00E7\\uD83D\\uDC7D \\u{1F47D}  C: \\U0001F47D  Rust: \\u{E7 570B 1F47D}  Perl: \\x{1F47D}',
  'CSS: \\00E7 \\01F47D   URI: %E5%9C%8B%E9%9A%9B%F0%9F%91%BD',
  'Escapes:\\tTab\\x09\\n',
].join('\n')

function loadSample() {
  input.value = SAMPLE
}

const route = useRoute()
if (typeof route.query.q === 'string') {
  input.value = route.query.q
  convertInput()
}

const errorText = computed(() => {
  const seen = new Set<string>()
  const lines: string[] = []
  for (const e of errors.value) {
    const line = tt(`err_${e.code}`, { value: e.value })
    if (seen.has(line)) continue
    seen.add(line)
    lines.push(line)
  }
  const more = lines.length > 5 ? ` ${tt('errMore', { count: String(lines.length - 5) })}` : ''
  return lines.slice(0, 5).join(' · ') + more
})

const chip = (on: boolean) => [
  'inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] font-medium whitespace-nowrap transition-colors focus-ring disabled:opacity-40 disabled:pointer-events-none',
  on ? 'border-accent/40 bg-accent-soft text-accent' : 'border-line text-fg-muted hover:text-fg hover:bg-surface-3',
]
</script>

<template>
  <div class="space-y-6">
    <ConfigSection>
      <SettingCard :icon="Hash" :title="tt('numbers')" :description="tt('numbersDesc')" stacked>
        <BaseSelect v-model="numberMode" :options="numberOptions" />
      </SettingCard>
      <SettingCard :icon="WrapText" :title="tt('shortEscapes')" :description="tt('shortEscapesDesc')">
        <BaseSwitch v-model="shortEscapes" :on-label="t('common.on')" :off-label="t('common.off')" />
      </SettingCard>
    </ConfigSection>

    <CodeEditor v-model="input" :label="t('common.input')" :placeholder="tt('placeholder')" height-class="min-h-[8rem]">
      <template #actions>
        <button type="button" :class="chip(false)" :title="tt('sampleDesc')" @click="loadSample">
          <FileText class="h-3.5 w-3.5" />{{ tt('sample') }}
        </button>
        <button type="button" :class="chip(false)" :title="tt('extractDesc')" :disabled="!input" @click="extract">
          <ListFilter class="h-3.5 w-3.5" />{{ tt('extract') }}
        </button>
        <IconButton size="sm" :title="tt('clearAll')" @click="clearAll"><Eraser class="h-4 w-4" /></IconButton>
      </template>
    </CodeEditor>

    <InfoBar v-if="errors.length" severity="warning" :title="tt('errTitle')" :message="errorText" />

    <div class="grid gap-4 lg:grid-cols-2">
      <div v-for="f in fields" :key="f.id" :class="f.wide ? 'lg:col-span-2' : ''">
        <CodeEditor
          v-model="texts[f.id]"
          :label="tt(`f_${f.id}`)"
          :mono="f.id !== 'chars'"
          :show-stats="false"
          no-actions
          height-class="min-h-[5.5rem]"
        >
          <template #actions>
            <button
              v-for="tg in f.toggles"
              :key="tg.key"
              type="button"
              :class="chip(opts[tg.key])"
              :aria-pressed="opts[tg.key]"
              :title="tt(`${tg.label}Desc`)"
              @click="toggle(f.id, tg.key)"
            >
              {{ tt(tg.label) }}
            </button>
            <label v-if="f.pad" class="inline-flex items-center gap-1.5 text-[11px] font-medium text-fg-muted" :title="tt('padDesc')">
              {{ tt('pad') }}
              <BaseSelect :model-value="opts.hexcpPad" :options="padOptions" size="sm" @update:model-value="setPad" />
            </label>
            <button
              v-if="f.separate"
              type="button"
              :class="chip(false)"
              :title="tt('separateDesc')"
              :disabled="!texts[f.id]"
              @click="texts[f.id] = separateEscapes(f.id as 'uhex' | 'zerox', texts[f.id])"
            >
              {{ tt('separate') }}
            </button>
            <IconButton size="sm" :title="t('common.copy')" :disabled="!texts[f.id]" @click="copy(texts[f.id])"><Copy class="h-4 w-4" /></IconButton>
            <button
              type="button"
              :class="chip(false)"
              :title="tt('convertFromDesc')"
              :disabled="!texts[f.id]"
              @click="convertFrom(f.id)"
            >
              <ArrowUpFromLine class="h-3.5 w-3.5" /><span class="hidden sm:inline">{{ tt('convert') }}</span>
            </button>
          </template>
        </CodeEditor>
      </div>
    </div>
  </div>
</template>
