import { describe, expect, it } from 'vitest'
import { base64ToBytes, base64ToUtf8, bytesToBase64, isLikelyBase64, utf8ToBase64 } from './base64'

describe('bytesToBase64', () => {
  it('encodes standard Base64 with padding', () => {
    expect(bytesToBase64(new Uint8Array([0xfb, 0xff]))).toBe('+/8=')
  })

  it('encodes URL-safe Base64 without padding', () => {
    expect(bytesToBase64(new Uint8Array([0xfb, 0xff]), true)).toBe('-_8')
  })

  it('handles inputs larger than one chunk', () => {
    const bytes = new Uint8Array(0x8000 * 2 + 3).map((_, i) => i % 256)
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes)
  })
})

describe('base64ToBytes', () => {
  it('accepts URL-safe input, missing padding and whitespace', () => {
    expect(base64ToBytes('-_8')).toEqual(new Uint8Array([0xfb, 0xff]))
    expect(base64ToBytes('SGVs\nbG8=')).toEqual(new TextEncoder().encode('Hello'))
  })

  it('rejects invalid characters and lengths', () => {
    expect(() => base64ToBytes('abc$')).toThrow()
    expect(() => base64ToBytes('abcde')).toThrow()
  })
})

describe('utf8 helpers', () => {
  it('round-trips multi-byte text', () => {
    const text = '你好，dev 👋'
    expect(base64ToUtf8(utf8ToBase64(text))).toBe(text)
  })

  it('encodes known values', () => {
    expect(utf8ToBase64('Hello, World!')).toBe('SGVsbG8sIFdvcmxkIQ==')
  })
})

describe('isLikelyBase64', () => {
  it('detects Base64-looking strings', () => {
    expect(isLikelyBase64('SGVsbG8=')).toBe(true)
    expect(isLikelyBase64('  SGVs bG8=  ')).toBe(true)
  })

  it('rejects short or non-Base64 strings', () => {
    expect(isLikelyBase64('abc')).toBe(false)
    expect(isLikelyBase64('hello world!')).toBe(false)
  })
})
