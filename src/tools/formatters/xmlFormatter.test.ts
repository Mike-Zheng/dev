// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { formatXml, xmlParseError } from './xmlFormatter'

describe('xmlParseError', () => {
  it('returns null for well-formed XML', () => {
    expect(xmlParseError('<a><b x="1"/></a>')).toBeNull()
    expect(xmlParseError('<?xml version="1.0"?><root>文字</root>')).toBeNull()
  })

  it('returns a non-empty message for malformed XML', () => {
    for (const bad of ['<a><b></a>', '<a>', '<a></a><b></b>', 'plain text']) {
      const err = xmlParseError(bad)
      expect(err, bad).toBeTypeOf('string')
      expect(err, bad).not.toBe('')
    }
  })
})

describe('formatXml', () => {
  it('indents nested elements', () => {
    expect(formatXml('<a><b>1</b><c/></a>', 'two', true).output).toBe('<a>\n  <b>1</b>\n  <c/>\n</a>')
    expect(formatXml('<a><b>1</b></a>', 'four', true).output).toBe('<a>\n    <b>1</b>\n</a>')
    expect(formatXml('<a><b>1</b></a>', 'tab', true).output).toBe('<a>\n\t<b>1</b>\n</a>')
  })

  it('puts text content on its own line when not collapsing', () => {
    expect(formatXml('<a><b>1</b></a>', 'two', false).output).toBe('<a>\n  <b>\n    1\n  </b>\n</a>')
  })

  it('minifies', () => {
    expect(formatXml('<a>\n  <b>1</b>\n  <c />\n</a>', 'minified', true).output).toBe('<a><b>1</b><c/></a>')
  })

  it('keeps the XML declaration, attributes and unicode text', () => {
    const out = formatXml('<?xml version="1.0"?><r lang="zh"><t>你好</t></r>', 'two', true).output
    expect(out).toBe('<?xml version="1.0"?>\n<r lang="zh">\n  <t>你好</t>\n</r>')
  })

  it('returns nothing for blank input', () => {
    expect(formatXml(' \n', 'two', true)).toEqual({ output: '', error: '' })
  })

  it('reports malformed XML', () => {
    const r = formatXml('<a><b></a>', 'two', true)
    expect(r.output).toBe('')
    expect(r.error).not.toBe('')
  })
})
