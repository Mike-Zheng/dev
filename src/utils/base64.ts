export function bytesToBase64(bytes: Uint8Array, urlSafe = false): string {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  const b64 = btoa(bin)
  return urlSafe ? b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : b64
}

/** Decodes standard or URL-safe Base64 (padding optional, whitespace ignored). Throws on invalid input. */
export function base64ToBytes(input: string): Uint8Array {
  let s = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  if (/[^A-Za-z0-9+/=]/.test(s)) throw new Error('invalid base64')
  s = s.replace(/=+$/, '')
  if (s.length % 4 === 1) throw new Error('invalid base64 length')
  s += '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function isLikelyBase64(s: string): boolean {
  const trimmed = s.trim()
  if (trimmed.length < 4) return false
  return /^[A-Za-z0-9+/\-_]+=*$/.test(trimmed.replace(/\s+/g, ''))
}

export function utf8ToBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text))
}

export function base64ToUtf8(b64: string): string {
  return new TextDecoder().decode(base64ToBytes(b64))
}
