import * as jose from 'jose'

export const algorithms = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512']

export const KNOWN_CLAIMS = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti']

export interface DecodedToken {
  header: string
  payload: string
  signature: string
}

/** Decodes header and payload as pretty-printed JSON. Throws when the token is malformed. */
export function decodeToken(token: string): DecodedToken {
  const h = jose.decodeProtectedHeader(token)
  const p = jose.decodeJwt(token)
  return { header: JSON.stringify(h, null, 2), payload: JSON.stringify(p, null, 2), signature: token.split('.')[2] ?? '' }
}

export interface Claim {
  name: string
  value: string
  known: boolean
}

/** Lists the payload's claims; numeric dates (exp, nbf, iat) get their ISO time appended. */
export function readClaims(payload: string): Claim[] {
  if (!payload) return []
  try {
    const obj = JSON.parse(payload) as Record<string, unknown>
    return Object.entries(obj).map(([k, v]) => {
      let value = typeof v === 'string' ? v : JSON.stringify(v)
      if (['exp', 'nbf', 'iat'].includes(k) && typeof v === 'number') {
        value = `${v} → ${new Date(v * 1000).toISOString()}`
      }
      return { name: k, value, known: KNOWN_CLAIMS.includes(k) }
    })
  } catch {
    return []
  }
}

type Key = jose.CryptoKey | Uint8Array

/** HS* keys are the raw secret; others accept PEM (SPKI) or a JWK. */
export async function importVerifyKey(alg: string, raw: string): Promise<Key> {
  if (alg.startsWith('HS')) return new TextEncoder().encode(raw)
  if (raw.includes('-----BEGIN')) return jose.importSPKI(raw, alg)
  return jose.importJWK(JSON.parse(raw) as jose.JWK, alg)
}

/** HS* keys are the raw secret; others accept PEM (PKCS#8) or a JWK. */
export async function importSignKey(alg: string, raw: string): Promise<Key> {
  if (alg.startsWith('HS')) return new TextEncoder().encode(raw)
  if (raw.includes('-----BEGIN')) return jose.importPKCS8(raw, alg)
  return jose.importJWK(JSON.parse(raw) as jose.JWK, alg)
}

export type VerifyResult = { ok: true } | { ok: false; error: 'expired' | 'notYet' | 'invalidSig' }

/** Verifies the signature (using the header's alg) and the exp / nbf claims. */
export async function verifyToken(token: string, key: string): Promise<VerifyResult> {
  try {
    const alg = jose.decodeProtectedHeader(token).alg ?? 'HS256'
    await jose.jwtVerify(token, await importVerifyKey(alg, key))
    return { ok: true }
  } catch (e) {
    if (e instanceof jose.errors.JWTExpired) return { ok: false, error: 'expired' }
    if (e instanceof jose.errors.JWTClaimValidationFailed && e.claim === 'nbf') return { ok: false, error: 'notYet' }
    return { ok: false, error: 'invalidSig' }
  }
}

export interface SignOptions {
  alg: string
  header: string
  payload: string
  key: string
  /** Adds iat and an exp this many minutes from now. */
  expiresInMinutes?: number
}

/** Signs a token from JSON header / payload text. Throws on invalid JSON or key. */
export async function signToken(o: SignOptions): Promise<string> {
  const h = JSON.parse(o.header || '{}') as Record<string, unknown>
  const p = JSON.parse(o.payload || '{}') as jose.JWTPayload
  const key = await importSignKey(o.alg, o.key)
  let builder = new jose.SignJWT(p).setProtectedHeader({ ...h, alg: o.alg, typ: (h.typ as string) ?? 'JWT' })
  if (o.expiresInMinutes !== undefined) builder = builder.setIssuedAt().setExpirationTime(`${o.expiresInMinutes}m`)
  return builder.sign(key)
}
