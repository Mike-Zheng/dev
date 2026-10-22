import { describe, expect, it } from 'vitest'
import { isMd5Hex, md5Hex, md5Matches, md5Text } from './md5'

const full = { uppercase: false, length: 32 as const }

describe('md5Hex', () => {
  it('matches RFC 1321 test vectors', async () => {
    expect(await md5Hex('', full)).toBe('d41d8cd98f00b204e9800998ecf8427e')
    expect(await md5Hex('abc', full)).toBe('900150983cd24fb0d6963f7d28e17f72')
    expect(await md5Hex('message digest', full)).toBe('f96b697d7cb7938d525a2f31aaf161d0')
  })

  it('hashes UTF-8 text', async () => {
    expect(await md5Hex('中文', full)).toBe('a7bac2239fcdcb3a067903d8077c4a07')
  })

  it('supports uppercase and the 16-char short form', async () => {
    expect(await md5Hex('abc', { uppercase: true, length: 32 })).toBe('900150983CD24FB0D6963F7D28E17F72')
    expect(await md5Hex('abc', { uppercase: false, length: 16 })).toBe('3cd24fb0d6963f7d')
  })
})

describe('md5Text', () => {
  it('hashes each line separately when perLine is set', async () => {
    expect(await md5Text('abc\r\n', { ...full, perLine: true })).toBe('900150983cd24fb0d6963f7d28e17f72\nd41d8cd98f00b204e9800998ecf8427e')
  })

  it('hashes the whole text otherwise', async () => {
    expect(await md5Text('abc', { ...full, perLine: false })).toBe('900150983cd24fb0d6963f7d28e17f72')
  })
})

describe('md5Matches', () => {
  it('accepts the full or short digest, any case, with surrounding spaces', async () => {
    expect(await md5Matches('abc', ' 900150983CD24FB0D6963F7D28E17F72 ')).toBe(true)
    expect(await md5Matches('abc', '3cd24fb0d6963f7d')).toBe(true)
  })

  it('rejects other digests and malformed input', async () => {
    expect(await md5Matches('abd', '900150983cd24fb0d6963f7d28e17f72')).toBe(false)
    expect(await md5Matches('abc', 'not-a-hash')).toBe(false)
  })
})

describe('isMd5Hex', () => {
  it('recognises 16 / 32 hex chars only', () => {
    expect(isMd5Hex('900150983cd24fb0d6963f7d28e17f72')).toBe(true)
    expect(isMd5Hex('3CD24FB0D6963F7D')).toBe(true)
    expect(isMd5Hex('xyz')).toBe(false)
  })
})
