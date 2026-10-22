export interface RegexOptions {
  ignoreCase: boolean
  multiline: boolean
  singleline: boolean
  allMatches: boolean
  unicode: boolean
}

export interface MatchRow {
  index: number
  value: string
  start: number
  end: number
  groups: { name: string; value: string }[]
}

export interface Segment {
  text: string
  hit: boolean
}

const MAX_MATCHES = 10000

export function regexFlags(o: RegexOptions): string {
  let flags = 'd'
  if (o.ignoreCase) flags += 'i'
  if (o.multiline) flags += 'm'
  if (o.singleline) flags += 's'
  if (o.allMatches) flags += 'g'
  if (o.unicode) flags += 'u'
  return flags
}

/** Compiles the pattern; `error` holds the engine's message when it is invalid. */
export function compileRegex(pattern: string, o: RegexOptions): { re: RegExp | null; error: string } {
  if (!pattern) return { re: null, error: '' }
  try {
    return { re: new RegExp(pattern, regexFlags(o)), error: '' }
  } catch (e) {
    return { re: null, error: (e as Error).message }
  }
}

function toRow(m: RegExpExecArray, index: number): MatchRow {
  const groups: { name: string; value: string }[] = []
  for (let i = 1; i < m.length; i++) groups.push({ name: String(i), value: m[i] ?? '' })
  if (m.groups) for (const [k, v] of Object.entries(m.groups)) groups.push({ name: k, value: v ?? '' })
  return { index, value: m[0], start: m.index, end: m.index + m[0].length, groups }
}

export function findMatches(re: RegExp, src: string): MatchRow[] {
  if (!src) return []
  const rows: MatchRow[] = []
  if (!re.global) {
    const m = re.exec(src)
    if (m) rows.push(toRow(m, 0))
    return rows
  }
  re.lastIndex = 0
  let m: RegExpExecArray | null
  let guard = 0
  while ((m = re.exec(src)) !== null && guard++ < MAX_MATCHES) {
    rows.push(toRow(m, rows.length))
    if (m[0] === '') re.lastIndex++
  }
  return rows
}

/** Splits `src` into alternating plain / matched segments for highlighting. */
export function toSegments(src: string, matches: MatchRow[]): Segment[] {
  const out: Segment[] = []
  let pos = 0
  for (const m of matches) {
    if (m.start > pos) out.push({ text: src.slice(pos, m.start), hit: false })
    out.push({ text: src.slice(m.start, m.end), hit: true })
    pos = m.end
  }
  if (pos < src.length) out.push({ text: src.slice(pos), hit: false })
  return out
}
