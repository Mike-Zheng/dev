import { JSONPath } from 'jsonpath-plus'

export interface JsonPathResult {
  /** Matches as a pretty-printed JSON array. */
  output: string
  error: '' | 'invalidJson' | 'invalidPath'
  noMatch: boolean
}

export function queryJsonPath(json: string, path: string): JsonPathResult {
  const empty: JsonPathResult = { output: '', error: '', noMatch: false }
  const src = json.trim()
  if (!src) return empty
  let obj: unknown
  try {
    obj = JSON.parse(src)
  } catch {
    return { ...empty, error: 'invalidJson' }
  }
  const p = path.trim()
  if (!p) return empty
  try {
    const res = JSONPath({ path: p, json: obj as object, wrap: true }) as unknown[]
    if (!res.length) return { ...empty, noMatch: true }
    return { ...empty, output: JSON.stringify(res, null, 2) }
  } catch {
    return { ...empty, error: 'invalidPath' }
  }
}
