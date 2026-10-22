export const DEFAULT_DICT = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/'

export type SimpleBase = 2 | 8 | 10 | 16

/** Parse `text` in `base` using the first `base` characters of `dict`; spaces, commas and underscores are ignored. */
export function parseBig(text: string, base: number, dict: string): bigint | null {
  let s = text.replace(/[\s,_]/g, '')
  if (!s) return null
  let neg = false
  if (s.startsWith('-')) {
    neg = true
    s = s.slice(1)
  }
  if (base <= 36) s = s.toUpperCase()
  const digits = dict.slice(0, base)
  let v = 0n
  const B = BigInt(base)
  for (const ch of s) {
    const i = digits.indexOf(ch)
    if (i < 0) return null
    v = v * B + BigInt(i)
  }
  return neg ? -v : v
}

export function toBase(v: bigint, base: number, dict: string): string {
  if (v === 0n) return dict[0] ?? '0'
  const neg = v < 0n
  let n = neg ? -v : v
  const B = BigInt(base)
  let out = ''
  while (n > 0n) {
    out = dict[Number(n % B)] + out
    n /= B
  }
  return (neg ? '-' : '') + out
}

function group(s: string, size: number, sep: string): string {
  const neg = s.startsWith('-')
  const body = neg ? s.slice(1) : s
  const parts: string[] = []
  for (let i = body.length; i > 0; i -= size) parts.unshift(body.slice(Math.max(0, i - size), i))
  return (neg ? '-' : '') + parts.join(sep)
}

/** Group digits for readability: thousands for decimal, nibbles for hex / binary, triplets for octal. */
export function formatDigits(s: string, base: number): string {
  if (base === 10) return group(s, 3, ',')
  if (base === 16) return group(s, 4, ' ')
  if (base === 8) return group(s, 3, ' ')
  if (base === 2) return group(s, 4, ' ')
  return s
}

export interface SimpleResult {
  rows: { base: SimpleBase; value: string }[]
  error: '' | 'invalid'
}

/** Convert to hexadecimal, decimal, octal and binary (in that order). */
export function convertSimple(input: string, inputBase: SimpleBase, format: boolean): SimpleResult {
  const src = input.trim()
  if (!src) return { rows: [], error: '' }
  const v = parseBig(src, inputBase, DEFAULT_DICT)
  if (v === null) return { rows: [], error: 'invalid' }
  const rows = ([16, 10, 8, 2] as const).map((base) => {
    const s = toBase(v, base, DEFAULT_DICT)
    return { base, value: format ? formatDigits(s, base) : s }
  })
  return { rows, error: '' }
}

export interface AdvancedResult {
  value: string
  error: '' | 'invalid' | 'dictTooSmall'
  /** Input base actually used: capped at the input dictionary's length. */
  inputBase: number
}

/** Convert between arbitrary bases (2–64) with custom digit dictionaries. */
export function convertAdvanced(input: string, inputBase: number, outputBase: number, inputDict: string, outputDict: string): AdvancedResult {
  const src = input.trim()
  const ib = Math.min(inputBase, inputDict.length)
  if (!src) return { value: '', error: '', inputBase: ib }
  if (inputDict.length < 2 || outputDict.length < 2) return { value: '', error: 'dictTooSmall', inputBase: ib }
  const ob = Math.min(outputBase, outputDict.length)
  const v = parseBig(src, ib, inputDict)
  if (v === null) return { value: '', error: 'invalid', inputBase: ib }
  return { value: toBase(v, ob, outputDict), error: '', inputBase: ib }
}
