import { describe, expect, it } from 'vitest'
import { compareLists, listItems } from './listCompare'

describe('listItems', () => {
  it('splits on any line break, trims and drops blank lines', () => {
    expect(listItems('  a \r\nb\r\n\n  \rc')).toEqual(['a', 'b', 'c'])
  })

  it('returns nothing for empty input', () => {
    expect(listItems('')).toEqual([])
  })
})

describe('compareLists', () => {
  const a = 'apple\nbanana\ncherry\nbanana'
  const b = 'Banana\ncherry\ndate'

  it('intersection (case sensitive)', () => {
    expect(compareLists(a, b, 'inter', true)).toEqual(['cherry'])
  })

  it('intersection (case insensitive) keeps the spelling from A', () => {
    expect(compareLists(a, b, 'inter', false)).toEqual(['banana', 'cherry'])
  })

  it('union removes duplicates and keeps order', () => {
    expect(compareLists(a, b, 'union', true)).toEqual(['apple', 'banana', 'cherry', 'Banana', 'date'])
    expect(compareLists(a, b, 'union', false)).toEqual(['apple', 'banana', 'cherry', 'date'])
  })

  it('A only', () => {
    expect(compareLists(a, b, 'aOnly', true)).toEqual(['apple', 'banana'])
    expect(compareLists(a, b, 'aOnly', false)).toEqual(['apple'])
  })

  it('B only', () => {
    expect(compareLists(a, b, 'bOnly', true)).toEqual(['Banana', 'date'])
    expect(compareLists(a, b, 'bOnly', false)).toEqual(['date'])
  })

  it('deduplicates within a list according to case sensitivity', () => {
    expect(compareLists('X\nx\nX', '', 'aOnly', false)).toEqual(['X'])
    expect(compareLists('X\nx\nX', '', 'aOnly', true)).toEqual(['X', 'x'])
  })

  it('ignores surrounding whitespace and line-break style', () => {
    expect(compareLists(' a \r\n b ', 'a\rb', 'inter', true)).toEqual(['a', 'b'])
  })

  it('handles empty lists', () => {
    expect(compareLists('', '', 'union', true)).toEqual([])
    expect(compareLists('a', '', 'inter', true)).toEqual([])
    expect(compareLists('', 'b', 'bOnly', true)).toEqual(['b'])
  })

  it('compares unicode items', () => {
    expect(compareLists('蘋果\n香蕉\n👋', '香蕉\n👋', 'aOnly', true)).toEqual(['蘋果'])
  })
})
