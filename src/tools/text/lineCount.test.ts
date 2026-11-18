import { describe, expect, it } from 'vitest'
import { countLines, formatCounts, type LineCountOptions } from './lineCount'

const base: LineCountOptions = { caseSensitive: true, ignoreEmpty: true, sort: 'first' }

describe('countLines', () => {
  it('trims every line before counting', () => {
    expect(countLines('  apple\napple  \r\n\tapple\nbanana', base)).toEqual({
      entries: [
        { value: 'apple', count: 3 },
        { value: 'banana', count: 1 },
      ],
      total: 4,
    })
  })

  it('sorts by count descending, ties keep first appearance', () => {
    const r = countLines('b\na\nc\na\nc\nd', { ...base, sort: 'count' })
    expect(r.entries.map((e) => [e.value, e.count])).toEqual([
      ['a', 2],
      ['c', 2],
      ['b', 1],
      ['d', 1],
    ])
  })

  it('sorts alphabetically', () => {
    const r = countLines('pear\napple\nbanana\napple', { ...base, sort: 'alpha' })
    expect(r.entries.map((e) => e.value)).toEqual(['apple', 'banana', 'pear'])
  })

  it('folds case when not case sensitive, keeping the first spelling', () => {
    expect(countLines('Apple\napple\nAPPLE', base).entries).toHaveLength(3)
    expect(countLines('Apple\napple\nAPPLE', { ...base, caseSensitive: false }).entries).toEqual([{ value: 'Apple', count: 3 }])
  })

  it('counts empty lines only when asked', () => {
    expect(countLines('a\n\n  \na\n', base)).toEqual({ entries: [{ value: 'a', count: 2 }], total: 2 })
    expect(countLines('a\n\n  \na\n', { ...base, ignoreEmpty: false })).toEqual({
      entries: [
        { value: 'a', count: 2 },
        { value: '', count: 3 },
      ],
      total: 5,
    })
  })

  it('handles empty input and unicode', () => {
    expect(countLines('', base)).toEqual({ entries: [], total: 0 })
    expect(countLines('蘋果\n 香蕉 \n蘋果', base).entries).toEqual([
      { value: '蘋果', count: 2 },
      { value: '香蕉', count: 1 },
    ])
  })
})

describe('formatCounts', () => {
  it('emits tab-separated rows', () => {
    expect(formatCounts([{ value: 'a', count: 2 }, { value: 'b c', count: 1 }])).toBe('a\t2\nb c\t1')
    expect(formatCounts([])).toBe('')
  })
})
