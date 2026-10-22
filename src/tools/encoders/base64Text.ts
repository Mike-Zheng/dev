import { base64ToBytes, bytesToBase64 } from '@/utils/base64'

export type TextEncoding = 'utf8' | 'ascii'

/** Encodes text to Base64. ASCII mode keeps only the low 7 bits of each UTF-16 code unit. */
export function encodeText(text: string, encoding: TextEncoding, urlSafe: boolean): string {
  const bytes = encoding === 'utf8' ? new TextEncoder().encode(text) : Uint8Array.from(text, (c) => c.charCodeAt(0) & 0x7f)
  return bytesToBase64(bytes, urlSafe)
}

/** Decodes Base64 (standard or URL-safe) to text. Throws on invalid Base64. */
export function decodeText(b64: string, encoding: TextEncoding): string {
  const bytes = base64ToBytes(b64)
  return encoding === 'utf8' ? new TextDecoder('utf-8', { fatal: false }).decode(bytes) : String.fromCharCode(...bytes)
}
