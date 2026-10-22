import { diffLines, diffWordsWithSpace } from 'diff'

/**
 * Text comparer: line diff with word-level highlights for modified lines, in inline and side-by-side layouts.
 */

export type DiffKind = 'same' | 'add' | 'del'

export interface DiffLine {
  kind: DiffKind
  text: string
  /** Line number in the original text */
  lno?: number
  /** Line number in the modified text */
  rno?: number
  parts?: { text: string; kind: DiffKind }[]
}

export interface DiffResult {
  rows: DiffLine[]
  left: DiffLine[]
  right: DiffLine[]
  added: number
  removed: number
}

function splitLines(s: string): string[] {
  const arr = s.split('\n')
  if (arr[arr.length - 1] === '') arr.pop()
  return arr
}

export function compareText(a: string, b: string, ignoreWhitespace: boolean): DiffResult {
  if (!a && !b) return { rows: [], left: [], right: [], added: 0, removed: 0 }
  const changes = diffLines(a, b, { ignoreWhitespace })
  const rows: DiffLine[] = []
  let l = 1
  let r = 1
  let added = 0
  let removed = 0
  for (let i = 0; i < changes.length; i++) {
    const c = changes[i]!
    const next = changes[i + 1]
    if (c.removed && next?.added) {
      const dl = splitLines(c.value)
      const al = splitLines(next.value)
      const n = Math.max(dl.length, al.length)
      for (let k = 0; k < n; k++) {
        const d = dl[k]
        const ad = al[k]
        if (d !== undefined && ad !== undefined) {
          const wd = diffWordsWithSpace(d, ad)
          rows.push({ kind: 'del', text: d, lno: l++, parts: wd.filter((p) => !p.added).map((p) => ({ text: p.value, kind: p.removed ? 'del' : 'same' })) })
          rows.push({ kind: 'add', text: ad, rno: r++, parts: wd.filter((p) => !p.removed).map((p) => ({ text: p.value, kind: p.added ? 'add' : 'same' })) })
        } else if (d !== undefined) rows.push({ kind: 'del', text: d, lno: l++ })
        else if (ad !== undefined) rows.push({ kind: 'add', text: ad, rno: r++ })
      }
      removed += dl.length
      added += al.length
      i++
      continue
    }
    for (const line of splitLines(c.value)) {
      if (c.added) {
        rows.push({ kind: 'add', text: line, rno: r++ })
        added++
      } else if (c.removed) {
        rows.push({ kind: 'del', text: line, lno: l++ })
        removed++
      } else rows.push({ kind: 'same', text: line, lno: l++, rno: r++ })
    }
  }
  return { rows, ...sideBySide(rows), added, removed }
}

/** Pairs each block of deletions with the following additions; the shorter side is padded with blank rows. */
export function sideBySide(rows: DiffLine[]): { left: DiffLine[]; right: DiffLine[] } {
  const left: DiffLine[] = []
  const right: DiffLine[] = []
  let i = 0
  while (i < rows.length) {
    const row = rows[i]!
    if (row.kind === 'same') {
      left.push(row)
      right.push(row)
      i++
      continue
    }
    const dels: DiffLine[] = []
    const adds: DiffLine[] = []
    while (i < rows.length && rows[i]!.kind !== 'same') {
      if (rows[i]!.kind === 'del') dels.push(rows[i]!)
      else adds.push(rows[i]!)
      i++
    }
    const n = Math.max(dels.length, adds.length)
    for (let k = 0; k < n; k++) {
      left.push(dels[k] ?? { kind: 'same', text: '' })
      right.push(adds[k] ?? { kind: 'same', text: '' })
    }
  }
  return { left, right }
}
