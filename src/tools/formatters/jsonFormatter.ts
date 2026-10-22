import type { Indent } from '@/utils/indent'

export interface FormatResult {
  output: string
  /** Parser / formatter message; empty when formatting succeeded or the input is blank. */
  error: string
}

/** Recursively sorts object keys (locale-aware), leaving array order untouched. */
export function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(v as Record<string, unknown>).sort((a, b) => a.localeCompare(b))) {
      out[k] = sortKeys((v as Record<string, unknown>)[k])
    }
    return out
  }
  return v
}

export function formatJson(src: string, indent: Indent, sort: boolean): FormatResult {
  if (!src.trim()) return { output: '', error: '' }
  try {
    let obj: unknown = JSON.parse(src)
    if (sort) obj = sortKeys(obj)
    const space = indent === 'two' ? 2 : indent === 'four' ? 4 : indent === 'tab' ? '\t' : undefined
    return { output: JSON.stringify(obj, null, space), error: '' }
  } catch (e) {
    return { output: '', error: (e as Error).message }
  }
}
