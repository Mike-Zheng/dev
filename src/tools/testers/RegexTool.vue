<script setup lang="ts">
import { computed, ref } from 'vue'
import { CaseSensitive, Rows3, Dot, Globe, ListChecks, ChevronDown } from 'lucide-vue-next'
import ConfigSection from '@/components/ui/ConfigSection.vue'
import SettingCard from '@/components/ui/SettingCard.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import CodeEditor from '@/components/ui/CodeEditor.vue'
import TextInput from '@/components/ui/TextInput.vue'
import InfoBar from '@/components/ui/InfoBar.vue'
import { useI18n } from '@/i18n'
import { useSettings } from '@/composables/useSettings'

const { t } = useI18n()
const tt = (k: string, p?: Record<string, string | number>) => t(`tools.regex.${k}`, p)
const { editorFontSize } = useSettings()

const pattern = ref('')
const text = ref('')
const ignoreCase = ref(false)
const multiline = ref(true)
const singleline = ref(false)
const allMatches = ref(true)
const unicode = ref(false)
const showCheat = ref(false)

interface MatchRow {
  index: number
  value: string
  start: number
  end: number
  groups: { name: string; value: string }[]
}

const compiled = computed<{ re: RegExp | null; error: string }>(() => {
  if (!pattern.value) return { re: null, error: '' }
  let flags = 'd'
  if (ignoreCase.value) flags += 'i'
  if (multiline.value) flags += 'm'
  if (singleline.value) flags += 's'
  if (allMatches.value) flags += 'g'
  if (unicode.value) flags += 'u'
  try {
    return { re: new RegExp(pattern.value, flags), error: '' }
  } catch (e) {
    return { re: null, error: `${tt('invalid')}: ${(e as Error).message}` }
  }
})

const matches = computed<MatchRow[]>(() => {
  const re = compiled.value.re
  if (!re || !text.value) return []
  const rows: MatchRow[] = []
  const src = text.value
  if (!re.global) {
    const m = re.exec(src)
    if (m) rows.push(toRow(m, 0))
    return rows
  }
  re.lastIndex = 0
  let m: RegExpExecArray | null
  let guard = 0
  while ((m = re.exec(src)) !== null && guard++ < 10000) {
    rows.push(toRow(m, rows.length))
    if (m[0] === '') re.lastIndex++
  }
  return rows
})

function toRow(m: RegExpExecArray, index: number): MatchRow {
  const groups: { name: string; value: string }[] = []
  for (let i = 1; i < m.length; i++) groups.push({ name: String(i), value: m[i] ?? '' })
  if (m.groups) for (const [k, v] of Object.entries(m.groups)) groups.push({ name: k, value: v ?? '' })
  return { index, value: m[0], start: m.index, end: m.index + m[0].length, groups }
}

/** Text split into highlighted segments for rendering. */
const segments = computed<{ text: string; hit: boolean }[]>(() => {
  const src = text.value
  const out: { text: string; hit: boolean }[] = []
  let pos = 0
  for (const m of matches.value) {
    if (m.start > pos) out.push({ text: src.slice(pos, m.start), hit: false })
    out.push({ text: src.slice(m.start, m.end), hit: true })
    pos = m.end
  }
  if (pos < src.length) out.push({ text: src.slice(pos), hit: false })
  return out
})

const cheat = computed(() => [
  { cat: tt('cs_anchors'), items: [['^', 'Beginning'], ['$', 'End'], ['\\b', 'Word boundary'], ['\\B', 'Not word boundary']] },
  { cat: tt('cs_classes'), items: [['.', 'Any character except newline'], ['\\w \\d \\s', 'Word, digit, whitespace'], ['\\W \\D \\S', 'Not word, digit, whitespace'], ['[abc]', 'Any of a, b, or c'], ['[^abc]', 'Not a, b, or c'], ['[a-z]', 'Character between a and z']] },
  { cat: tt('cs_groups'), items: [['(abc)', 'Capturing group'], ['(?<name>abc)', 'Named capturing group'], ['(?:abc)', 'Non-capturing group'], ['\\1', 'Numeric reference'], ['\\k<name>', 'Named reference']] },
  { cat: tt('cs_quant'), items: [['a*', '0 or more'], ['a+', '1 or more'], ['a?', '0 or 1'], ['a{3}', 'Exactly 3'], ['a{3,}', '3 or more'], ['a{1,3}', 'Between 1 and 3'], ['a*?', 'Lazy'], ['ab|cd', 'Alternation']] },
  { cat: tt('cs_look'), items: [['(?=abc)', 'Positive lookahead'], ['(?!abc)', 'Negative lookahead'], ['(?<=abc)', 'Positive lookbehind'], ['(?<!abc)', 'Negative lookbehind']] },
  { cat: tt('cs_escaped'), items: [['\\.', 'Escaped character'], ['\\t \\n \\r', 'Tab, line feed, carriage return'], ['\\uFFFF', 'Unicode escape'], ['\\xFF', 'Hexadecimal escape']] },
])
</script>

