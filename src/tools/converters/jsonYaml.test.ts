import { describe, expect, it } from 'vitest'
import { convertJsonYaml } from './jsonYaml'

describe('convertJsonYaml', () => {
  it('returns nothing for blank input', () => {
    expect(convertJsonYaml('  \n', true, 2)).toEqual({ output: '', error: '' })
    expect(convertJsonYaml('', false, 2)).toEqual({ output: '', error: '' })
  })

  it('converts JSON to YAML', () => {
    const r = convertJsonYaml('{"name":"Ada","tags":["a","b"],"nested":{"num":1,"ok":true,"nil":null}}', true, 2)
    expect(r.error).toBe('')
    expect(r.output).toBe('name: Ada\ntags:\n  - a\n  - b\nnested:\n  num: 1\n  ok: true\n  nil: null\n')
  })

  it('applies four-space indentation', () => {
    expect(convertJsonYaml('{"a":{"b":1}}', true, 4).output).toBe('a:\n    b: 1\n')
  })

  it('does not wrap long lines', () => {
    const long = 'x'.repeat(200)
    expect(convertJsonYaml(JSON.stringify({ long }), true, 2).output).toBe(`long: ${long}\n`)
  })

  it('quotes strings that would otherwise change type', () => {
    expect(convertJsonYaml('{"v":"true","num":"123"}', true, 2).output).toBe("v: 'true'\nnum: '123'\n")
  })

  it('converts YAML to JSON', () => {
    const r = convertJsonYaml('name: 李\nlist:\n  - 1\n  - two\n', false, 2)
    expect(r.error).toBe('')
    expect(r.output).toBe('{\n  "name": "李",\n  "list": [\n    1,\n    "two"\n  ]\n}')
  })

  it('round-trips JSON through YAML', () => {
    const obj = { a: [1, 2, { b: 'c' }], d: null, e: 'multi\nline', f: 1.5 }
    const yamlText = convertJsonYaml(JSON.stringify(obj), true, 2).output
    expect(JSON.parse(convertJsonYaml(yamlText, false, 2).output)).toEqual(obj)
  })

  it('reports invalid JSON', () => {
    expect(convertJsonYaml('{"a":', true, 2)).toEqual({ output: '', error: 'invalidJson' })
  })

  it('reports invalid YAML', () => {
    expect(convertJsonYaml('a: [1, 2', false, 2)).toEqual({ output: '', error: 'invalidYaml' })
  })
})
