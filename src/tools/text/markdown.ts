import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ gfm: true, breaks: false })

/** Renders GitHub-flavoured Markdown to sanitized HTML (requires a DOM `window` for DOMPurify). */
export function renderMarkdown(input: string): string {
  const raw = marked.parse(input, { async: false }) as string
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
}

export function htmlDocument(body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Markdown</title></head><body>${body}</body></html>`
}
