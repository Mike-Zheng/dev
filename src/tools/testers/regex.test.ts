import { describe, expect, it } from 'vitest'
import { compileRegex, findMatches, regexFlags, toSegments, type RegexOptions } from './regex'

const opts: RegexOptions = { ignoreCase: false, multiline: true, singleline: false, allMatches: true, unicode: false }

function matchValues(pattern: string, text: string, o: Partial<RegexOptions> = {}): string[] {
  const { re } = compileRegex(pattern, { ...opts, ...o })
  if (!re) throw new Error('pattern did not compile')
  return findMatches(re, text).map((m) => m.value)
}

describe('regexFlags', () => {
  it('always includes match indices and maps each option to its flag', () => {
    expect(regexFlags({ ignoreCase: false, multiline: false, singleline: false, allMatches: false, unicode: false })).toBe('d')
    expect(regexFlags({ ignoreCase: true, multiline: true, singleline: true, allMatches: true, unicode: true })).toBe('dimsgu')
  })
})

describe('compileRegex', () => {
  it('returns no regex and no error for an empty pattern', () => {
    expect(compileRegex('', opts)).toEqual({ re: null, error: '' })
  })

  it('compiles with the chosen flags', () => {
    const { re, error } = compileRegex('a+', opts)
    expect(error).toBe('')
    expect(re?.flags).toBe('dgm')
  })

  it('reports invalid patterns', () => {
    const r = compileRegex('(abc', opts)
    expect(r.re).toBeNull()
    expect(r.error).not.toBe('')
    expect(compileRegex('\\p{L}', { ...opts, unicode: true }).error).toBe('')
    expect(compileRegex('\\p{Foo}', { ...opts, unicode: true }).error).not.toBe('')
  })
})

describe('findMatches', () => {
  it('finds all matches with positions', () => {
    const { re } = compileRegex('\\d+', opts)
    expect(findMatches(re!, 'a1 b22 c333')).toEqual([
      { index: 0, value: '1', start: 1, end: 2, groups: [] },
      { index: 1, value: '22', start: 4, end: 6, groups: [] },
      { index: 2, value: '333', start: 8, end: 11, groups: [] },
    ])
  })

  it('returns only the first match when "all matches" is off', () => {
    expect(matchValues('\\d+', 'a1 b22', { allMatches: false })).toEqual(['1'])
  })

  it('lists numbered and named groups', () => {
    const { re } = compileRegex('(?<year>\\d{4})-(\\d{2})', opts)
    expect(findMatches(re!, 'on 2024-05')[0]?.groups).toEqual([
      { name: '1', value: '2024' },
      { name: '2', value: '05' },
      { name: 'year', value: '2024' },
    ])
  })

  it('reports unmatched optional groups as empty strings', () => {
    const { re } = compileRegex('a(b)?', opts)
    expect(findMatches(re!, 'a')[0]?.groups).toEqual([{ name: '1', value: '' }])
  })

  it('applies ignore-case, multiline and singleline options', () => {
    expect(matchValues('abc', 'ABC abc', { ignoreCase: true })).toEqual(['ABC', 'abc'])
    expect(matchValues('^\\w', 'one\ntwo')).toEqual(['o', 't'])
    expect(matchValues('^\\w', 'one\ntwo', { multiline: false })).toEqual(['o'])
    expect(matchValues('a.b', 'a\nb')).toEqual([])
    expect(matchValues('a.b', 'a\nb', { singleline: true })).toEqual(['a\nb'])
  })

  it('treats astral characters as one code point in unicode mode', () => {
    expect(matchValues('.', '😀')).toHaveLength(2)
    expect(matchValues('.', '😀', { unicode: true })).toEqual(['😀'])
  })

  it('advances past empty matches instead of looping forever', () => {
    const { re } = compileRegex('x*', opts)
    const rows = findMatches(re!, 'ab')
    expect(rows.map((m) => [m.start, m.end])).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ])
  })

  it('returns nothing for empty text', () => {
    const { re } = compileRegex('.*', opts)
    expect(findMatches(re!, '')).toEqual([])
  })

  it('resets lastIndex so repeated calls give the same result', () => {
    const { re } = compileRegex('a', opts)
    expect(findMatches(re!, 'aa')).toHaveLength(2)
    expect(findMatches(re!, 'aa')).toHaveLength(2)
  })
})

describe('toSegments', () => {
  it('splits text into plain and highlighted segments', () => {
    const { re } = compileRegex('\\d+', opts)
    const text = 'a1 b22'
    expect(toSegments(text, findMatches(re!, text))).toEqual([
      { text: 'a', hit: false },
      { text: '1', hit: true },
      { text: ' b', hit: false },
      { text: '22', hit: true },
    ])
  })

  it('returns the whole text as one plain segment when nothing matches', () => {
    expect(toSegments('hello', [])).toEqual([{ text: 'hello', hit: false }])
    expect(toSegments('', [])).toEqual([])
  })
})
