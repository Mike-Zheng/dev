import type { QRCodeRenderersOptions, QRCodeToStringOptions } from 'qrcode'
import jsQR from 'jsqr'

export type Level = 'L' | 'M' | 'Q' | 'H'

export const levels: { value: Level; label: string }[] = [
  { value: 'L', label: 'L (7%)' },
  { value: 'M', label: 'M (15%)' },
  { value: 'Q', label: 'Q (25%)' },
  { value: 'H', label: 'H (30%)' },
]

export const MARGIN = 2

export function canvasOptions(level: Level): QRCodeRenderersOptions {
  return { errorCorrectionLevel: level, width: 320, margin: MARGIN, color: { dark: '#000000', light: '#ffffff' } }
}

export function svgOptions(level: Level): QRCodeToStringOptions {
  return { type: 'svg', errorCorrectionLevel: level, margin: MARGIN }
}

/** Reads a QR code from RGBA pixels (e.g. canvas ImageData). Returns null when none is found. */
export function decodeQr(rgba: Uint8ClampedArray, width: number, height: number): string | null {
  return jsQR(rgba, width, height)?.data || null
}
