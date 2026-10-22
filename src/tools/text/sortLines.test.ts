import { describe, expect, it } from 'vitest'
import { leadingNumber, sortLines, type SortOptions } from './sortLines'

const base: SortOptions = { mode: 'alpha', descending: false, caseSensitive: false, trim: false, removeEmpty: false, locale: 'en' }

describe('sortLines', () => {
  it('sorts alphabetically, ascending and descending', () => {
    expect(sortLines('pear\napple\nBanana', base)).toEqual(['apple', 'Banana', 'pear'])
    expect(sortLines('pear\napple\nBanana', { ...base, descending: true })).toEqual(['pear', 'Banana', 'apple'])
  })

  it('keeps case-insensitive ties in order, and orders by case when case sensitive', () => {
    expect(sortLines('B\nb\na', base)).toEqual(['a', 'B', 'b'])
    expect(sortLines('B\nb\na', { ...base, caseSensitive: true })).toEqual(['a', 'b', 'B'])
  })

  it('natural order compares embedded numbers by value', () => {
    expect(sortLines('file10\nfile2\nfile1', base)).toEqual(['file1', 'file10', 'file2'])
    expect(sortLines('file10\nfile2\nfile1', { ...base, mode: 'natural' })).toEqual(['file1', 'file2', 'file10'])
  })

  it('numeric order uses the first number and puts lines without one last', () => {
    expect(sortLines('10 apples\nnone\n-2\n3.5\n1,000', { ...base, mode: 'numeric' })).toEqual(['-2', '3.5', '10 apples', '1,000', 'none'])
    expect(sortLines('1\nx\n3\n2', { ...base, mode: 'numeric', descending: true })).toEqual(['3', '2', '1', 'x'])
  })

  it('sorts by length counting code points', () => {
    expect(sortLines('ccc\n\u{1F44B}\nbb', { ...base, mode: 'length' })).toEqual(['\u{1F44B}', 'bb', 'ccc'])
    expect(sortLines('ccc\n\u{1F44B}\nbb', { ...base, mode: 'length', descending: true })).toEqual(['ccc', 'bb', '\u{1F44B}'])
  })

  it('reverses line order', () => {
    expect(sortLines('a\nc\nb', { ...base, mode: 'reverse' })).toEqual(['b', 'c', 'a'])
  })

  it('shuffles with the given random source, keeping every line', () => {
    const out = sortLines('a\nb\nc\nd', { ...base, mode: 'random' }, () => 0)
    expect(out).toEqual(['b', 'c', 'd', 'a'])
  })

  it('trims and removes blank lines when asked', () => {
    expect(sortLines(' b\n\na \r\n', { ...base, trim: true, removeEmpty: true })).toEqual(['a', 'b'])
  })

  it('handles empty input', () => {
    expect(sortLines('', base)).toEqual([])
  })
})

describe('leadingNumber', () => {
  it('finds the first number, ignoring thousands separators', () => {
    expect(leadingNumber('price: 1,234.5 USD')).toBe(1234.5)
    expect(leadingNumber('1e3')).toBe(1000)
    expect(leadingNumber('none')).toBeNull()
  })
})
