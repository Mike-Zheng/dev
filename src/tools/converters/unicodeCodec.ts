/**
 * Unicode code converter: turns characters into many escape / code-unit notations and back.
 * Behaviour follows r12a's "Unicode code converter" (https://r12a.github.io/app-conversion/).
 * Decoding is a single left-to-right scan, so the output of one escape is never re-read as another.
 */

export type FieldId =
  | 'chars'
  | 'html'
  | 'hexNcr'
  | 'decNcr'
  | 'js'
  | 'rust'
  | 'css'
  | 'perl'
  | 'percent'
  | 'uhex'
  | 'zerox'
  | 'utf8'
  | 'utf16'
  | 'hexcp'
  | 'deccp'

export type NumberMode = 'none' | 'hex' | 'dec' | 'utf8' | 'utf16'

export interface CodecOptions {
  htmlInvisibles: boolean
  htmlBidi: boolean
  hexNcrAscii: boolean
  decNcrAscii: boolean
  jsEs6: boolean
  jsCStyle: boolean
  jsEscNl: boolean
  rustEscNl: boolean
  perlEscNl: boolean
  uhexAscii: boolean
  zeroxAscii: boolean
  hexcpAscii: boolean
  hexcpPad: 2 | 4 | 8
  deccpAscii: boolean
}

export const defaultOptions: CodecOptions = {
  htmlInvisibles: true,
  htmlBidi: false,
  hexNcrAscii: true,
  decNcrAscii: true,
  jsEs6: true,
  jsCStyle: false,
  jsEscNl: false,
  rustEscNl: false,
  perlEscNl: false,
  uhexAscii: true,
  zeroxAscii: true,
  hexcpAscii: false,
  hexcpPad: 4,
  deccpAscii: false,
}

export interface CodecError {
  code: 'range' | 'utf8' | 'utf16' | 'number'
  value: string
}

export interface Decoded {
  text: string
  errors: CodecError[]
}

// ---------------------------------------------------------------- helpers

const MAX_CP = 0x10ffff

function hex(n: number, pad = 0): string {
  return n.toString(16).toUpperCase().padStart(pad, '0')
}

function cps(str: string): number[] {
  return Array.from(str, (ch) => ch.codePointAt(0) ?? 0)
}

const isAscii = (cp: number) => cp <= 0x7f

const utf8Encoder = new TextEncoder()

function utf8Bytes(str: string): Uint8Array {
  return utf8Encoder.encode(str)
}

// ---------------------------------------------------------------- scanning

class Scanner {
  errors: CodecError[] = []

  fromCodePoint(n: number, raw: string): string {
    if (Number.isNaN(n) || n > MAX_CP) {
      this.errors.push({ code: 'range', value: raw })
      return raw
    }
    return String.fromCodePoint(n)
  }

  fromHex(h: string, raw: string): string {
    return this.fromCodePoint(parseInt(h, 16), raw)
  }

  fromUtf8(bytes: number[], raw: string): string {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes))
    } catch {
      this.errors.push({ code: 'utf8', value: raw.trim() })
      return new TextDecoder('utf-8').decode(new Uint8Array(bytes))
    }
  }

  fromUtf16(units: number[], raw: string): string {
    const big = units.find((u) => u > 0xffff)
    if (big !== undefined) {
      this.errors.push({ code: 'range', value: hex(big) })
      return raw
    }
    const s = String.fromCharCode(...units)
    const fixed = s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, (m) => {
      this.errors.push({ code: 'utf16', value: hex(m.charCodeAt(0), 4) })
      return '\uFFFD'
    })
    return fixed
  }
}

/** A rule tries to read one escape at `re.lastIndex`; `re` must be sticky. */
interface Rule {
  re: RegExp
  convert: (m: RegExpExecArray, sc: Scanner) => string | null
}

function scan(input: string, rules: Rule[]): Decoded {
  const sc = new Scanner()
  let out = ''
  let i = 0
  outer: while (i < input.length) {
    for (const rule of rules) {
      rule.re.lastIndex = i
      const m = rule.re.exec(input)
      if (!m) continue
      const v = rule.convert(m, sc)
      if (v === null) continue
      out += v
      i += m[0].length
      continue outer
    }
    out += input[i]
    i++
  }
  return { text: out, errors: sc.errors }
}

