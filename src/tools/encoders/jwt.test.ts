import { afterEach, describe, expect, it, vi } from 'vitest'
import * as jose from 'jose'
import { decodeToken, readClaims, signToken, verifyToken } from './jwt'

// The jwt.io sample token, signed with HS256 and the secret "your-256-bit-secret".
const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
const SAMPLE_SECRET = 'your-256-bit-secret'

afterEach(() => {
  vi.useRealTimers()
})

describe('decodeToken', () => {
  it('decodes header, payload and signature', () => {
    const d = decodeToken(SAMPLE)
    expect(JSON.parse(d.header)).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(JSON.parse(d.payload)).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 })
    expect(d.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
    expect(d.header).toBe('{\n  "alg": "HS256",\n  "typ": "JWT"\n}')
  })

  it('throws on malformed tokens', () => {
    expect(() => decodeToken('not-a-token')).toThrow()
    expect(() => decodeToken('a.b.c')).toThrow()
  })
})

describe('readClaims', () => {
  it('formats numeric dates and flags registered claims', () => {
    const claims = readClaims(JSON.stringify({ sub: 'abc', iat: 1516239022, roles: ['a', 'b'], custom: 1 }))
    expect(claims).toEqual([
      { name: 'sub', value: 'abc', known: true },
      { name: 'iat', value: '1516239022 → 2018-01-18T01:30:22.000Z', known: true },
      { name: 'roles', value: '["a","b"]', known: false },
      { name: 'custom', value: '1', known: false },
    ])
  })

  it('returns nothing for empty or invalid JSON', () => {
    expect(readClaims('')).toEqual([])
    expect(readClaims('{')).toEqual([])
  })
})

describe('verifyToken', () => {
  it('accepts the jwt.io sample with the right secret', async () => {
    expect(await verifyToken(SAMPLE, SAMPLE_SECRET)).toEqual({ ok: true })
  })

  it('rejects a wrong secret or a tampered payload', async () => {
    expect(await verifyToken(SAMPLE, 'wrong')).toEqual({ ok: false, error: 'invalidSig' })
    const [h, , s] = SAMPLE.split('.')
    const forged = `${h}.${jose.base64url.encode('{"sub":"0"}')}.${s}`
    expect(await verifyToken(forged, SAMPLE_SECRET)).toEqual({ ok: false, error: 'invalidSig' })
  })

  it('reports expired tokens', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
    const token = await new jose.SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1m').sign(new TextEncoder().encode('k'))
    expect(await verifyToken(token, 'k')).toEqual({ ok: true })
    vi.setSystemTime(new Date('2025-01-01T00:02:00Z'))
    expect(await verifyToken(token, 'k')).toEqual({ ok: false, error: 'expired' })
  })

  it('reports tokens that are not yet valid', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
    const token = await new jose.SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setNotBefore('1h').sign(new TextEncoder().encode('k'))
    expect(await verifyToken(token, 'k')).toEqual({ ok: false, error: 'notYet' })
    vi.setSystemTime(new Date('2025-01-01T02:00:00Z'))
    expect(await verifyToken(token, 'k')).toEqual({ ok: true })
  })

  it('reports an unusable key as a signature failure', async () => {
    const { privateKey } = await jose.generateKeyPair('RS256')
    const token = await new jose.SignJWT({}).setProtectedHeader({ alg: 'RS256' }).sign(privateKey)
    expect(await verifyToken(token, 'not a key')).toEqual({ ok: false, error: 'invalidSig' })
  })
})

describe('signToken', () => {
  it('reproduces the jwt.io sample with HS256', async () => {
    const token = await signToken({
      alg: 'HS256',
      header: '{"alg":"HS256","typ":"JWT"}',
      payload: '{"sub":"1234567890","name":"John Doe","iat":1516239022}',
      key: SAMPLE_SECRET,
    })
    expect(token).toBe(SAMPLE)
  })

  it('defaults typ to JWT and lets the selected alg override the header', async () => {
    const token = await signToken({ alg: 'HS512', header: '{"alg":"none","kid":"1"}', payload: '', key: 's' })
    expect(JSON.parse(decodeToken(token).header)).toEqual({ alg: 'HS512', kid: '1', typ: 'JWT' })
  })

  it('adds iat and exp when an expiration is set', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
    const token = await signToken({ alg: 'HS256', header: '{}', payload: '{"sub":"x"}', key: 's', expiresInMinutes: 30 })
    const now = Date.UTC(2025, 0, 1) / 1000
    expect(JSON.parse(decodeToken(token).payload)).toEqual({ sub: 'x', iat: now, exp: now + 30 * 60 })
  })

  it.each(['RS256', 'PS384', 'ES256'])('signs and verifies %s with PEM keys', async (alg) => {
    const { privateKey, publicKey } = await jose.generateKeyPair(alg, { extractable: true })
    const pkcs8 = await jose.exportPKCS8(privateKey)
    const spki = await jose.exportSPKI(publicKey)
    const token = await signToken({ alg, header: '{}', payload: '{"sub":"pem"}', key: pkcs8 })
    expect(JSON.parse(decodeToken(token).header).alg).toBe(alg)
    expect(await verifyToken(token, spki)).toEqual({ ok: true })
  })

  it('signs and verifies with JWK keys', async () => {
    const { privateKey, publicKey } = await jose.generateKeyPair('ES384', { extractable: true })
    const jwkPriv = JSON.stringify(await jose.exportJWK(privateKey))
    const jwkPub = JSON.stringify(await jose.exportJWK(publicKey))
    const token = await signToken({ alg: 'ES384', header: '{}', payload: '{}', key: jwkPriv })
    expect(await verifyToken(token, jwkPub)).toEqual({ ok: true })
  })

  it('throws on invalid JSON or keys', async () => {
    await expect(signToken({ alg: 'HS256', header: '{', payload: '{}', key: 's' })).rejects.toThrow()
    await expect(signToken({ alg: 'HS256', header: '{}', payload: '[', key: 's' })).rejects.toThrow()
    await expect(signToken({ alg: 'RS256', header: '{}', payload: '{}', key: 'nope' })).rejects.toThrow()
  })
})
