import { describe, expect, it } from 'vitest'
import {
  DIGITS,
  LOWER,
  SPECIAL,
  UPPER,
  characterSets,
  entropyBits,
  generatePassword,
  generatePasswords,
  passwordAlphabet,
  secureRandomInt,
  type PasswordOptions,
} from './password'

const all: PasswordOptions = { length: 30, upper: true, lower: true, digits: true, special: true, exclude: '' }
const has = (s: string, set: string) => Array.from(s).some((c) => set.includes(c))

describe('passwordAlphabet', () => {
  it('contains all 94 printable ASCII symbols by default', () => {
    expect(passwordAlphabet(all)).toHaveLength(26 + 26 + 10 + 32)
    expect(SPECIAL).toHaveLength(32)
  })

  it('includes only enabled sets', () => {
    expect(passwordAlphabet({ ...all, upper: false, special: false }).join('')).toBe(LOWER + DIGITS)
  })

  it('removes excluded characters and drops sets that become empty', () => {
    const o = { ...all, upper: false, lower: false, special: false, exclude: '0123456789' }
    expect(passwordAlphabet(o)).toEqual([])
    expect(characterSets(o)).toEqual([])
    expect(passwordAlphabet({ ...all, exclude: 'aA0!' })).not.toEqual(expect.arrayContaining(['a', 'A', '0', '!']))
  })
})

describe('entropyBits', () => {
  it('is length × log2(alphabet size), rounded', () => {
    expect(entropyBits({ ...all, upper: false, lower: false, special: false, length: 10 })).toBe(Math.round(10 * Math.log2(10)))
    expect(entropyBits(all)).toBe(Math.round(30 * Math.log2(94)))
  })

  it('is zero with fewer than two characters', () => {
    expect(entropyBits({ ...all, upper: false, lower: false, special: false, exclude: '012345678' })).toBe(0)
    expect(entropyBits({ ...all, upper: false, lower: false, digits: false, special: false })).toBe(0)
  })
})

describe('generatePassword', () => {
  it('has the requested length and uses only allowed characters', () => {
    for (const length of [1, 4, 30, 256]) {
      const p = generatePassword({ ...all, length })
      expect(p).toHaveLength(length)
      for (const c of p) expect(UPPER + LOWER + DIGITS + SPECIAL).toContain(c)
    }
  })

  it('contains at least one character of every enabled set', () => {
    for (let i = 0; i < 200; i++) {
      const p = generatePassword({ ...all, length: 4 })
      expect(has(p, UPPER) && has(p, LOWER) && has(p, DIGITS) && has(p, SPECIAL)).toBe(true)
    }
  })

  it('respects disabled sets and exclusions', () => {
    const p = generatePassword({ ...all, length: 200, special: false, digits: false, exclude: 'aeiouAEIOU' })
    expect(p).toMatch(/^[A-Za-z]+$/)
    expect(p).not.toMatch(/[aeiouAEIOU]/)
  })

  it('returns an empty string when no characters are available', () => {
    expect(generatePassword({ ...all, upper: false, lower: false, digits: false, special: false })).toBe('')
  })

  it('is deterministic for a given random source', () => {
    const zero = () => 0
    // picks: one of each set "Aa0!", padded from the full alphabet with "AA"; a Fisher–Yates shuffle that always swaps with index 0
    expect(generatePassword({ ...all, length: 6 }, zero)).toBe('a0!AAA')
  })

  it('produces distinct passwords', () => {
    expect(new Set(generatePasswords(all, 100)).size).toBe(100)
  })
})

describe('generatePasswords', () => {
  it('returns the requested number of passwords', () => {
    expect(generatePasswords(all, 5)).toHaveLength(5)
  })

  it('returns nothing when no characters are available', () => {
    expect(generatePasswords({ ...all, upper: false, lower: false, digits: false, special: false }, 3)).toEqual([])
  })
})

describe('secureRandomInt', () => {
  it('stays within [0, n)', () => {
    for (const n of [1, 2, 7, 94, 2 ** 31]) {
      for (let i = 0; i < 100; i++) {
        const v = secureRandomInt(n)
        expect(Number.isInteger(v) && v >= 0 && v < n).toBe(true)
      }
    }
  })

  it('covers every value of a small range', () => {
    const seen = new Set(Array.from({ length: 500 }, () => secureRandomInt(5)))
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4])
  })
})
