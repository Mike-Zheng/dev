/**
 * Escapes / unescapes C-style string literals (`\n`, `\t`, `\"`, `\uXXXX`, `\xXX`, ...).
 */

const ESC: Record<string, string> = { '\\': '\\\\', '"': '\\"', "'": "\\'", '\n': '\\n', '\r': '\\r', '\t': '\\t', '\b': '\\b', '\f': '\\f', '\v': '\\v', '\0': '\\0' }
const UNESC: Record<string, string> = { '\\': '\\', '"': '"', "'": "'", n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '0': '\0', '/': '/' }

export function escapeText(s: string): string {
  return Array.from(s)
    .map((c) => ESC[c] ?? c)
    .join('')
}

/** Throws an `Error` describing the first invalid escape sequence. */
export function unescapeText(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!
    if (c !== '\\') {
      out += c
      continue
    }
    const n = s[i + 1]
    if (n === undefined) throw new Error('trailing backslash')
    if (n === 'u') {
      const hex = s.slice(i + 2, i + 6)
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new Error('bad \\u')
      out += String.fromCharCode(parseInt(hex, 16))
      i += 5
    } else if (n === 'x') {
      const hex = s.slice(i + 2, i + 4)
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) throw new Error('bad \\x')
      out += String.fromCharCode(parseInt(hex, 16))
      i += 3
    } else if (n in UNESC) {
      out += UNESC[n]
      i++
    } else {
      throw new Error(`unknown escape \\${n}`)
    }
  }
  return out
}
