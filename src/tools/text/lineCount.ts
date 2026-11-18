/**
 * Line occurrence counter: every line is trimmed, then identical lines are tallied.
 * Each entry keeps the first spelling seen (relevant when case is folded).
 */

/** count: most frequent first · first: order of first appearance · alpha: dictionary order */
export type LineCountSort = 'count' | 'first' | 'alpha'

export interface LineCountOptions {
  caseSensitive: boolean
  ignoreEmpty: boolean
  sort: LineCountSort
}

export interface LineCountEntry {
  value: string
  count: number
}

export interface LineCountResult {
  entries: LineCountEntry[]
  /** Number of lines counted (after dropping empty lines when asked). */
  total: number
}

export function countLines(text: string, opts: LineCountOptions): LineCountResult {
  if (!text) return { entries: [], total: 0 }
  let lines = text.split(/\r\n|\r|\n/).map((l) => l.trim())
  if (opts.ignoreEmpty) lines = lines.filter(Boolean)

  const map = new Map<string, LineCountEntry>()
  for (const l of lines) {
    const k = opts.caseSensitive ? l : l.toLowerCase()
    const e = map.get(k)
    if (e) e.count++
    else map.set(k, { value: l, count: 1 })
  }

  const entries = [...map.values()]
  const collator = new Intl.Collator(undefined, { sensitivity: opts.caseSensitive ? 'variant' : 'accent' })
  if (opts.sort === 'alpha') entries.sort((a, b) => collator.compare(a.value, b.value))
  // Array.prototype.sort is stable, so ties keep first-appearance order.
  else if (opts.sort === 'count') entries.sort((a, b) => b.count - a.count)
  return { entries, total: lines.length }
}

/** Tab-separated "value<TAB>count" rows, ready to paste into a spreadsheet. */
export function formatCounts(entries: LineCountEntry[]): string {
  return entries.map((e) => `${e.value}\t${e.count}`).join('\n')
}
