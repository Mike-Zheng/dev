import { md5 } from 'hash-wasm'

/** 32 = full digest; 16 = the middle 16 hex chars (characters 8–24), a common short form. */
export type Md5Length = 32 | 16

export interface Md5Options {
  uppercase: boolean
  length: Md5Length
  /** Hash every line separately instead of the whole text. */
  perLine: boolean
}

function shape(hex: string, opts: Pick<Md5Options, 'uppercase' | 'length'>): string {
  const h = opts.length === 16 ? hex.slice(8, 24) : hex
  return opts.uppercase ? h.toUpperCase() : h
}

export async function md5Hex(text: string, opts: Pick<Md5Options, 'uppercase' | 'length'>): Promise<string> {
  return shape(await md5(text), opts)
}

/** MD5 of the whole text, or of each line (line breaks normalized, one digest per line). */
export async function md5Text(text: string, opts: Md5Options): Promise<string> {
  if (!opts.perLine) return md5Hex(text, opts)
  const lines = text.split(/\r\n|\r|\n/)
  return (await Promise.all(lines.map((l) => md5Hex(l, opts)))).join('\n')
}

/** True when `candidate` (trimmed, case-insensitive) is the 32- or 16-char MD5 of `text`. */
export async function md5Matches(text: string, candidate: string): Promise<boolean> {
  const v = candidate.trim().toLowerCase()
  if (!/^[0-9a-f]{16}$|^[0-9a-f]{32}$/.test(v)) return false
  const full = await md5(text)
  return v === full || v === full.slice(8, 24)
}

export function isMd5Hex(s: string): boolean {
  return /^[0-9a-f]{16}$|^[0-9a-f]{32}$/i.test(s.trim())
}
