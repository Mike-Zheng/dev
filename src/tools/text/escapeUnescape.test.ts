import { describe, expect, it } from 'vitest'
import { escapeText, unescapeText } from './escapeUnescape'

describe('escapeText', () => {
  it('escapes quotes, backslashes and control characters', () => {
    expect(escapeText('say "hi"\n\tit\'s C:\\path')).toBe('say \\"hi\\"\\n\\tit\\\'s C:\\\\path')
    expect(escapeText('\r\b\f\v\0')).toBe('\\r\\b\\f\\v\\0')
  })

  it('leaves other characters (including unicode) untouched', () => {
    expect(escapeText('中文 👋 / plain')).toBe('中文 👋 / plain')
  })

  it('returns an empty string for empty input', () => {
    expect(escapeText('')).toBe('')
  })
})

describe('unescapeText', () => {
  it('unescapes simple escapes', () => {
    expect(unescapeText('a\\nb\\tc\\r\\\\d\\"e\\\'f\\/g')).toBe('a\nb\tc\r\\d"e\'f/g')
    expect(unescapeText('\\b\\f\\v\\0')).toBe('\b\f\v\0')
  })

  it('unescapes \\u and \\x sequences', () => {
    expect(unescapeText('\\u4E2D\\u6587')).toBe('中文')
    expect(unescapeText('\\x41\\x7a')).toBe('Az')
    expect(unescapeText('\\uD83D\\uDC4B')).toBe('👋')
  })

  it('throws on a trailing backslash', () => {
    expect(() => unescapeText('abc\\')).toThrow('trailing backslash')
  })

  it('throws on malformed \\u and \\x', () => {
    expect(() => unescapeText('\\u12G4')).toThrow('bad \\u')
    expect(() => unescapeText('\\u12')).toThrow('bad \\u')
    expect(() => unescapeText('\\xZ1')).toThrow('bad \\x')
  })

  it('throws on unknown escapes', () => {
    expect(() => unescapeText('\\q')).toThrow('unknown escape \\q')
  })
})

describe('round-trip', () => {
  it.each(['', 'plain', 'line1\r\nline2\n', 'tab\there "quoted" \'single\'', 'back\\slash\\\\', '中文👋\0end'])('unescape(escape(%j))', (s) => {
    expect(unescapeText(escapeText(s))).toBe(s)
  })
})
