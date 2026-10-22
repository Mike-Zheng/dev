import { beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_FONT, fontNames, loadFont, missingChars, renderAsciiArt, wrapComment, type AsciiArtOptions } from './asciiArt'

const base: AsciiArtOptions = {
  font: DEFAULT_FONT,
  horizontalLayout: 'default',
  verticalLayout: 'default',
  width: 0,
  whitespaceBreak: false,
  trimTrailing: true,
  comment: 'none',
}

beforeAll(async () => {
  expect(await loadFont(DEFAULT_FONT)).toBe(true)
})

describe('fontNames', () => {
  it('lists the bundled FIGlet fonts', () => {
    expect(fontNames.length).toBeGreaterThan(300)
    expect(fontNames).toContain('Standard')
    expect(fontNames).toContain('Slant')
    expect(fontNames).toContain("Patorjk's Cheese")
  })

  it('is sorted case-insensitively', () => {
    const sorted = [...fontNames].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
    expect(fontNames).toEqual(sorted)
  })
})

describe('loadFont', () => {
  it('returns false for unknown fonts', async () => {
    expect(await loadFont('No Such Font')).toBe(false)
  })

  it('loads a font only once', async () => {
    const [a, b] = await Promise.all([loadFont('Slant'), loadFont('Slant')])
    expect(a && b).toBe(true)
  })
})

describe('renderAsciiArt', () => {
  it('renders with the Standard font', () => {
    const r = renderAsciiArt('Hi', base)
    expect(r).toEqual({
      ok: true,
      art: ['  _   _ _', ' | | | (_)', ' | |_| | |', ' |  _  | |', ' |_| |_|_|'].join('\n'),
    })
  })

  it('returns empty art for empty text', () => {
    expect(renderAsciiArt('', base)).toEqual({ ok: true, art: '' })
  })

  it('keeps trailing spaces when trimming is off', () => {
    const r = renderAsciiArt('Hi', { ...base, trimTrailing: false })
    expect(r.ok && r.art.split('\n')[0]).toBe('  _   _ _ ')
  })

  it('full width spreads characters further than default smushing', () => {
    const smushed = renderAsciiArt('AB', base)
    const full = renderAsciiArt('AB', { ...base, horizontalLayout: 'full' })
    expect(smushed.ok && full.ok).toBe(true)
    if (smushed.ok && full.ok) expect(full.art.split('\n')[0]!.length).toBeGreaterThan(smushed.art.split('\n')[0]!.length)
  })

  it('wraps to the requested width', () => {
    const r = renderAsciiArt('Hello World', { ...base, width: 40, whitespaceBreak: true })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.art.split('\n').every((l) => l.length <= 40)).toBe(true)
      expect(r.art.split('\n').length).toBeGreaterThan(6)
    }
  })

  it('reports fonts that are not loaded', () => {
    expect(renderAsciiArt('Hi', { ...base, font: 'Ghost' })).toEqual({ ok: false, error: 'fontLoadFailed' })
  })
})

describe('missingChars', () => {
  it('lists characters without a glyph once', () => {
    expect(missingChars('A中B中文\n', DEFAULT_FONT)).toEqual(['中', '文'])
    expect(missingChars('Hello', DEFAULT_FONT)).toEqual([])
  })
})

describe('wrapComment', () => {
  const art = 'ab \ncd'

  it('prefixes every line', () => {
    expect(wrapComment(art, 'slash')).toBe('// ab\n// cd')
    expect(wrapComment(art, 'hash')).toBe('# ab\n# cd')
    expect(wrapComment(art, 'rem')).toBe('REM ab\nREM cd')
  })

  it('wraps in block comments', () => {
    expect(wrapComment(art, 'c')).toBe('/*\nab \ncd\n*/')
    expect(wrapComment(art, 'javadoc')).toBe('/**\n * ab\n * cd\n */')
    expect(wrapComment(art, 'html')).toBe('<!--\nab \ncd\n-->')
  })

  it('leaves art untouched without a style', () => {
    expect(wrapComment(art, 'none')).toBe(art)
    expect(wrapComment('', 'slash')).toBe('')
  })
})
