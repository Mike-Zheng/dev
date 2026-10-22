import { describe, expect, it } from 'vitest'
import { applyLineOp, caseKeys, charFrequency, convertCase, convertLineBreaks, lineOpKeys, shuffle, splitWords, textStats, wordFrequency } from './analyzer'

/** Deterministic pseudo-random sequence for the random transforms. */
function seq(...values: number[]) {
  let i = 0
  return () => values[i++ % values.length]!
}

describe('textStats', () => {
  it('returns zeros for empty text', () => {
    expect(textStats('')).toEqual({ characters: 0, words: 0, lines: 0, sentences: 0, paragraphs: 0, bytes: 0, lineBreak: 'unknown' })
  })

  it('counts a simple English text', () => {
    const s = textStats('Hello world. How are you?\n\nI am fine!')
    expect(s).toMatchObject({ characters: 37, words: 8, lines: 3, sentences: 3, paragraphs: 2, bytes: 37, lineBreak: 'LF' })
  })

  it('counts characters by code point and bytes as UTF-8', () => {
    const s = textStats('中文👋')
    expect(s.characters).toBe(3)
    expect(s.bytes).toBe(3 + 3 + 4)
  })

  it('counts words with apostrophes, hyphens, digits and CJK runs', () => {
    expect(textStats("don't stop well-known 42 x_y").words).toBe(5)
    expect(textStats('你好 世界').words).toBe(2)
  })

  it('counts CJK sentence terminators', () => {
    expect(textStats('你好。今天好嗎？很好！').sentences).toBe(3)
  })

  it('counts a trailing sentence without terminator', () => {
    expect(textStats('One. Two').sentences).toBe(2)
  })

  it('treats whitespace-only text as zero words/sentences/paragraphs but keeps lines', () => {
    expect(textStats('  \n  ')).toMatchObject({ words: 0, sentences: 0, paragraphs: 0, lines: 2, characters: 5 })
  })

  it('detects line-break styles', () => {
    expect(textStats('a\r\nb').lineBreak).toBe('CRLF')
    expect(textStats('a\nb').lineBreak).toBe('LF')
    expect(textStats('a\rb').lineBreak).toBe('CR')
    expect(textStats('a\r\nb\nc').lineBreak).toBe('mixed')
    expect(textStats('abc').lineBreak).toBe('unknown')
  })

  it('counts lines for every line-break style', () => {
    expect(textStats('a\r\nb\rc\nd').lines).toBe(4)
  })

  it('splits paragraphs on blank lines with CRLF', () => {
    expect(textStats('p1\r\n\r\np2\r\n\r\n\r\np3').paragraphs).toBe(3)
  })
})

describe('wordFrequency', () => {
  it('counts case-insensitively, most frequent first', () => {
    expect(wordFrequency('The cat and the CAT and THE dog')).toEqual([
      ['the', 3],
      ['cat', 2],
      ['and', 2],
      ['dog', 1],
    ])
  })

  it('respects the limit', () => {
    expect(wordFrequency('a b c d', 2)).toHaveLength(2)
  })

  it('returns nothing for empty text', () => {
    expect(wordFrequency('')).toEqual([])
  })
})

describe('charFrequency', () => {
  it('ignores whitespace and counts code points', () => {
    expect(charFrequency('aa b\n👋👋👋')).toEqual([
      ['👋', 3],
      ['a', 2],
      ['b', 1],
    ])
  })

  it('is case sensitive', () => {
    expect(charFrequency('aA')).toEqual([
      ['a', 1],
      ['A', 1],
    ])
  })
})

describe('splitWords', () => {
  it('splits camelCase, PascalCase, acronyms and separators', () => {
    expect(splitWords('helloWorld')).toEqual(['hello', 'World'])
    expect(splitWords('XMLHttpRequest')).toEqual(['XML', 'Http', 'Request'])
    expect(splitWords('snake_case-and kebab')).toEqual(['snake', 'case', 'and', 'kebab'])
    expect(splitWords('version2Beta')).toEqual(['version2', 'Beta'])
  })

  it('returns nothing for separators only', () => {
    expect(splitWords(' -_ ')).toEqual([])
  })
})

