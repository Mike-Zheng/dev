import { describe, expect, it } from 'vitest'
import { generateUuid, generateUuids, type UuidVersion } from './uuid'

const HYPHENATED = /^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])[0-9a-f]{3}-([0-9a-f])[0-9a-f]{3}-[0-9a-f]{12}$/

describe('generateUuid', () => {
  it.each<UuidVersion>([1, 4, 7])('produces RFC 9562 version %i UUIDs with the RFC variant', (version) => {
    for (const id of generateUuids({ version, hyphens: true, uppercase: false }, 50)) {
      const m = HYPHENATED.exec(id)
      expect(m, id).not.toBeNull()
      expect(m![1]).toBe(String(version))
      expect('89ab').toContain(m![2])
    }
  })

  it('removes hyphens', () => {
    expect(generateUuid({ version: 4, hyphens: false, uppercase: false })).toMatch(/^[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}$/)
  })

  it('uppercases', () => {
    expect(generateUuid({ version: 4, hyphens: true, uppercase: true })).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/)
  })

  it('embeds the current Unix time in v7 UUIDs', () => {
    const before = Date.now()
    const id = generateUuid({ version: 7, hyphens: false, uppercase: false })
    const ms = parseInt(id.slice(0, 12), 16)
    expect(ms).toBeGreaterThanOrEqual(before)
    expect(ms).toBeLessThanOrEqual(Date.now())
  })
})

describe('generateUuids', () => {
  it('returns the requested number of unique ids', () => {
    for (const version of [1, 4, 7] as const) {
      const ids = generateUuids({ version, hyphens: true, uppercase: false }, 1000)
      expect(ids).toHaveLength(1000)
      expect(new Set(ids).size).toBe(1000)
    }
  })

  it('generates v7 ids in strictly increasing order', () => {
    const ids = generateUuids({ version: 7, hyphens: true, uppercase: false }, 500)
    expect([...ids].sort()).toEqual(ids)
  })

  it('returns an empty list for a zero count', () => {
    expect(generateUuids({ version: 4, hyphens: true, uppercase: false }, 0)).toEqual([])
  })
})