<template>
  <div class="space-y-6">
    <ConfigSection :title="t('common.options')">
      <div class="grid gap-2 md:grid-cols-2">
        <SettingCard :icon="CaseSensitive" :title="tt('ignoreCase')" :description="tt('ignoreCaseDesc')">
          <BaseSwitch v-model="ignoreCase" />
        </SettingCard>
        <SettingCard :icon="Rows3" :title="tt('multiline')" :description="tt('multilineDesc')">
          <BaseSwitch v-model="multiline" />
        </SettingCard>
        <SettingCard :icon="Dot" :title="tt('singleline')" :description="tt('singlelineDesc')">
          <BaseSwitch v-model="singleline" />
        </SettingCard>
        <SettingCard :icon="ListChecks" :title="tt('allMatches')" :description="tt('allMatchesDesc')">
          <BaseSwitch v-model="allMatches" />
        </SettingCard>
        <SettingCard :icon="Globe" :title="tt('unicode')" :description="tt('unicodeDesc')">
          <BaseSwitch v-model="unicode" />
        </SettingCard>
      </div>
    </ConfigSection>

    <div class="space-y-1.5">
      <label class="text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('pattern') }}</label>
      <div class="flex items-center gap-2">
        <span class="font-mono text-fg-faint">/</span>
        <TextInput v-model="pattern" mono placeholder="([A-Z])\w+" :invalid="!!compiled.error" />
        <span class="font-mono text-fg-faint">/{{ compiled.re?.flags.replace('d', '') ?? '' }}</span>
      </div>
    </div>

    <InfoBar v-if="compiled.error" severity="error" :title="compiled.error" />

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeEditor v-model="text" :label="tt('text')" height-class="min-h-[18rem]" />

      <div class="flex flex-col rounded-card border border-line bg-surface overflow-hidden">
        <div class="flex items-center gap-1 border-b border-line bg-surface-2/60 px-2 py-1.5 min-h-[38px]">
          <span class="px-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ tt('matchInfo') }}</span>
          <span class="flex-1" />
          <span class="px-1.5 text-xs text-fg-muted">{{ pattern && text ? (matches.length ? tt('matches', { count: matches.length }) : tt('noMatch')) : '' }}</span>
        </div>
        <pre class="whitespace-pre-wrap break-words px-3 py-2.5 font-mono leading-relaxed text-fg max-h-[14rem] overflow-auto border-b border-line min-h-[6rem]" :style="{ fontSize: editorFontSize + 'px' }"><template v-for="(s, i) in segments" :key="i"><mark v-if="s.hit" class="rounded bg-accent-soft text-accent ring-1 ring-accent/30">{{ s.text }}</mark><template v-else>{{ s.text }}</template></template></pre>
        <div class="flex-1 overflow-auto max-h-[16rem]">
          <table v-if="matches.length" class="w-full text-xs">
            <tbody>
              <template v-for="m in matches" :key="m.index">
                <tr class="border-b border-line bg-surface-2/40">
                  <td class="px-3 py-1.5 font-semibold text-fg whitespace-nowrap">{{ tt('match') }} {{ m.index + 1 }}</td>
                  <td class="px-3 py-1.5 font-mono text-fg break-all">{{ m.value }}</td>
                  <td class="px-3 py-1.5 font-mono text-fg-muted whitespace-nowrap">{{ m.start }}-{{ m.end }}</td>
                </tr>
                <tr v-for="g in m.groups" :key="g.name" class="border-b border-line last:border-0">
                  <td class="px-3 py-1 pl-6 text-fg-muted whitespace-nowrap">{{ tt('group') }} {{ g.name }}</td>
                  <td class="px-3 py-1 font-mono text-fg break-all" colspan="2">{{ g.value }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="rounded-card border border-line bg-surface">
      <button type="button" class="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-fg" @click="showCheat = !showCheat">
        <ChevronDown class="h-4 w-4 text-fg-muted transition-transform" :class="showCheat ? 'rotate-180' : ''" />
        {{ t('common.cheatSheet') }}
      </button>
      <div v-if="showCheat" class="grid gap-x-6 gap-y-4 border-t border-line p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="c in cheat" :key="c.cat">
          <div class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted">{{ c.cat }}</div>
          <div v-for="it in c.items" :key="it[0]" class="flex gap-3 py-0.5 text-sm">
            <code class="w-28 shrink-0 font-mono text-accent">{{ it[0] }}</code>
            <span class="text-fg-muted">{{ it[1] }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
