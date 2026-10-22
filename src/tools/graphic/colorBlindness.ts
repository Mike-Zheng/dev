export type Deficiency = 'protanopia' | 'deuteranopia' | 'tritanopia'

export const DEFICIENCIES: Deficiency[] = ['protanopia', 'deuteranopia', 'tritanopia']

/* Brettel/Viénot-style simulation matrices applied in linear RGB (Machado et al. 2009, severity 1.0). Row-major 3×3. */
export const MATRICES: Record<Deficiency, number[]> = {
  protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
}

const LINEAR = new Float32Array(256)
for (let i = 0; i < 256; i++) {
  const c = i / 255
  LINEAR[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** sRGB byte (0–255) → linear light (0–1). */
export function srgbToLinear(byte: number): number {
  return LINEAR[byte]!
}

/** Linear light → sRGB byte, clamped to 0–255. */
export function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  return Math.max(0, Math.min(255, Math.round(c * 255)))
}

/** Applies a simulation matrix to RGBA pixels (e.g. ImageData.data); alpha is copied unchanged. */
export function simulatePixels(src: Uint8ClampedArray, m: number[]): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(src.length)
  for (let i = 0; i < src.length; i += 4) {
    const r = LINEAR[src[i]!]!
    const g = LINEAR[src[i + 1]!]!
    const b = LINEAR[src[i + 2]!]!
    out[i] = linearToSrgb(m[0]! * r + m[1]! * g + m[2]! * b)
    out[i + 1] = linearToSrgb(m[3]! * r + m[4]! * g + m[5]! * b)
    out[i + 2] = linearToSrgb(m[6]! * r + m[7]! * g + m[8]! * b)
    out[i + 3] = src[i + 3]!
  }
  return out
}

/** File name without its extension, falling back to "image". */
export function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '') || 'image'
}
