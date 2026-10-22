import { describe, expect, it } from 'vitest'
import { compareText, sideBySide, type DiffLine } from './compare'

const kinds = (rows: DiffLine[]) => rows.map((r) => `${r.kind}:${r.text}`)

describe('compareText', () => {
  it('returns nothing when both sides are empty', () => {
    expect(compareText('', '', false)).toEqual({ rows: [], left: [], right: [], added: 0, removed: 0 })
  })

  it('reports identical text as unchanged lines', () => {
    const r = compareText('a\nb\n', 'a\nb\n', false)
    expect(r.added).toBe(0)
    expect(r.removed).toBe(0)
    expect(r.rows).toEqual([
      { kind: 'same', text: 'a', lno: 1, rno: 1 },
      { kind: 'same', text: 'b', lno: 2, rno: 2 },
    ])
  })

  it('detects pure additions and removals with line numbers', () => {
    const r = compareText('a\nc\n', 'a\nb\nc\n', false)
    expect(r.added).toBe(1)
    expect(r.removed).toBe(0)
    expect(r.rows).toEqual([
      { kind: 'same', text: 'a', lno: 1, rno: 1 },
      { kind: 'add', text: 'b', rno: 2 },
      { kind: 'same', text: 'c', lno: 2, rno: 3 },
    ])

    const d = compareText('a\nb\nc\n', 'a\nc\n', false)
    expect(d.removed).toBe(1)
    expect(kinds(d.rows)).toEqual(['same:a', 'del:b', 'same:c'])
  })

  it('treats everything as added when the original is empty', () => {
    const r = compareText('', 'x\ny', false)
    expect(r.added).toBe(2)
    expect(kinds(r.rows)).toEqual(['add:x', 'add:y'])
  })

  it('highlights changed words in modified lines', () => {
    const r = compareText('the quick fox\n', 'the slow fox\n', false)
    expect(r.added).toBe(1)
    expect(r.removed).toBe(1)
    const [del, add] = r.rows
    expect(del).toMatchObject({ kind: 'del', text: 'the quick fox', lno: 1 })
    expect(add).toMatchObject({ kind: 'add', text: 'the slow fox', rno: 1 })
    expect(del!.parts!.filter((p) => p.kind === 'del').map((p) => p.text)).toEqual(['quick'])
    expect(add!.parts!.filter((p) => p.kind === 'add').map((p) => p.text)).toEqual(['slow'])
    expect(del!.parts!.map((p) => p.text).join('')).toBe('the quick fox')
    expect(add!.parts!.map((p) => p.text).join('')).toBe('the slow fox')
  })

  it('handles uneven replacement blocks', () => {
    const r = compareText('a\nold1\nold2\nz\n', 'a\nnew1\nz\n', false)
    expect(r.removed).toBe(2)
    expect(r.added).toBe(1)
    expect(kinds(r.rows)).toEqual(['same:a', 'del:old1', 'add:new1', 'del:old2', 'same:z'])
    expect(r.rows[3]!.parts).toBeUndefined()
  })

  it('ignores leading / trailing whitespace when asked', () => {
    expect(compareText('  a\nb \n', 'a\nb\n', false).added).toBe(2)
    const r = compareText('  a\nb \n', 'a\nb\n', true)
    expect(r.added).toBe(0)
    expect(r.removed).toBe(0)
  })

  it('still reports whitespace changes inside a line when ignoring whitespace (jsdiff behaviour)', () => {
    expect(compareText('a  b\n', 'a b\n', true).added).toBe(1)
  })

  it('treats a missing trailing newline as a change', () => {
    const r = compareText('a\nb', 'a\nb\n', false)
    expect(r.added + r.removed).toBeGreaterThan(0)
  })

  it('treats CRLF and LF line endings as different (current behaviour)', () => {
    const r = compareText('a\r\nb\r\n', 'a\nb\n', false)
    expect(r.removed).toBe(2)
    expect(r.added).toBe(2)
  })

  it('compares CJK and emoji text', () => {
    const r = compareText('你好 世界\n', '你好 👋\n', false)
    expect(r.rows[0]!.parts!.filter((p) => p.kind === 'del').map((p) => p.text)).toEqual(['世界'])
    expect(r.rows[1]!.parts!.filter((p) => p.kind === 'add').map((p) => p.text)).toEqual(['👋'])
  })

  it('builds aligned side-by-side columns', () => {
    const r = compareText('a\nold1\nold2\nz\n', 'a\nnew1\nz\nextra\n', false)
    expect(r.left).toHaveLength(r.right.length)
    expect(kinds(r.left)).toEqual(['same:a', 'del:old1', 'del:old2', 'same:z', 'same:'])
    expect(kinds(r.right)).toEqual(['same:a', 'add:new1', 'same:', 'same:z', 'add:extra'])
  })
})

describe('sideBySide', () => {
  it('pairs deletions with additions and pads the shorter side', () => {
    const rows: DiffLine[] = [
      { kind: 'del', text: 'x', lno: 1 },
      { kind: 'add', text: 'y', rno: 1 },
      { kind: 'add', text: 'z', rno: 2 },
    ]
    const { left, right } = sideBySide(rows)
    expect(kinds(left)).toEqual(['del:x', 'same:'])
    expect(kinds(right)).toEqual(['add:y', 'add:z'])
  })

  it('returns empty columns for no rows', () => {
    expect(sideBySide([])).toEqual({ left: [], right: [] })
  })
})