describe('convertCase', () => {
  const src = 'hello wORLD foo_bar'

  it.each([
    ['lowerCase', 'hello world foo_bar'],
    ['upperCase', 'HELLO WORLD FOO_BAR'],
    ['titleCase', 'Hello World Foo_Bar'],
    ['camelCase', 'helloWOrldFooBar'],
    ['pascalCase', 'HelloWOrldFooBar'],
    ['snakeCase', 'hello_w_orld_foo_bar'],
    ['constantCase', 'HELLO_W_ORLD_FOO_BAR'],
    ['kebabCase', 'hello-w-orld-foo-bar'],
    ['cobolCase', 'HELLO-W-ORLD-FOO-BAR'],
    ['trainCase', 'Hello-W-Orld-Foo-Bar'],
  ] as const)('%s', (key, expected) => {
    expect(convertCase(key, src)).toBe(expected)
  })

  it('converts identifier-style input', () => {
    expect(convertCase('snakeCase', 'myVariableName')).toBe('my_variable_name')
    expect(convertCase('camelCase', 'my-variable-name')).toBe('myVariableName')
    expect(convertCase('pascalCase', 'MY_CONSTANT')).toBe('MyConstant')
    expect(convertCase('kebabCase', 'XMLHttpRequest')).toBe('xml-http-request')
  })

  it('sentenceCase capitalises the start of each sentence', () => {
    expect(convertCase('sentenceCase', 'HELLO THERE. how ARE you? fine!  ok')).toBe('Hello there. How are you? Fine!  Ok')
  })

  it('alternatingCase and inverseCase work per code point', () => {
    expect(convertCase('alternatingCase', 'abcdef')).toBe('aBcDeF')
    expect(convertCase('inverseCase', 'Hello World 1')).toBe('hELLO wORLD 1')
    expect(convertCase('alternatingCase', '👋ab')).toBe('👋Ab')
  })

  it('randomCase uses the given random source', () => {
    expect(convertCase('randomCase', 'abcd', seq(0.1, 0.9))).toBe('AbCd')
  })

  it('leaves non-letters untouched', () => {
    expect(convertCase('upperCase', '中文 123')).toBe('中文 123')
  })

  it('handles empty input for every case', () => {
    for (const key of caseKeys) expect(convertCase(key, '')).toBe('')
  })
})

describe('applyLineOp', () => {
  it('alphabetizes and reverse-alphabetizes', () => {
    expect(applyLineOp('alphabetize', 'banana\napple\ncherry')).toBe('apple\nbanana\ncherry')
    expect(applyLineOp('reverseAlphabetize', 'banana\napple\ncherry')).toBe('cherry\nbanana\napple')
  })

  it('sorts by last word', () => {
    expect(applyLineOp('alphabetizeLast', 'John Smith\nJane Adams\nBob Brown')).toBe('Jane Adams\nBob Brown\nJohn Smith')
    expect(applyLineOp('reverseAlphabetizeLast', 'John Smith\nJane Adams\nBob Brown')).toBe('John Smith\nBob Brown\nJane Adams')
  })

  it('reverses lines', () => {
    expect(applyLineOp('reverse', '1\n2\n3')).toBe('3\n2\n1')
  })

  it('removes exact duplicates (case sensitive) keeping first occurrence', () => {
    expect(applyLineOp('removeDuplicates', 'a\nb\na\nA\nb')).toBe('a\nb\nA')
  })

  it('trims each line', () => {
    expect(applyLineOp('trimLines', '  a  \n\tb\t')).toBe('a\nb')
  })

  it('accepts CRLF / CR input and joins with LF', () => {
    expect(applyLineOp('reverse', '1\r\n2\r3')).toBe('3\n2\n1')
  })

  it('randomize keeps the same lines', () => {
    const out = applyLineOp('randomize', 'a\nb\nc\nd', seq(0.3, 0.7, 0.1))
    expect(out.split('\n').sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('every op returns an empty string for empty input', () => {
    for (const key of lineOpKeys) expect(applyLineOp(key, '')).toBe('')
  })
})

describe('shuffle', () => {
  it('is a Fisher–Yates shuffle driven by the random source', () => {
    // random() = 0 always swaps with index 0
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1])
    // random() just below 1 swaps each element with itself
    expect(shuffle([1, 2, 3, 4], () => 0.999)).toEqual([1, 2, 3, 4])
  })
})

describe('convertLineBreaks', () => {
  const mixed = 'a\r\nb\nc\rd'

  it('converts to LF', () => {
    expect(convertLineBreaks(mixed, 'LF')).toBe('a\nb\nc\nd')
  })

  it('converts to CRLF without doubling existing CRLF', () => {
    expect(convertLineBreaks(mixed, 'CRLF')).toBe('a\r\nb\r\nc\r\nd')
  })

  it('converts to CR', () => {
    expect(convertLineBreaks(mixed, 'CR')).toBe('a\rb\rc\rd')
  })

  it('is idempotent', () => {
    const once = convertLineBreaks(mixed, 'CRLF')
    expect(convertLineBreaks(once, 'CRLF')).toBe(once)
  })
})
