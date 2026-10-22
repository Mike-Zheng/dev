import { describe, expect, it } from 'vitest'
import { indentString, useIndentOptions } from './indent'

describe('indentString', () => {
  it('maps each option to its whitespace', () => {
    expect(indentString('two')).toBe('  ')
    expect(indentString('four')).toBe('    ')
    expect(indentString('tab')).toBe('\t')
    expect(indentString('minified')).toBe('')
  })
})

describe('useIndentOptions', () => {
  const t = (k: string) => `#${k}`

  it('lists every option with translated labels', () => {
    expect(useIndentOptions(t).value).toEqual([
      { value: 'two', label: '#common.twoSpaces' },
      { value: 'four', label: '#common.fourSpaces' },
      { value: 'tab', label: '#common.oneTab' },
      { value: 'minified', label: '#common.minified' },
    ])
  })

  it('can omit the minified option', () => {
    expect(useIndentOptions(t, false).value.map((o) => o.value)).toEqual(['two', 'four', 'tab'])
  })
})
