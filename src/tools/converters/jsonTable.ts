export type TableFormat = 'csv' | 'tsv' | 'fsv'

export interface TableData {
  columns: string[]
  rows: string[][]
}

export interface TableResult {
  data: TableData | null
  error: '' | 'invalid'
}

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/** Turn a JSON array into a table; columns are the union of keys in first-seen order. */
export function parseJsonTable(input: string): TableResult {
  const src = input.trim()
  if (!src) return { data: null, error: '' }
  try {
    const parsed: unknown = JSON.parse(src)
    if (!Array.isArray(parsed) || parsed.length === 0) return { data: null, error: 'invalid' }
    const columns: string[] = []
    const objects: Record<string, unknown>[] = parsed.map((item: unknown) =>
      item && typeof item === 'object' && !Array.isArray(item) ? (item as Record<string, unknown>) : { value: item },
    )
    for (const obj of objects) for (const k of Object.keys(obj)) if (!columns.includes(k)) columns.push(k)
    const rows = objects.map((obj) => columns.map((c) => cellToString(obj[c])))
    return { data: { columns, rows }, error: '' }
  } catch {
    return { data: null, error: 'invalid' }
  }
}

function escapeCell(v: string, sep: string): string {
  if (v.includes(sep) || v.includes('"') || v.includes('\n') || v.includes('\r')) return `"${v.replace(/"/g, '""')}"`
  return v
}

export function serializeTable(d: TableData, format: TableFormat): string {
  const sep = format === 'csv' ? ',' : format === 'tsv' ? '\t' : ';'
  const lines = [d.columns.map((c) => escapeCell(c, sep)).join(sep), ...d.rows.map((r) => r.map((c) => escapeCell(c, sep)).join(sep))]
  return lines.join('\n')
}
