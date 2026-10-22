// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { htmlDocument, renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders headings, emphasis and lists', () => {
    const html = renderMarkdown('# Title\n\nA **bold** and _italic_ word.\n\n- one\n- two\n')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
    expect(html).toMatch(/<ul>\s*<li>one<\/li>\s*<li>two<\/li>\s*<\/ul>/)
  })

  it('renders fenced code with a language class and escapes its content', () => {
    const html = renderMarkdown('```ts\nconst a = 1 < 2\n```')
    expect(html).toContain('<pre><code class="language-ts">const a = 1 &lt; 2\n</code></pre>')
  })

  it('supports GFM tables, strikethrough and autolinks', () => {
    const html = renderMarkdown('| A | B |\n| --- | --- |\n| 1 | 2 |\n\n~~gone~~ https://example.com')
    expect(html).toContain('<table>')
    expect(html).toContain('<th>A</th>')
    expect(html).toContain('<td>2</td>')
    expect(html).toContain('<del>gone</del>')
    expect(html).toContain('<a href="https://example.com">https://example.com</a>')
  })

  it('does not convert single newlines to <br>', () => {
    expect(renderMarkdown('line1\nline2')).not.toContain('<br>')
  })

  it('returns an empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('')
  })

  it('strips script tags', () => {
    const html = renderMarkdown('hello\n\n<script>alert(1)</script>')
    expect(html).not.toMatch(/<script/i)
    expect(html).toContain('hello')
  })

  it('strips inline event handlers', () => {
    const html = renderMarkdown('<img src="x" onerror="alert(1)"><div onclick="evil()">hi</div>')
    expect(html).toContain('<img src="x">')
    expect(html).not.toMatch(/onerror|onclick/i)
  })

  it('strips javascript: URLs from links', () => {
    const html = renderMarkdown('[click](javascript:alert(1)) <a href="javascript:alert(2)">x</a>')
    expect(html).not.toMatch(/javascript:/i)
  })

  it('removes iframes and embedded objects', () => {
    const html = renderMarkdown('<iframe src="https://evil.example"></iframe><object data="x"></object><embed src="y">ok')
    expect(html).not.toMatch(/<iframe|<object|<embed/i)
    expect(html).toContain('ok')
  })
})

describe('htmlDocument', () => {
  it('wraps the body in a standalone UTF-8 HTML document', () => {
    expect(htmlDocument('<p>x</p>')).toBe('<!doctype html><html><head><meta charset="utf-8"><title>Markdown</title></head><body><p>x</p></body></html>')
  })
})
