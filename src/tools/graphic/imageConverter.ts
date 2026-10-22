export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp'

export const IMAGE_FORMATS: { value: ImageFormat; label: string; ext: string }[] = [
  { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
]

export function extensionFor(format: ImageFormat): string {
  return IMAGE_FORMATS.find((f) => f.value === format)?.ext ?? 'png'
}

/** Output file name: the source name with its extension replaced. */
export function outputFileName(sourceName: string, format: ImageFormat): string {
  return `${sourceName.replace(/\.[^.]+$/, '')}.${extensionFor(format)}`
}

/** Scales (width, height) down so the longer side is at most `maxSize`, keeping the aspect ratio. `maxSize <= 0` means no limit; never upscales. */
export function fitWithin(width: number, height: number, maxSize: number): { width: number; height: number } {
  if (maxSize <= 0 || (width <= maxSize && height <= maxSize)) return { width, height }
  const s = maxSize / Math.max(width, height)
  return { width: Math.max(1, Math.round(width * s)), height: Math.max(1, Math.round(height * s)) }
}

/** JPEG has no alpha channel, so transparent pixels need a solid background. */
export function needsOpaqueBackground(format: ImageFormat): boolean {
  return format === 'image/jpeg'
}

/** UI quality (1–100) → canvas.toBlob quality (0–1). */
export function blobQuality(percent: number): number {
  return Math.max(0, Math.min(100, percent)) / 100
}
