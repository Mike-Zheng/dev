/**
 * List comparer: set operations over two newline-separated lists (trimmed, blank lines ignored).
 * Results keep the first spelling seen and the original order.
 */

export type ListMode = 'inter' | 'union' | 'aOnly' | 'bOnly'

export function listItems(s: string): string[] {
  return s
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}

export function compareLists(a: string, b: string, mode: ListMode, caseSensitive: boolean): string[] {
  const key = (s: string) => (caseSensitive ? s : s.toLowerCase())
  const unique = (list: string[]) => {
    const seen = new Set<string>()
    return list.filter((it) => {
      const k = key(it)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }
  const la = unique(listItems(a))
  const lb = unique(listItems(b))
  const sa = new Set(la.map(key))
  const sb = new Set(lb.map(key))
  switch (mode) {
    case 'inter':
      return la.filter((x) => sb.has(key(x)))
    case 'union':
      return unique([...la, ...lb])
    case 'aOnly':
      return la.filter((x) => !sb.has(key(x)))
    case 'bOnly':
      return lb.filter((x) => !sa.has(key(x)))
  }
}
