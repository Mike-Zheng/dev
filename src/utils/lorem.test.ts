import { describe, expect, it } from 'vitest'
import { corpora, generate, genParagraph, genSentence, genWords, type CorpusId } from './lorem'

const corpusIds = Object.keys(corpora) as CorpusId[]

describe('genWords', () => {
  it('returns the requested number of corpus words', () => {
    const words = genWords(corpora.lorem, 50)
    expect(words).toHaveLength(50)
    for (const w of words) expect(corpora.lorem).toContain(w)
  })

  it('returns nothing for zero words', () => {
    expect(genWords(corpora.lorem, 0)).toEqual([])
  })
})

describe('genSentence / genParagraph', () => {
  it('builds a capitalised sentence of 6–15 words ending with a period', () => {
    for (let i = 0; i < 50; i++) {
      const s = genSentence(corpora.lorem)
      expect(s).toMatch(/^[A-Z].*\.$/)
      const count = s.split(' ').length
      expect(count).toBeGreaterThanOrEqual(6)
      expect(count).toBeLessThanOrEqual(15)
    }
  })

  it('builds a paragraph of 3–6 sentences', () => {
    for (let i = 0; i < 20; i++) {
      const sentences = genParagraph(corpora.lorem).match(/\./g) ?? []
      expect(sentences.length).toBeGreaterThanOrEqual(3)
      expect(sentences.length).toBeLessThanOrEqual(6)
    }
  })
})

describe('generate', () => {
  it('generates words, starting with the classic phrase when asked', () => {
    const out = generate('lorem', 'words', 10, true)
    expect(out.split(' ')).toHaveLength(10)
    expect(out.startsWith('Lorem ipsum dolor sit amet consectetur adipiscing elit')).toBe(true)
  })

  it('truncates the classic phrase when fewer words are requested', () => {
    expect(generate('lorem', 'words', 3, true)).toBe('Lorem ipsum dolor')
  })

  it('generates the requested number of sentences', () => {
    const out = generate('lorem', 'sentences', 4, true)
    expect(out.startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit, ')).toBe(true)
    expect(out.match(/\./g)).toHaveLength(4)
  })

  it('separates paragraphs with blank lines', () => {
    const out = generate('lorem', 'paragraphs', 3, true)
    expect(out.split('\n\n')).toHaveLength(3)
    expect(out.startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit, ')).toBe(true)
  })

  it('ignores "start with lorem" for other corpora', () => {
    for (const id of corpusIds.filter((c) => c !== 'lorem')) {
      const out = generate(id, 'words', 20, true)
      expect(out.startsWith('Lorem ipsum')).toBe(false)
      for (const w of out.split(' ')) expect(corpora[id]).toContain(w)
    }
  })

  it('returns an empty string for zero length', () => {
    expect(generate('lorem', 'words', 0, true)).toBe('')
    expect(generate('lorem', 'sentences', 0, true)).toBe('')
    expect(generate('lorem', 'paragraphs', 0, true)).toBe('')
  })
})
