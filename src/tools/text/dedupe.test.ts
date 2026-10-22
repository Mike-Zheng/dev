import { describe, expect, it } from 'vitest'
import { dedupeLines, type DedupeOptions } from './dedupe'

const base: DedupeOptions = { mode: 'unique', caseSensitive: true, trim: false, removeEmpty: false }

describe('dedupeLines', () => {
  const text = 'apple\nBanana\napple\nbanana\ncherry\napple'

  it('keeps the first occurrence in original order', () => {
    expect(dedupeLines(text, base)).toEqual({ lines: ['apple', 'Banana', 'banana', 'cherry'], total: 6, removed: 2 })
  })

  it('folds case when not case sensitive, keeping the first spelling', () => {
    expect(dedupeLines(text, { ...base, caseSensitive: false }).lines).toEqual(['apple', 'Banana', 'cherry'])
  })

  it('singles keeps only lines that appear once', () => {
    expect(dedupeLines(text, { ...base, mode: 'singles' }).lines).toEqual(['Banana', 'banana', 'cherry'])
    expect(dedupeLines(text, { ...base, mode: 'singles', caseSensitive: false }).lines).toEqual(['cherry'])
  })

  it('duplicates keeps one copy of each repeated line', () => {
    expect(dedupeLines(text, { ...base, mode: 'duplicates' }).lines).toEqual(['apple'])
    expect(dedupeLines(text, { ...base, mode: 'duplicates', caseSensitive: false }).lines).toEqual(['apple', 'Banana'])
  })

  it('trims lines before comparing when asked', () => {
    expect(dedupeLines(' a\na \r\nb', base).lines).toEqual([' a', 'a ', 'b'])
    expect(dedupeLines(' a\na \r\nb', { ...base, trim: true }).lines).toEqual(['a', 'b'])
  })

  it('removes blank lines when asked', () => {
    expect(dedupeLines('a\n\n \nb\n', base).lines).toEqual(['a', '', ' ', 'b'])
    expect(dedupeLines('a\n\n \nb\n', { ...base, removeEmpty: true })).toEqual({ lines: ['a', 'b'], total: 2, removed: 0 })
  })

  it('handles empty input and unicode', () => {
    expect(dedupeLines('', base)).toEqual({ lines: [], total: 0, removed: 0 })
    expect(dedupeLines('蘋果\n香蕉\n蘋果', base).lines).toEqual(['蘋果', '香蕉'])
  })
})
