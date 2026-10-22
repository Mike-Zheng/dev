/**
 * Duplicate line remover. Lines are compared after the optional trim / case folding;
 * the output keeps the first spelling seen and the original order.
 */

/** unique: keep the first occurrence · singles: only lines seen once · duplicates: one copy of each repeated line */
export type DedupeMode = 'unique' | 'singles' | 'duplicates'

export interface DedupeOptions {
  mode: DedupeMode
  caseSensitive: boolean
  trim: boolean
  removeEmpty: boolean
}

export interface DedupeResult {
  lines: string[]
  total: number
  removed: number
}

export function dedupeLines(text: string, opts: DedupeOptions): DedupeResult {
  if (!text) return { lines: [], total: 0, removed: 0 }
  let lines = text.split(/\r\n|\r|\n/)
  if (opts.trim) lines = lines.map((l) => l.trim())
  if (opts.removeEmpty) lines = lines.filter((l) => l.trim() !== '')
  const key = (l: string) => (opts.caseSensitive ? l : l.toLowerCase())

  const counts = new Map<string, number>()
  for (const l of lines) counts.set(key(l), (counts.get(key(l)) ?? 0) + 1)

  const seen = new Set<string>()
  const out = lines.filter((l) => {
    const k = key(l)
    if (seen.has(k)) return false
    seen.add(k)
    if (opts.mode === 'singles') return counts.get(k) === 1
    if (opts.mode === 'duplicates') return (counts.get(k) ?? 0) > 1
    return true
  })
  return { lines: out, total: lines.length, removed: lines.length - out.length }
}
