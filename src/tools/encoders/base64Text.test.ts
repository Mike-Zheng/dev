import { describe, expect, it } from 'vitest'
import { decodeText, encodeText } from './base64Text'

describe('encodeText', () => {
  it('encodes UTF-8 text', () => {
    expect(encodeText('Hello, World!', 'utf8', false)).toBe('SGVsbG8sIFdvcmxkIQ==')
    expect(encodeText('你好', 'utf8', false)).toBe('5L2g5aW9')
    expect(encodeText('é', 'utf8', false)).toBe('w6k=')
  })

  it('switches to the URL-safe alphabet and drops padding', () => {
    expect(encodeText('?>?>', 'utf8', false)).toBe('Pz4/Pg==')
    expect(encodeText('?>?>', 'utf8', true)).toBe('Pz4_Pg')
  })

  it('masks characters to 7 bits in ASCII mode', () => {
    expect(encodeText('Hello, World!', 'ascii', false)).toBe('SGVsbG8sIFdvcmxkIQ==')
    // 'é' is U+00E9 → 0x69 ('i'); '你' is U+4F60 → 0x60 ('`')
    expect(encodeText('é', 'ascii', false)).toBe('aQ==')
    expect(encodeText('你', 'ascii', false)).toBe('YA==')
  })

  it('encodes the empty string to an empty string', () => {
    expect(encodeText('', 'utf8', false)).toBe('')
  })
})

describe('decodeText', () => {
  it('decodes UTF-8 text', () => {
    expect(decodeText('SGVsbG8sIFdvcmxkIQ==', 'utf8')).toBe('Hello, World!')
    expect(decodeText('5L2g5aW9', 'utf8')).toBe('你好')
  })

  it('accepts URL-safe input without padding', () => {
    expect(decodeText('Pz4_Pg', 'utf8')).toBe('?>?>')
  })

  it('replaces invalid UTF-8 sequences instead of failing', () => {
    expect(decodeText('/w==', 'utf8')).toBe('�')
  })

  it('maps each byte to one character in ASCII mode', () => {
    expect(decodeText('/w==', 'ascii')).toBe('ÿ')
    expect(decodeText('5L2g', 'ascii')).toBe('ä½ ')
  })

  it('throws on invalid Base64', () => {
    expect(() => decodeText('not base64!', 'utf8')).toThrow()
    expect(() => decodeText('abcde', 'ascii')).toThrow()
  })

  it('round-trips unicode text including astral characters', () => {
    const text = 'dev 開發工具 🧰\n\ttab'
    expect(decodeText(encodeText(text, 'utf8', false), 'utf8')).toBe(text)
    expect(decodeText(encodeText(text, 'utf8', true), 'utf8')).toBe(text)
  })
})
