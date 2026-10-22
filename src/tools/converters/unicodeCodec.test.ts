// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { decodeField, decodeMixed, defaultOptions, encodeField, extractEscapes, separateEscapes, type CodecOptions, type FieldId } from './unicodeCodec'

const o = defaultOptions
const enc = (id: FieldId, s: string, opts: Partial<CodecOptions> = {}) => encodeField(id, s, { ...o, ...opts })

describe('encodeField', () => {
  it('escapes HTML syntax and invisibles', () => {
    expect(enc('html', '<a & "b">')).toBe('&lt;a &amp; &quot;b&quot;&gt;')
    expect(enc('html', 'a​b')).toBe('a&#x200B;b')
    expect(enc('html', 'a​b', { htmlInvisibles: false })).toBe('a​b')
    expect(enc('html', '‫x‬', { htmlBidi: true })).toBe('&lt;span dir=&quot;rtl&quot;&gt;x&lt;/span&gt;')
  })

  it('writes numeric character references', () => {
    expect(enc('hexNcr', 'Aé')).toBe('A&#x00E9;')
    expect(enc('hexNcr', 'Aé', { hexNcrAscii: false })).toBe('&#x0041;&#x00E9;')
    expect(enc('decNcr', 'é😀')).toBe('&#233;&#128512;')
  })

  it('writes JavaScript escapes in ES6, ES5 and C styles', () => {
    expect(enc('js', 'é😀')).toBe('\\u{E9}\\u{1F600}')
    expect(enc('js', 'é😀', { jsEs6: false })).toBe('\\u00E9\\uD83D\\uDE00')
    expect(enc('js', '😀', { jsEs6: false, jsCStyle: true })).toBe('\\U0001F600')
    expect(enc('js', 'a\\b')).toBe('a\\\\b')
    expect(enc('js', 'a\n"')).toBe('a\n"')
    expect(enc('js', 'a\n"', { jsEscNl: true })).toBe('a\\n\\"')
  })

  it('writes Rust, Perl and CSS escapes', () => {
    expect(enc('rust', '\u0001é')).toBe('\\x01\\u{E9}')
    expect(enc('perl', '\u0001é')).toBe('\\x01\\x{E9}')
    expect(enc('css', 'é😀\\')).toBe('\\00E9 \\01F600 \\\\')
  })

  it('percent-encodes UTF-8 bytes, leaving unreserved characters', () => {
    expect(enc('percent', 'a b/é~')).toBe('a%20b%2F%C3%A9~')
  })

  it('writes U+ and 0x notations', () => {
    expect(enc('uhex', 'Aé')).toBe('AU+00E9')
    expect(enc('uhex', 'Aé', { uhexAscii: false })).toBe('U+0041U+00E9')
    expect(enc('zerox', 'Aé😀')).toBe('A0xE90x1F600')
  })

  it('lists UTF-8 bytes and UTF-16 code units', () => {
    expect(enc('utf8', 'é😀')).toBe('C3 A9 F0 9F 98 80')
    expect(enc('utf16', 'é😀')).toBe('00E9 D83D DE00')
  })

  it('lists code points in hex and decimal', () => {
    expect(enc('hexcp', 'A😀')).toBe('0041 1F600')
    expect(enc('hexcp', 'A', { hexcpPad: 8 })).toBe('00000041')
    expect(enc('hexcp', 'aéb😀', { hexcpAscii: true })).toBe('a00E9b1F600')
    expect(enc('hexcp', 'éé', { hexcpAscii: true })).toBe('00E9 00E9')
    expect(enc('deccp', 'A😀')).toBe('65 128512')
  })
})

describe('decodeField', () => {
  it('round-trips every notation', () => {
    const sample = 'Hi é 😀 中文 \n\t"\'\\<&>'
    const ids: FieldId[] = ['chars', 'html', 'hexNcr', 'decNcr', 'js', 'rust', 'css', 'perl', 'percent', 'uhex', 'zerox', 'utf8', 'utf16', 'hexcp', 'deccp']
    for (const id of ids) {
      const d = decodeField(id, encodeField(id, sample, o), o)
      expect(d, id).toEqual({ text: sample, errors: [] })
    }
  })

  it('resolves named HTML entities', () => {
    expect(decodeField('html', '&eacute;&amp;&bogus;', o).text).toBe('é&&bogus;')
  })

  it('reports out-of-range code points and keeps the raw text', () => {
    expect(decodeField('hexNcr', '&#x110000;', o)).toEqual({ text: '&#x110000;', errors: [{ code: 'range', value: '&#x110000;' }] })
  })

  it('reports malformed UTF-8 and lone surrogates', () => {
    expect(decodeField('utf8', 'C3', o)).toEqual({ text: '�', errors: [{ code: 'utf8', value: 'C3' }] })
    expect(decodeField('utf16', 'D83D', o)).toEqual({ text: '�', errors: [{ code: 'utf16', value: 'D83D' }] })
  })

  it('reports tokens that are not numbers', () => {
    expect(decodeField('hexcp', '41 zz U+42 0x43', o)).toEqual({ text: 'AzzBC', errors: [{ code: 'number', value: 'zz' }] })
    expect(decodeField('deccp', '65 x', o)).toEqual({ text: 'Ax', errors: [{ code: 'number', value: 'x' }] })
    expect(decodeField('utf8', '41 zz', o)).toEqual({ text: 'A', errors: [{ code: 'number', value: 'zz' }] })
  })
})

describe('decodeMixed', () => {
  it('decodes every escape family in free text', () => {
    expect(decodeMixed('&#x41;&#66;\\u0043\\u{1F600}U+00E9 %C3%A9 0x41 \\x42', 'none', true)).toEqual({ text: 'ABC😀é é A B', errors: [] })
  })

  it('splits adjacent 0x escapes', () => {
    expect(decodeMixed('0x1F6800x200D', 'none', true).text).toBe('\u{1F680}‍')
  })

  it('only decodes short escapes when enabled', () => {
    expect(decodeMixed('a\\nb', 'none', true).text).toBe('a\nb')
    expect(decodeMixed('a\\nb', 'none', false).text).toBe('a\\nb')
  })

  it('decodes bare numbers in the chosen mode', () => {
    expect(decodeMixed('hello 41 42', 'none', true).text).toBe('hello 41 42')
    expect(decodeMixed('hello 41 42', 'hex', true).text).toBe('hello AB')
    expect(decodeMixed('72 105', 'dec', true).text).toBe('Hi')
    expect(decodeMixed('E4 B8 AD', 'utf8', true).text).toBe('中')
    expect(decodeMixed('D83D DE00', 'utf16', true).text).toBe('😀')
  })

  it('does not read numbers inside words', () => {
    expect(decodeMixed('xyz41', 'hex', true).text).toBe('xyz41')
  })
})

describe('extractEscapes', () => {
  it('keeps only the escapes', () => {
    expect(extractEscapes('say \\u0041 and &#66; ok', 'none')).toBe('\\u0041 &#66;')
  })

  it('includes bare numbers in number modes', () => {
    expect(extractEscapes('x 41 y 0x42', 'hex')).toBe('41 0x42')
    expect(extractEscapes('x 65 y', 'dec')).toBe('65')
  })
})

describe('separateEscapes', () => {
  it('inserts spaces between adjacent escapes', () => {
    expect(separateEscapes('uhex', 'U+0041U+0042')).toBe('U+0041 U+0042')
    expect(separateEscapes('zerox', '0x410x42')).toBe('0x41 0x42')
  })
})
