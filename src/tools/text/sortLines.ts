/**
 * Line sorter. Sorting is stable, so lines that compare equal keep their original order.
 */

/** alpha: dictionary order · natural: numbers inside text compare by value · numeric: by the first number in the line · length: by character count */
export type SortMode = 'alpha' | 'natural' | 'numeric' | 'length' | 'reverse' | 'random'

export interface SortOptions {
  mode: SortMode
  descending: boolean
  caseSensitive: boolean
  trim: boolean
  removeEmpty: boolean
  locale?: string
}

const NUMBER = /[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/i

/** First number in the line (thousands separators ignored), or null when there is none. */
export function leadingNumber(line: string): number | null {
  const m = NUMBER.exec(line.replace(/,(?=\d{3})/g, ''))
  return m ? Number(m[0]) : null
}

function shuffle<T>(arr: T[], random: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const tmp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = tmp
  }
  return arr
}

export function sortLines(text: string, opts: SortOptions, random: () => number = Math.random): string[] {
  if (!text) return []
  let lines = text.split(/\r\n|\r|\n/)
  if (opts.trim) lines = lines.map((l) => l.trim())
  if (opts.removeEmpty) lines = lines.filter((l) => l.trim() !== '')

  if (opts.mode === 'reverse') return lines.reverse()
  if (opts.mode === 'random') return shuffle(lines, random)

  const collator = new Intl.Collator(opts.locale, {
    numeric: opts.mode === 'natural',
    sensitivity: opts.caseSensitive ? 'variant' : 'accent',
  })
  const dir = opts.descending ? -1 : 1

  if (opts.mode === 'numeric') {
    // Lines without a number always go last, in their original order.
    const parsed = lines.map((l) => ({ l, n: leadingNumber(l) }))
    const nums = parsed.filter((x): x is { l: string; n: number } => x.n !== null)
    nums.sort((a, b) => dir * (a.n - b.n) || dir * collator.compare(a.l, b.l))
    return [...nums.map((x) => x.l), ...parsed.filter((x) => x.n === null).map((x) => x.l)]
  }
  if (opts.mode === 'length') return lines.sort((a, b) => dir * ([...a].length - [...b].length))
  return lines.sort((a, b) => dir * collator.compare(a, b))
}
