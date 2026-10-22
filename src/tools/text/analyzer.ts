/**
 * Text analyzer & utilities: statistics, frequencies, case conversions, line sorting and line-break conversion.
 */

export type LineBreakKind = 'CRLF' | 'LF' | 'CR' | 'mixed' | 'unknown'

export interface TextStats {
  characters: number
  words: number
  lines: number
  sentences: number
  paragraphs: number
  bytes: number
  lineBreak: LineBreakKind
}

const WORD = /[\p{L}\p{N}_'’-]+/gu

export function textStats(v: string): TextStats {
  const crlf = (v.match(/\r\n/g) ?? []).length
  const lf = (v.match(/(?<!\r)\n/g) ?? []).length
  const cr = (v.match(/\r(?!\n)/g) ?? []).length
  const kinds = [crlf && 'CRLF', lf && 'LF', cr && 'CR'].filter((k): k is LineBreakKind => !!k)
  return {
    characters: Array.from(v).length,
    words: v.trim() ? (v.match(WORD) ?? []).length : 0,
    lines: v ? v.split(/\r\n|\r|\n/).length : 0,
    sentences: v.trim() ? (v.match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g) ?? []).filter((s) => s.trim()).length : 0,
    paragraphs: v.trim() ? v.split(/(?:\r?\n){2,}/).filter((p) => p.trim()).length : 0,
    bytes: new TextEncoder().encode(v).length,
    lineBreak: kinds.length === 0 ? 'unknown' : kinds.length === 1 ? kinds[0]! : 'mixed',
  }
}

function topEntries(m: Map<string, number>, limit: number): [string, number][] {
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
}

/** Most frequent words (case-insensitive), most frequent first. */
export function wordFrequency(text: string, limit = 12): [string, number][] {
  const m = new Map<string, number>()
  for (const w of text.toLowerCase().match(WORD) ?? []) m.set(w, (m.get(w) ?? 0) + 1)
  return topEntries(m, limit)
}

/** Most frequent non-whitespace characters (code points), most frequent first. */
export function charFrequency(text: string, limit = 12): [string, number][] {
  const m = new Map<string, number>()
  for (const c of text) if (!/\s/.test(c)) m.set(c, (m.get(c) ?? 0) + 1)
  return topEntries(m, limit)
}

/* ---------------- transforms ---------------- */

export type Transform = (s: string) => string
type Random = () => number

/** Splits identifiers and phrases into words: `fooBar`, `XMLHttp`, `foo_bar`, `foo-bar baz`. */
export function splitWords(s: string): string[] {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()

export type CaseKey =
  | 'sentenceCase'
  | 'lowerCase'
  | 'upperCase'
  | 'titleCase'
  | 'camelCase'
  | 'pascalCase'
  | 'snakeCase'
  | 'constantCase'
  | 'kebabCase'
  | 'cobolCase'
  | 'trainCase'
  | 'alternatingCase'
  | 'inverseCase'
  | 'randomCase'

export function convertCase(key: CaseKey, s: string, random: Random = Math.random): string {
  switch (key) {
    case 'sentenceCase':
      return s.toLowerCase().replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (m) => m.toUpperCase())
    case 'lowerCase':
      return s.toLowerCase()
    case 'upperCase':
      return s.toUpperCase()
    case 'titleCase':
      return s.replace(/\p{L}[\p{L}\p{N}'’]*/gu, (w) => cap(w))
    case 'camelCase':
      return splitWords(s)
        .map((w, i) => (i === 0 ? w.toLowerCase() : cap(w)))
        .join('')
    case 'pascalCase':
      return splitWords(s).map(cap).join('')
    case 'snakeCase':
      return splitWords(s)
        .map((w) => w.toLowerCase())
        .join('_')
    case 'constantCase':
      return splitWords(s)
        .map((w) => w.toUpperCase())
        .join('_')
    case 'kebabCase':
      return splitWords(s)
        .map((w) => w.toLowerCase())
        .join('-')
    case 'cobolCase':
      return splitWords(s)
        .map((w) => w.toUpperCase())
        .join('-')
    case 'trainCase':
      return splitWords(s).map(cap).join('-')
    case 'alternatingCase':
      return Array.from(s)
        .map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase()))
        .join('')
    case 'inverseCase':
      return Array.from(s)
        .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
        .join('')
    case 'randomCase':
      return Array.from(s)
        .map((c) => (random() < 0.5 ? c.toUpperCase() : c.toLowerCase()))
        .join('')
  }
}

export const caseKeys: CaseKey[] = [
  'sentenceCase',
  'lowerCase',
  'upperCase',
  'titleCase',
  'camelCase',
  'pascalCase',
  'snakeCase',
  'constantCase',
  'kebabCase',
  'cobolCase',
  'trainCase',
  'alternatingCase',
  'inverseCase',
  'randomCase',
]

export type LineOpKey =
  | 'alphabetize'
  | 'reverseAlphabetize'
  | 'alphabetizeLast'
  | 'reverseAlphabetizeLast'
  | 'reverse'
  | 'randomize'
  | 'removeDuplicates'
  | 'trimLines'

function lines(s: string) {
  return s.split(/\r\n|\r|\n/)
}

function lastWord(l: string) {
  return l.trim().split(/\s+/).pop() ?? ''
}

export function shuffle<T>(arr: T[], random: Random = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

/** Line operations; the result is always joined with LF. */
export function applyLineOp(key: LineOpKey, s: string, random: Random = Math.random): string {
  const ls = lines(s)
  switch (key) {
    case 'alphabetize':
      return ls.sort((a, b) => a.localeCompare(b)).join('\n')
    case 'reverseAlphabetize':
      return ls.sort((a, b) => b.localeCompare(a)).join('\n')
    case 'alphabetizeLast':
      return ls.sort((a, b) => lastWord(a).localeCompare(lastWord(b))).join('\n')
    case 'reverseAlphabetizeLast':
      return ls.sort((a, b) => lastWord(b).localeCompare(lastWord(a))).join('\n')
    case 'reverse':
      return ls.reverse().join('\n')
    case 'randomize':
      return shuffle(ls, random).join('\n')
    case 'removeDuplicates':
      return [...new Set(ls)].join('\n')
    case 'trimLines':
      return ls.map((l) => l.trim()).join('\n')
  }
}

export const lineOpKeys: LineOpKey[] = [
  'alphabetize',
  'reverseAlphabetize',
  'alphabetizeLast',
  'reverseAlphabetizeLast',
  'reverse',
  'randomize',
  'removeDuplicates',
  'trimLines',
]

export type LineBreak = 'LF' | 'CRLF' | 'CR'

export function convertLineBreaks(s: string, to: LineBreak): string {
  if (to === 'LF') return s.replace(/\r\n|\r/g, '\n')
  if (to === 'CRLF') return s.replace(/\r\n|\r|\n/g, '\r\n')
  return s.replace(/\r\n|\n/g, '\r')
}
