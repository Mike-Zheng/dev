import { describe, expect, it } from 'vitest'
import { emptyHashes, hashBlob, hashText, matchesAnyHash } from './hash'

describe('hashText', () => {
  it('computes known digests of the empty string', async () => {
    expect(await hashText('', null)).toEqual({
      MD5: 'd41d8cd98f00b204e9800998ecf8427e',
      SHA1: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
      SHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      SHA384: '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b',
      SHA512: 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
      CRC32: '00000000',
    })
  })

  it('computes known digests of "abc"', async () => {
    expect(await hashText('abc', null)).toEqual({
      MD5: '900150983cd24fb0d6963f7d28e17f72',
      SHA1: 'a9993e364706816aba3e25717850c26c9cd0d89d',
      SHA256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      SHA384: 'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
      SHA512: 'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
      CRC32: '352441c2',
    })
  })

  it('uses the standard CRC32 check value', async () => {
    expect((await hashText('123456789', null)).CRC32).toBe('cbf43926')
  })

  it('hashes text as UTF-8', async () => {
    // MD5 of the UTF-8 bytes E4 BD A0 E5 A5 BD ("你好")
    expect((await hashText('你好', null)).MD5).toBe('7eca689f0d3389d9dea66ae112e5cfd7')
  })

  it('computes HMAC digests (RFC 2202 / RFC 4231 test case 2)', async () => {
    const out = await hashText('what do ya want for nothing?', 'Jefe')
    expect(out.MD5).toBe('750c783e6ab0b503eaa86e310a5db738')
    expect(out.SHA1).toBe('effcdf6ae5eb2fa2d27416d5f184df9c259a7c79')
    expect(out.SHA256).toBe('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843')
    expect(out.SHA384).toBe('af45d2e376484031617f78d2b58a6b1b9c7ef464f5a01b47e42ec3736322445e8e2240ca5e69e2c78b3239ecfab21649')
    expect(out.SHA512).toBe('164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea2505549758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737')
  })

  it('keeps CRC32 unkeyed when HMAC is enabled', async () => {
    expect((await hashText('abc', 'secret')).CRC32).toBe('352441c2')
  })

  it('treats an empty HMAC key differently from no HMAC', async () => {
    const plain = await hashText('abc', null)
    const keyed = await hashText('abc', '')
    expect(keyed.SHA256).not.toBe(plain.SHA256)
    // HMAC-SHA256 with an empty key, cross-checked with Node's crypto.createHmac
    expect(keyed.SHA256).toBe('fd7adb152c05ef80dccf50a1fa4c05d5a3ec6da95575fc312ae7c5d091836351')
  })
})

describe('hashBlob', () => {
  it('matches hashText regardless of chunk boundaries', async () => {
    const text = 'The quick brown fox jumps over the lazy dog'.repeat(50)
    const expected = await hashText(text, null)
    expect(await hashBlob(new Blob([text]), null, 7)).toEqual(expected)
    expect(await hashBlob(new Blob([text]), null)).toEqual(expected)
  })

  it('supports HMAC over chunked input', async () => {
    const text = 'what do ya want for nothing?'
    expect(await hashBlob(new Blob([text]), 'Jefe', 3)).toEqual(await hashText(text, 'Jefe'))
  })

  it('hashes an empty blob', async () => {
    expect(await hashBlob(new Blob([]), null)).toEqual(await hashText('', null))
  })
})

describe('matchesAnyHash', () => {
  const hashes = { ...emptyHashes(), MD5: '900150983cd24fb0d6963f7d28e17f72', CRC32: '352441c2' }

  it('matches any algorithm, ignoring case and surrounding whitespace', () => {
    expect(matchesAnyHash(hashes, '  900150983CD24FB0D6963F7D28E17F72 ')).toBe(true)
    expect(matchesAnyHash(hashes, '352441C2')).toBe(true)
  })

  it('rejects other values and blank input', () => {
    expect(matchesAnyHash(hashes, 'deadbeef')).toBe(false)
    expect(matchesAnyHash(hashes, '   ')).toBe(false)
    expect(matchesAnyHash(emptyHashes(), '')).toBe(false)
  })
})
