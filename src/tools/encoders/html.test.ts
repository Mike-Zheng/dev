// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { htmlDecode, htmlEncode } from './html'

describe('htmlEncode', () => {
  it('escapes the special characters', () => {
    expect(htmlEncode(`<a href="x">Tom & Jerry's</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;')
  })

  it('turns non-ASCII code points from U+00A0 into decimal references', () => {
    expect(htmlEncode(' é你')).toBe('&#160;&#233;&#20320;')
    expect(htmlEncode('😀')).toBe('&#128512;')
  })

  it('leaves ASCII and C1 control range untouched', () => {
    expect(htmlEncode('abc 123\n\t~')).toBe('abc 123\n\t~')
    expect(htmlEncode('\u009f')).toBe('\u009f')
  })
})

describe('htmlDecode', () => {
  it('decodes named, decimal and hex references', () => {
    expect(htmlDecode('&lt;p&gt; &amp; &quot;&copy;&quot; &#169; &#xA9; &#128512;')).toBe('<p> & "©" © © 😀')
  })

  it('drops markup and keeps the text', () => {
    expect(htmlDecode('<b>bold</b> text')).toBe('bold text')
  })

  it('round-trips with htmlEncode', () => {
    const s = `<div class="a">Ünïcødé & 'quotes' 🚀</div>`
    expect(htmlDecode(htmlEncode(s))).toBe(s)
  })
})
