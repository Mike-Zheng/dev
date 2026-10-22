/**
 * Smooth layered box-shadow generator, after smoothshadows.com.
 *
 * Instead of one big shadow, several layers are stacked. Each layer's offset and blur grow
 * along an ease-in-quad curve towards the configured maximum, so the shadow is dense near the
 * box and fades out softly. The alpha of each layer depends on the style:
 *  - soft:   grows with each layer (faint close shadow, stronger wide one)
 *  - sharp:  shrinks with each layer (strong close shadow, faint wide one)
 *  - linear: the same alpha for every layer
 */

export type ShadowStyle = 'soft' | 'sharp' | 'linear'

export interface SmoothShadowOptions {
  style: ShadowStyle
  /** Number of stacked layers, 1–10. */
  layers: number
  /** Maximum alpha, 0–1. */
  opacity: number
  /** Blur radius of the outermost layer, in px. */
  blur: number
  /** Vertical offset of the outermost layer, in px. */
  y: number
  /** Horizontal offset of the outermost layer, in px. */
  x: number
  /** Shadow colour as #rgb or #rrggbb. */
  color: string
}

export interface ShadowLayer {
  x: number
  y: number
  blur: number
  rgb: [number, number, number]
  alpha: number
}

export const SHADOW_STYLES: ShadowStyle[] = ['soft', 'sharp', 'linear']

export const DEFAULT_SMOOTH_OPTIONS: SmoothShadowOptions = {
  style: 'soft',
  layers: 5,
  opacity: 0.08,
  blur: 24,
  y: 32,
  x: 0,
  color: '#030712',
}

export interface SmoothPreset {
  /** Collection key, for i18n. */
  collection: 'softVertical' | 'softTilted' | 'sharpVertical' | 'sharpTilted' | 'large'
  size: number
  options: Omit<SmoothShadowOptions, 'color'>
}

const sized = (collection: SmoothPreset['collection'], style: ShadowStyle, tilt: number): SmoothPreset[] =>
  [4, 8, 16, 32].map((size) => ({
    collection,
    size,
    options: { style, layers: 5, opacity: 0.1, blur: size, y: size, x: size * tilt },
  }))

/** The smoothshadows.com preset library. */
export const SMOOTH_PRESETS: SmoothPreset[] = [
  ...sized('softVertical', 'soft', 0),
  ...sized('softTilted', 'soft', 0.5),
  ...sized('sharpVertical', 'sharp', 0),
  ...sized('sharpTilted', 'sharp', 0.5),
  { collection: 'large', size: 80, options: { style: 'soft', layers: 5, opacity: 0.2, blur: 80, y: 80, x: 40 } },
  { collection: 'large', size: 160, options: { style: 'soft', layers: 5, opacity: 0.3, blur: 160, y: 160, x: 80 } },
]

/** Parse #rgb / #rrggbb; returns null for anything else. */
export function parseHex(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, (c) => c + c)
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const easeInQuad = (t: number) => t * t
/** Round to an integer, avoiding "-0". */
const px = (v: number) => Math.round(v) || 0

export function smoothShadowLayers(o: SmoothShadowOptions): ShadowLayer[] {
  const n = Math.max(1, Math.floor(o.layers))
  const rgb = parseHex(o.color) ?? [0, 0, 0]
  const step = o.opacity / n
  const alphaAt = (i: number) => (o.style === 'soft' ? (i + 1) * step : o.style === 'sharp' ? o.opacity - i * step : o.opacity)
  return Array.from({ length: n }, (_, i) => {
    const k = easeInQuad((i + 1) / n)
    return { x: px(k * o.x), y: px(k * o.y), blur: px(k * o.blur), rgb, alpha: alphaAt(i) }
  })
}

/** Layers as a box-shadow value list, one entry per layer. */
export function layersToCss(layers: ShadowLayer[]): string[] {
  return layers.map(({ x, y, blur, rgb, alpha }) => `${x}px ${y}px ${blur}px rgba(${rgb.join(', ')}, ${alpha.toFixed(2)})`)
}

/** Split a box-shadow value on its top-level commas (commas inside rgba() etc. are kept). */
export function splitShadows(value: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < value.length; i++) {
    const c = value[i]
    if (c === '(') depth++
    else if (c === ')') depth = Math.max(0, depth - 1)
    else if (c === ',' && depth === 0) {
      parts.push(value.slice(start, i))
      start = i + 1
    }
  }
  parts.push(value.slice(start))
  return parts.map((p) => p.trim().replace(/\s+/g, ' ')).filter(Boolean)
}

/** A `box-shadow` declaration, one shadow per line when there are several. */
export function toCssDeclaration(value: string): string {
  const parts = splitShadows(value)
  return parts.length ? `box-shadow: ${parts.join(',\n  ')};` : ''
}

/** A Tailwind CSS arbitrary value class, e.g. `shadow-[0_1px_2px_rgba(0,0,0,0.1)]`. */
export function toTailwindClass(value: string): string {
  const parts = splitShadows(value).map((p) => p.replace(/\(\s*|\s*,\s*|\s*\)/g, (m) => m.trim()).replace(/ /g, '_'))
  return parts.length ? `shadow-[${parts.join(',')}]` : ''
}
