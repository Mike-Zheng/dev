import { describe, expect, it } from 'vitest'
import { formatJson, sortKeys } from './jsonFormatter'

describe('formatJson', () => {
  const src = '{"b":1,"a":[1,{"d":true,"c":null}]}'

  it('indents with two spaces, four spaces or a tab', () => {
    expect(formatJson('{"a":[1]}', 'two', false).output).toBe('{\n  "a": [\n    1\n  ]\n}')
    expect(formatJson('{"a":1}', 'four', false).output).toBe('{\n    "a": 1\n}')
    expect(formatJson('{"a":1}', 'tab', false).output).toBe('{\n\t"a": 1\n}')
  })

  it('minifies', () => {
    expect(formatJson('{ "a" : [ 1 , 2 ] ,\n "b" : "x" }', 'minified', false)).toEqual({ output: '{"a":[1,2],"b":"x"}', error: '' })
  })

  it('sorts keys recursively only when asked', () => {
    expect(formatJson(src, 'minified', false).output).toBe(src)
    expect(formatJson(src, 'minified', true).output).toBe('{"a":[1,{"c":null,"d":true}],"b":1}')
  })

  it('keeps unicode characters as-is', () => {
    expect(formatJson('{"名稱":"值 👋"}', 'minified', false).output).toBe('{"名稱":"值 👋"}')
  })

  it('formats top-level scalars', () => {
    expect(formatJson(' 42 ', 'two', false).output).toBe('42')
    expect(formatJson('"text"', 'two', false).output).toBe('"text"')
  })

  it('returns nothing for blank input', () => {
    expect(formatJson('', 'two', false)).toEqual({ output: '', error: '' })
    expect(formatJson('  \n ', 'two', false)).toEqual({ output: '', error: '' })
  })

  it('reports the parser message for invalid JSON', () => {
    const r = formatJson('{"a":}', 'two', false)
    expect(r.output).toBe('')
    expect(r.error).not.toBe('')
    expect(formatJson("{'a':1}", 'two', false).error).not.toBe('')
  })
})

describe('sortKeys', () => {
  it('leaves arrays in order and primitives untouched', () => {
    expect(sortKeys([3, 1, 2])).toEqual([3, 1, 2])
    expect(sortKeys(null)).toBeNull()
    expect(sortKeys('x')).toBe('x')
  })

  it('sorts keys of nested objects', () => {
    expect(Object.keys(sortKeys({ b: 1, a: 2, C: 3 }) as object)).toEqual(['a', 'b', 'C'])
    const nested = sortKeys({ z: { y: 1, x: 2 } }) as { z: object }
    expect(Object.keys(nested.z)).toEqual(['x', 'y'])
  })
})
