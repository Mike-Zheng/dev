export const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const LOWER = 'abcdefghijklmnopqrstuvwxyz'
export const DIGITS = '0123456789'
export const SPECIAL = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

export interface PasswordOptions {
  length: number
  upper: boolean
  lower: boolean
  digits: boolean
  special: boolean
  /** Characters that must never appear in the output. */
  exclude: string
}

/** Returns a uniformly distributed integer in [0, n). */
export type RandomInt = (n: number) => number

/** Unbiased integer from crypto.getRandomValues (rejection sampling). */
export function secureRandomInt(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n
  const buf = new Uint32Array(1)
  let v: number
  do {
    crypto.getRandomValues(buf)
    v = buf[0]!
  } while (v >= limit)
  return v % n
}

/** Enabled character sets with excluded characters removed; empty sets are dropped. */
export function characterSets(o: PasswordOptions): string[][] {
  return [o.upper ? UPPER : '', o.lower ? LOWER : '', o.digits ? DIGITS : '', o.special ? SPECIAL : '']
    .map((s) => Array.from(s).filter((c) => !o.exclude.includes(c)))
    .filter((s) => s.length > 0)
}

export function passwordAlphabet(o: PasswordOptions): string[] {
  return characterSets(o).flat()
}

export function entropyBits(o: PasswordOptions): number {
  const n = passwordAlphabet(o).length
  return n > 1 ? Math.round(o.length * Math.log2(n)) : 0
}

/** One password; contains at least one character of each enabled set when the length allows. Empty when no characters are available. */
export function generatePassword(o: PasswordOptions, randomInt: RandomInt = secureRandomInt): string {
  const sets = characterSets(o)
  const all = sets.flat()
  if (!all.length) return ''
  const chars: string[] = []
  for (const s of sets) if (chars.length < o.length) chars.push(s[randomInt(s.length)]!)
  while (chars.length < o.length) chars.push(all[randomInt(all.length)]!)
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }
  return chars.join('')
}

export function generatePasswords(o: PasswordOptions, count: number, randomInt: RandomInt = secureRandomInt): string[] {
  if (!passwordAlphabet(o).length) return []
  return Array.from({ length: count }, () => generatePassword(o, randomInt))
}
