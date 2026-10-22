import { describe, expect, it } from 'vitest'
import { convertUrl, urlDecode, urlEncode } from './url'

describe('urlEncode', () => {
  it('percent-encodes reserved characters and spaces', () => {
    expect(urlEncode('a b&c=d/e?f#g')).toBe('a%20b%26c%3Dd%2Fe%3Ff%23g')
  })

  it("also encodes ! ' ( ) * (RFC 3986)", () => {
    expect(urlEncode("!'()*")).toBe('%21%27%28%29%2A')
  })

  it('keeps unreserved characters', () => {
    expect(urlEncode('AZaz09-_.~')).toBe('AZaz09-_.~')
  })

  it('encodes UTF-8 bytes', () => {
    expect(urlEncode('你好')).toBe('%E4%BD%A0%E5%A5%BD')
    expect(urlEncode('😀')).toBe('%F0%9F%98%80')
  })
})

describe('urlDecode', () => {
  it('decodes percent-escapes and treats + as space', () => {
    expect(urlDecode('a+b%20c%2Bd')).toBe('a b c+d')
    expect(urlDecode('%E4%BD%A0%E5%A5%BD')).toBe('你好')
  })

  it('throws on malformed escapes', () => {
    expect(() => urlDecode('%E4%BD')).toThrow(URIError)
    expect(() => urlDecode('100%')).toThrow(URIError)
  })
})

describe('convertUrl', () => {
  it('converts the whole text as one value by default', () => {
    expect(convertUrl('a\nb', true, false)).toBe('a%0Ab')
  })

  it('converts each line separately in multiline mode', () => {
    expect(convertUrl('a b\r\nc&d', true, true)).toBe('a%20b\nc%26d')
    expect(convertUrl('a%20b\nc%26d', false, true)).toBe('a b\nc&d')
  })

  it('round-trips', () => {
    const s = 'https://example.com/path?q=a b&x=中文#frag'
    expect(convertUrl(convertUrl(s, true, false), false, false)).toBe(s)
  })

  it('propagates decode errors', () => {
    expect(() => convertUrl('ok\n%ZZ', false, true)).toThrow()
  })
})
