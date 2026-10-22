import xmlFormat from 'xml-formatter'
import { indentString, type Indent } from '@/utils/indent'
import type { FormatResult } from './jsonFormatter'

/** Returns the first line of the browser's XML parser error, or null when `src` is well-formed. */
export function xmlParseError(src: string): string | null {
  const doc = new DOMParser().parseFromString(src, 'application/xml')
  const err = doc.querySelector('parsererror')
  return err ? (err.textContent ?? '').split('\n')[0] || 'parse error' : null
}

export function formatXml(src: string, indent: Indent, collapseContent: boolean): FormatResult {
  if (!src.trim()) return { output: '', error: '' }
  const err = xmlParseError(src)
  if (err) return { output: '', error: err }
  try {
    if (indent === 'minified') return { output: xmlFormat.minify(src, { collapseContent: true }), error: '' }
    return {
      output: xmlFormat(src, { indentation: indentString(indent), collapseContent, lineSeparator: '\n' }),
      error: '',
    }
  } catch (e) {
    return { output: '', error: (e as Error).message }
  }
}
