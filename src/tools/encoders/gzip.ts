import { gzip, ungzip } from 'pako'
import { base64ToBytes, bytesToBase64 } from '@/utils/base64'

export interface GzipResult {
  output: string
  /** Space saving in percent: (1 - compressed / uncompressed) * 100 */
  ratio: number
}

function saving(compressed: number, uncompressed: number): number {
  return uncompressed ? (1 - compressed / uncompressed) * 100 : 0
}

/** Compresses UTF-8 text with GZip and returns it as Base64. */
export function compressText(text: string): GzipResult {
  const bytes = new TextEncoder().encode(text)
  const gz = gzip(bytes)
  return { output: bytesToBase64(gz), ratio: saving(gz.length, bytes.length) }
}

/** Decompresses Base64-encoded GZip data to UTF-8 text. Throws on invalid input. */
export function decompressText(b64: string): GzipResult {
  const gz = base64ToBytes(b64)
  const out = ungzip(gz)
  return { output: new TextDecoder().decode(out), ratio: saving(gz.length, out.length) }
}