const W = '[\\p{L}\\p{N}_]'

let entityBox: HTMLTextAreaElement | null = null
const entityCache = new Map<string, string | null>()

/** Resolve an HTML named character reference with the browser's own entity table. */
function decodeEntity(name: string): string | null {
  const cached = entityCache.get(name)
  if (cached !== undefined) return cached
  let value: string | null = null
  if (typeof document !== 'undefined') {
    entityBox ??= document.createElement('textarea')
    entityBox.innerHTML = `&${name};`
    value = entityBox.value === `&${name};` ? null : entityBox.value
  }
  entityCache.set(name, value)
  return value
}

const SHORT_ESCAPES: Record<string, string> = {
  '0': '\0',
  b: '\b',
  t: '\t',
  n: '\n',
  v: '\v',
  f: '\f',
  r: '\r',
  "'": "'",
  '"': '"',
  '\\': '\\',
}

const R = {
  hexNcr: { re: /&#[xX]([0-9a-fA-F]{1,6});/y, convert: (m, sc) => sc.fromHex(m[1], m[0]) },
  decNcr: { re: /&#([0-9]{1,7});/y, convert: (m, sc) => sc.fromCodePoint(parseInt(m[1], 10), m[0]) },
  entity: { re: /&([A-Za-z][A-Za-z0-9]*);/y, convert: (m) => decodeEntity(m[1]) },
  uplus: { re: /[Uu]\+(10[0-9a-fA-F]{4}|[0-9a-fA-F]{1,5})/y, convert: (m, sc) => sc.fromHex(m[1], m[0]) },
  // Stop before a following "0x" so 0x1F4680x200D reads as two escapes.
  zerox: { re: /0x((?:(?!0x)[0-9a-fA-F]){1,6})/y, convert: (m, sc) => sc.fromHex(m[1], m[0]) },
  uBrace: { re: /\\u\{([0-9a-fA-F]{1,8})\}/y, convert: (m, sc) => sc.fromHex(m[1], m[0]) },
  uBraceSeq: {
    re: /\\u\{ *([0-9a-fA-F]{1,8}(?: +[0-9a-fA-F]{1,8})*) *\}/y,
    convert: (m, sc) => m[1].split(/ +/).map((h) => sc.fromHex(h, h)).join(''),
  },
  xBrace: { re: /\\x\{([0-9a-fA-F]{1,8})\}/y, convert: (m, sc) => sc.fromHex(m[1], m[0]) },
  bigU: { re: /\\U([0-9a-fA-F]{8})/y, convert: (m, sc) => sc.fromHex(m[1], m[0]) },
  u4: { re: /\\u([0-9a-fA-F]{4})/y, convert: (m, sc) => sc.fromHex(m[1], m[0]) },
  x2: { re: /\\x([0-9a-fA-F]{2})/y, convert: (m, sc) => sc.fromHex(m[1], m[0]) },
  // In mixed input, require 2+ digits so \b, \f etc. are not read as CSS escapes.
  cssMixed: { re: /\\([0-9a-fA-F]{2,6})(?:\r\n|[ \t\n\r\f])?/y, convert: (m, sc) => sc.fromHex(m[1], m[0]) },
  css: { re: /\\([0-9a-fA-F]{1,6})(?:\r\n|[ \t\n\r\f])?/y, convert: (m, sc) => sc.fromHex(m[1], m[0]) },
  cssChar: { re: /\\([^\n])/y, convert: (m) => m[1] },
  percent: {
    re: /(?:%[0-9a-fA-F]{2})+/y,
    convert: (m, sc) => sc.fromUtf8(m[0].slice(1).split('%').map((b) => parseInt(b, 16)), m[0]),
  },
  short: { re: /\\(0(?![0-9])|[btnvfr'"\\])/y, convert: (m) => SHORT_ESCAPES[m[1]] },
} satisfies Record<string, Rule>

/** A whitespace-separated run of numbers standing on word boundaries. */
function numberRun(digit: string, min: number, max: number, sep = '[ \\t]+'): RegExp {
  const n = `${digit}{${min},${max}}`
  return new RegExp(`(?<!${W})${n}(?:${sep}${n})*(?!${W})`, 'uy')
}

const NUMBER_RULES: Record<Exclude<NumberMode, 'none'>, Rule> = {
  hex: {
    re: numberRun('[0-9a-fA-F]', 2, 8),
    convert: (m, sc) => m[0].split(/[ \t]+/).map((h) => sc.fromHex(h, h)).join(''),
  },
  dec: {
    re: numberRun('[0-9]', 1, 8),
    convert: (m, sc) => m[0].split(/[ \t]+/).map((d) => sc.fromCodePoint(parseInt(d, 10), d)).join(''),
  },
  utf8: {
    re: numberRun('[0-9a-fA-F]', 2, 2, '\\s+'),
    convert: (m, sc) => sc.fromUtf8(m[0].split(/\s+/).map((b) => parseInt(b, 16)), m[0]),
  },
  utf16: {
    re: numberRun('[0-9a-fA-F]', 1, 4, '\\s+'),
    convert: (m, sc) => sc.fromUtf16(m[0].split(/\s+/).map((u) => parseInt(u, 16)), m[0]),
  },
}

const MIXED_RULES: Rule[] = [
  R.hexNcr,
  R.decNcr,
  R.entity,
  R.uplus,
  R.zerox,
  R.uBraceSeq,
  R.xBrace,
  R.bigU,
  R.u4,
  R.x2,
  R.cssMixed,
  R.percent,
]

/** Decode every recognised escape in free text (the main input box). */
export function decodeMixed(input: string, numbers: NumberMode, shortEscapes: boolean): Decoded {
  const rules = [...MIXED_RULES]
  if (shortEscapes) rules.push(R.short)
  if (numbers !== 'none') rules.push(NUMBER_RULES[numbers])
  return scan(input, rules)
}

/** Keep only the escapes (and, in hex / dec mode, the bare numbers) of the input. */
export function extractEscapes(input: string, numbers: NumberMode): string {
  const rules: Rule[] = MIXED_RULES.filter((r) => r !== R.entity)
  if (numbers === 'dec') rules.push(NUMBER_RULES.dec)
  else if (numbers !== 'none') rules.push(NUMBER_RULES.hex)
  const found: string[] = []
  let i = 0
  outer: while (i < input.length) {
    for (const rule of rules) {
      rule.re.lastIndex = i
      const m = rule.re.exec(input)
      if (!m) continue
      found.push(m[0])
      i += m[0].length
      continue outer
    }
    i++
  }
  return found.join(' ')
}

/** Space-separated list of numbers; anything that isn't one is reported and kept as is. */
function decodeNumberList(input: string, parse: (tok: string) => number, sc: Scanner): string {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => {
      const n = parse(tok)
      if (Number.isNaN(n)) {
        sc.errors.push({ code: 'number', value: tok })
        return tok
      }
      return sc.fromCodePoint(n, tok)
    })
    .join('')
}

function parseHex(tok: string): number {
  return /^(?:0x|U\+)?[0-9a-fA-F]{1,8}$/i.test(tok) ? parseInt(tok.replace(/^(?:0x|U\+)/i, ''), 16) : NaN
}

function parseDec(tok: string): number {
  return /^[0-9]{1,8}$/.test(tok) ? parseInt(tok, 10) : NaN
}

function decodeUnits(input: string, width: number, toChars: (units: number[], raw: string, sc: Scanner) => string): Decoded {
  const sc = new Scanner()
  const toks = input.trim().split(/\s+/).filter(Boolean)
  const units: number[] = []
  for (const tok of toks) {
    if (new RegExp(`^[0-9a-fA-F]{1,${width}}$`).test(tok)) units.push(parseInt(tok, 16))
    else sc.errors.push({ code: 'number', value: tok })
  }
  return { text: units.length ? toChars(units, input, sc) : '', errors: sc.errors }
}

/** Decode the content of one specific box, recognising only that box's notation. */
export function decodeField(id: FieldId, input: string, o: CodecOptions): Decoded {
  switch (id) {
    case 'chars':
      return { text: input, errors: [] }
    case 'html':
      return scan(input, [R.hexNcr, R.decNcr, R.entity])
    case 'hexNcr':
      return scan(input, [R.hexNcr])
    case 'decNcr':
      return scan(input, [R.decNcr])
    case 'js':
      return scan(input, [R.uBrace, R.bigU, R.u4, R.x2, R.short])
    case 'rust':
      return scan(input, [R.uBraceSeq, R.x2, R.short])
    case 'perl':
      return scan(input, [R.xBrace, R.x2, R.short])
    case 'css':
      return scan(input, [R.css, R.cssChar])
    case 'percent':
      return scan(input, [R.percent])
    case 'uhex':
      return scan(input, [R.uplus])
    case 'zerox':
      return scan(input, [R.zerox])
    case 'utf8':
      return decodeUnits(input, 2, (b, raw, sc) => sc.fromUtf8(b, raw))
    case 'utf16':
      return decodeUnits(input, 4, (u, raw, sc) => sc.fromUtf16(u, raw))
    case 'hexcp':
      if (o.hexcpAscii) return scan(input, [NUMBER_RULES.hex])
      return listDecoded(input, parseHex)
    case 'deccp':
      if (o.deccpAscii) return scan(input, [NUMBER_RULES.dec])
      return listDecoded(input, parseDec)
  }
}

function listDecoded(input: string, parse: (tok: string) => number): Decoded {
  const sc = new Scanner()
  return { text: decodeNumberList(input, parse, sc), errors: sc.errors }
}

// ---------------------------------------------------------------- encoding

const HTML_SYNTAX: Record<string, string> = { '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }

const BIDI_MARKUP: Record<number, string> = {
  0x202a: '<span dir="ltr">', // LRE
  0x202b: '<span dir="rtl">', // RLE
  0x202c: '</span>', // PDF
  0x2066: '<span dir="ltr">', // LRI
  0x2067: '<span dir="rtl">', // RLI
  0x2068: '<span dir="auto">', // FSI
  0x2069: '</span>', // PDI
}

// Controls, format characters, non-ASCII spaces and other default-ignorables are easy to miss in source.
const INVISIBLE = /[\p{Cc}\p{Cf}\p{Zs}\p{Zl}\p{Zp}\p{Default_Ignorable_Code_Point}]/u

function isInvisible(ch: string): boolean {
  return ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r' && INVISIBLE.test(ch)
}

const escapeHtmlSyntax = (s: string) => s.replace(/[&"<>]/g, (c) => HTML_SYNTAX[c])

function encodeHtml(str: string, o: CodecOptions): string {
  let out = ''
  for (const ch of str) {
    const cp = ch.codePointAt(0) ?? 0
    if (o.htmlBidi && BIDI_MARKUP[cp]) out += escapeHtmlSyntax(BIDI_MARKUP[cp])
    else if (HTML_SYNTAX[ch]) out += HTML_SYNTAX[ch]
    else if (o.htmlInvisibles && isInvisible(ch)) out += `&#x${hex(cp, 4)};`
    else out += ch
  }
  return out
}

function encodeEach(str: string, keepAscii: boolean, fmt: (cp: number) => string): string {
  let out = ''
  for (const ch of str) {
    const cp = ch.codePointAt(0) ?? 0
    out += keepAscii && isAscii(cp) ? ch : fmt(cp)
  }
  return out
}

const ALWAYS_ESCAPED: Record<number, string> = { 0: '\\0', 8: '\\b', 11: '\\v', 12: '\\f', 92: '\\\\' }
const NL_ESCAPED: Record<number, string> = { 9: '\\t', 10: '\\n', 13: '\\r', 34: '\\"', 39: "\\'" }

/** Short escape for cp, if it has one; `nl` also escapes tab, newlines and quotes. */
function shortEscape(cp: number, nl: boolean): string | undefined {
  return ALWAYS_ESCAPED[cp] ?? (nl ? NL_ESCAPED[cp] : undefined)
}

const isPrintable = (cp: number) => (cp >= 0x20 && cp <= 0x7e) || cp === 9 || cp === 10 || cp === 13

function encodeBackslash(str: string, nl: boolean, fmt: (cp: number, ch: string) => string): string {
  let out = ''
  for (const ch of str) {
    const cp = ch.codePointAt(0) ?? 0
    out += shortEscape(cp, nl) ?? (isPrintable(cp) ? ch : fmt(cp, ch))
  }
  return out
}

function encodeJs(str: string, o: CodecOptions): string {
  return encodeBackslash(str, o.jsEscNl, (cp) => {
    if (cp > 0xffff) {
      if (o.jsCStyle) return `\\U${hex(cp, 8)}`
      if (o.jsEs6) return `\\u{${hex(cp)}}`
      const v = cp - 0x10000
      return `\\u${hex(0xd800 | (v >> 10))}\\u${hex(0xdc00 | (v & 0x3ff))}`
    }
    return o.jsEs6 ? `\\u{${hex(cp)}}` : `\\u${hex(cp, 4)}`
  })
}

const isC1 = (cp: number) => cp >= 0x7f && cp <= 0x9f

function encodeCss(str: string): string {
  let out = ''
  for (const ch of str) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp === 0x5c) out += '\\\\'
    else if (isPrintable(cp)) out += ch
    else out += `\\${hex(cp, cp > 0xffff ? 6 : 4)} `
  }
  return out
}

function encodePercent(str: string): string {
  let out = ''
  for (const ch of str) {
    if (/^[A-Za-z0-9\-._~]$/.test(ch)) out += ch
    else for (const b of utf8Bytes(ch)) out += '%' + hex(b, 2)
  }
  return out
}

/** Code point numbers; with keepAscii, ASCII stays as is and only adjacent numbers get a space. */
function encodeNumbers(str: string, keepAscii: boolean, fmt: (cp: number) => string): string {
  const list = cps(str)
  if (!keepAscii) return list.map(fmt).join(' ')
  let out = ''
  list.forEach((cp, i) => {
    if (isAscii(cp)) {
      out += String.fromCodePoint(cp)
      return
    }
    out += fmt(cp)
    const next = list[i + 1]
    if (next !== undefined && !isAscii(next)) out += ' '
  })
  return out
}

export function encodeField(id: FieldId, str: string, o: CodecOptions): string {
  switch (id) {
    case 'chars':
      return str
    case 'html':
      return encodeHtml(str, o)
    case 'hexNcr':
      return encodeEach(str, o.hexNcrAscii, (cp) => `&#x${hex(cp, 4)};`)
    case 'decNcr':
      return encodeEach(str, o.decNcrAscii, (cp) => `&#${cp};`)
    case 'js':
      return encodeJs(str, o)
    case 'rust':
      // Rust only allows \x up to 7F.
      return encodeBackslash(str, o.rustEscNl, (cp) => (cp <= 0x7f ? `\\x${hex(cp, 2)}` : `\\u{${hex(cp)}}`))
    case 'perl':
      return encodeBackslash(str, o.perlEscNl, (cp) => (cp < 0x20 || isC1(cp) ? `\\x${hex(cp, 2)}` : `\\x{${hex(cp)}}`))
    case 'css':
      return encodeCss(str)
    case 'percent':
      return encodePercent(str)
    case 'uhex':
      return encodeEach(str, o.uhexAscii, (cp) => `U+${hex(cp, 4)}`)
    case 'zerox':
      return encodeEach(str, o.zeroxAscii, (cp) => `0x${hex(cp)}`)
    case 'utf8':
      return Array.from(utf8Bytes(str), (b) => hex(b, 2)).join(' ')
    case 'utf16':
      return Array.from({ length: str.length }, (_, i) => hex(str.charCodeAt(i), 4)).join(' ')
    case 'hexcp':
      return encodeNumbers(str, o.hexcpAscii, (cp) => hex(cp, o.hexcpPad))
    case 'deccp':
      return encodeNumbers(str, o.deccpAscii, (cp) => String(cp))
  }
}

/** Insert a space between adjacent U+ / 0x escapes. */
export function separateEscapes(id: 'uhex' | 'zerox', text: string): string {
  return id === 'uhex' ? text.replace(/([0-9a-fA-F])(?=[Uu]\+)/g, '$1 ') : text.replace(/([0-9a-fA-F])(?=0x)/g, '$1 ')
}
