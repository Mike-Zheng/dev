import { base64ToBytes } from '@/utils/base64'

/** Returns the Base64 payload of a data URL, or the value itself when it has no `data:` prefix. */
export function dataUrlPayload(value: string): string {
  return value.startsWith('data:') ? value.slice(value.indexOf(',') + 1) : value
}

/** Turns user input (data URL or bare Base64) into a URL usable as an <img> source. */
export function toPreviewUrl(value: string): string {
  const v = value.trim()
  if (!v) return ''
  if (v.startsWith('data:')) return v
  return `data:image/png;base64,${v.replace(/\s+/g, '')}`
}

/** Decoded byte length of the input, or null when it is empty or not valid Base64. */
export function decodedSize(value: string): number | null {
  const v = value.trim()
  if (!v) return null
  try {
    return base64ToBytes(dataUrlPayload(v)).length
  } catch {
    return null
  }
}

export function mimeOfDataUrl(url: string): string {
  const m = /^data:([^;,]*)/.exec(url)
  return m?.[1] || 'image/png'
}

/** `image/svg+xml` → `svg`, `image/jpeg` → `jpeg` */
export function extensionOfMime(mime: string): string {
  return mime.split('/')[1]?.split('+')[0] || 'png'
}

/** File name without its extension, falling back to `image`. */
export function baseFileName(name: string): string {
  return name.replace(/\.[^.]+$/, '') || 'image'
}

/** Decodes a data URL into bytes plus the MIME type and file extension to save it with. Throws on invalid Base64. */
export function decodeDataUrl(url: string): { bytes: Uint8Array; mime: string; ext: string } {
  const mime = mimeOfDataUrl(url)
  return { bytes: base64ToBytes(url.slice(url.indexOf(',') + 1)), mime, ext: extensionOfMime(mime) }
}
