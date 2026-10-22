import { describe, expect, it } from 'vitest'
import { DEFAULT_DICT, convertAdvanced, convertSimple, formatDigits, parseBig, toBase } from './numberBase'

const values = (input: string, base: 2 | 8 | 10 | 16, format = true) => convertSimple(input, base, format).rows.map((r) => r.value)

describe('parseBig / toBase', () => {
  it('parses each base, ignoring separators and case', () => {
    expect(parseBig('ff', 16, DEFAULT_DICT)).toBe(255n)
    expect(parseBig('1111 1111', 2, DEFAULT_DICT)).toBe(255n)
    expect(parseBig('1,000_000', 10, DEFAULT_DICT)).toBe(1000000n)
    expect(parseBig('-377', 8, DEFAULT_DICT)).toBe(-255n)
  })

  it('rejects digits outside the base', () => {
    expect(parseBig('12', 2, DEFAULT_DICT)).toBeNull()
    expect(parseBig('G', 16, DEFAULT_DICT)).toBeNull()
    expect(parseBig('', 10, DEFAULT_DICT)).toBeNull()
  })

  it('handles values beyond Number precision', () => {
    const big = 2n ** 128n - 1n
    expect(toBase(big, 16, DEFAULT_DICT)).toBe('F'.repeat(32))
    expect(parseBig(big.toString(), 10, DEFAULT_DICT)).toBe(big)
  })

  it('formats zero and negatives', () => {
    expect(toBase(0n, 2, DEFAULT_DICT)).toBe('0')
    expect(toBase(-10n, 2, DEFAULT_DICT)).toBe('-1010')
  })
})

describe('formatDigits', () => {
  it('groups by base', () => {
    expect(formatDigits('1234567', 10)).toBe('1,234,567')
    expect(formatDigits('123456', 16)).toBe('12 3456')
    expect(formatDigits('1234567', 8)).toBe('1 234 567')
    expect(formatDigits('101010101', 2)).toBe('1 0101 0101')
    expect(formatDigits('-1234', 10)).toBe('-1,234')
    expect(formatDigits('abcdef', 36)).toBe('abcdef')
  })
})

describe('convertSimple', () => {
  it('returns nothing for blank input', () => {
    expect(convertSimple(' ', 10, true)).toEqual({ rows: [], error: '' })
  })

  it('lists hexadecimal, decimal, octal and binary', () => {
    const r = convertSimple('255', 10, true)
    expect(r.rows.map((row) => row.base)).toEqual([16, 10, 8, 2])
    expect(values('255', 10)).toEqual(['FF', '255', '377', '1111 1111'])
  })

  it('formats large numbers when enabled and not otherwise', () => {
    expect(values('1234567', 10)).toEqual(['12 D687', '1,234,567', '4 553 207', '1 0010 1101 0110 1000 0111'])
    expect(values('1234567', 10, false)).toEqual(['12D687', '1234567', '4553207', '100101101011010000111'])
  })

  it('accepts lowercase hex input and negatives', () => {
    expect(values('-ff', 16)).toEqual(['-FF', '-255', '-377', '-1111 1111'])
  })

  it('reports invalid digits', () => {
    expect(convertSimple('102', 2, true)).toEqual({ rows: [], error: 'invalid' })
  })
})

describe('convertAdvanced', () => {
  it('converts with the default dictionary up to base 64', () => {
    expect(convertAdvanced('255', 10, 16, DEFAULT_DICT, DEFAULT_DICT).value).toBe('FF')
    expect(convertAdvanced('4095', 10, 64, DEFAULT_DICT, DEFAULT_DICT).value).toBe('//')
    expect(convertAdvanced('//', 64, 10, DEFAULT_DICT, DEFAULT_DICT).value).toBe('4095')
  })

  it('is case-sensitive above base 36', () => {
    // a = 36, A = 10 in the default dictionary.
    expect(convertAdvanced('a', 62, 10, DEFAULT_DICT, DEFAULT_DICT).value).toBe('36')
    expect(convertAdvanced('A', 62, 10, DEFAULT_DICT, DEFAULT_DICT).value).toBe('10')
  })

  it('uses custom dictionaries', () => {
    expect(convertAdvanced('5', 10, 2, DEFAULT_DICT, '-+').value).toBe('+-+')
    expect(convertAdvanced('+-+', 2, 10, '-+', DEFAULT_DICT).value).toBe('5')
  })

  it('folds input case to match a single-case custom dictionary', () => {
    expect(convertAdvanced('ff', 16, 10, '0123456789abcdef', DEFAULT_DICT).value).toBe('255')
    expect(convertAdvanced('FF', 16, 10, '0123456789abcdef', DEFAULT_DICT).value).toBe('255')
  })

  it('rejects a lone minus sign', () => {
    expect(convertAdvanced('-', 10, 16, DEFAULT_DICT, DEFAULT_DICT).error).toBe('invalid')
    expect(convertSimple('-', 10, true)).toEqual({ rows: [], error: 'invalid' })
  })

  it('caps the bases at the dictionary length', () => {
    const r = convertAdvanced('10', 16, 64, '01', '01234567')
    expect(r).toEqual({ value: '2', error: '', inputBase: 2 })
  })

  it('reports dictionaries that are too small', () => {
    expect(convertAdvanced('1', 10, 2, '0', DEFAULT_DICT).error).toBe('dictTooSmall')
    expect(convertAdvanced('1', 10, 2, DEFAULT_DICT, '').error).toBe('dictTooSmall')
  })

  it('reports invalid input with the effective base', () => {
    expect(convertAdvanced('2', 10, 16, '01', DEFAULT_DICT)).toEqual({ value: '', error: 'invalid', inputBase: 2 })
  })

  it('returns nothing for blank input', () => {
    expect(convertAdvanced('', 10, 16, DEFAULT_DICT, DEFAULT_DICT)).toEqual({ value: '', error: '', inputBase: 10 })
  })
})
