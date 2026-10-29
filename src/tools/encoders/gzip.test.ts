import { gunzipSync, gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { compressText, decompressText } from './gzip'

describe('compressText', () => {
  it('produces a GZip stream that zlib can read back', () => {
    const { output } = compressText('Hello, 世界!')
    const bytes = Buffer.from(output, 'base64')
    // GZip magic number + deflate method
    expect([...bytes.subarray(0, 3)]).toEqual([0x1f, 0x8b, 0x08])
    expect(gunzipSync(bytes).toString('utf8')).toBe('Hello, 世界!')
  })

  it('reports a high saving for repetitive input', () => {
    const { ratio } = compressText('a'.repeat(1000))
    expect(ratio).toBeGreaterThan(90)
    expect(ratio).toBeLessThan(100)
  })

  it('reports a negative saving when output is larger than input', () => {
    expect(compressText('a').ratio).toBeLessThan(0)
  })

  it('reports 0 for empty input', () => {
    expect(compressText('').ratio).toBe(0)
  })
})

describe('decompressText', () => {
  it('decompresses data produced by zlib', () => {
    const b64 = gzipSync(Buffer.from('dev 開發工具 🧰', 'utf8')).toString('base64')
    expect(decompressText(b64).output).toBe('dev 開發工具 🧰')
  })

  it('computes the saving relative to the decompressed size', () => {
    const text = 'abc'.repeat(500)
    const gz = gzipSync(Buffer.from(text))
    const { ratio } = decompressText(gz.toString('base64'))
    expect(ratio).toBeCloseTo((1 - gz.length / text.length) * 100, 10)
  })

  it('round-trips with compressText', () => {
    const text = '{"json": [1, 2, 3], "emoji": "😀"}\n'.repeat(20)
    expect(decompressText(compressText(text).output).output).toBe(text)
  })

  it('throws on invalid Base64', () => {
    expect(() => decompressText('%%%')).toThrow()
  })

  it('throws on Base64 that is not GZip data', () => {
    expect(() => decompressText('SGVsbG8sIFdvcmxkIQ==')).toThrow()
  })
})
