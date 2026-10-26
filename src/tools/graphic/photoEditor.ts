// Pure helpers for the photo editor (a port of xdadda/mini-photo-editor).
// Rendering itself is done on the GPU by @xdadda/mini-gl; this module holds the parameter
// model, crop geometry, curve spline and histogram math so they can be unit tested.

export const LIGHTS = ['brightness', 'exposure', 'gamma', 'contrast', 'shadows', 'highlights', 'bloom'] as const
export const COLORS = ['temperature', 'tint', 'vibrance', 'saturation', 'sepia'] as const
export const EFFECTS = ['clarity', 'noise', 'vignette'] as const
export const ADJUSTMENT_GROUPS = { lights: LIGHTS, colors: COLORS, effects: EFFECTS } as const

export type AdjustmentGroup = keyof typeof ADJUSTMENT_GROUPS
export type AdjustmentKey = (typeof LIGHTS)[number] | (typeof COLORS)[number] | (typeof EFFECTS)[number]
export type Adjustments = Record<AdjustmentKey, number>

export function defaultAdjustments(): Adjustments {
  const out = {} as Adjustments
  for (const keys of Object.values(ADJUSTMENT_GROUPS)) for (const k of keys) out[k] = 0
  return out
}

export function isGroupNeutral(adj: Adjustments, group: AdjustmentGroup): boolean {
  return ADJUSTMENT_GROUPS[group].every((k) => adj[k] === 0)
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

// ---------------------------------------------------------------- composition

export type QuarterTurn = 0 | 90 | 180 | 270

export function rotateQuarter(rotation: QuarterTurn, deg: 90 | -90): QuarterTurn {
  return ((((rotation + deg) % 360) + 360) % 360) as QuarterTurn
}

/** Canvas size once the image is turned by a multiple of 90°. */
export function rotatedSize(width: number, height: number, rotation: QuarterTurn) {
  return rotation % 180 ? { width: height, height: width } : { width, height }
}

/** Extra zoom (0 = 1:1) so a straightened image still fills the canvas without empty corners. */
export function straightenScale(width: number, height: number, angleDeg: number): number {
  const rad = (Math.abs(angleDeg) * Math.PI) / 180
  const w = width * Math.cos(rad) + height * Math.sin(rad)
  const h = width * Math.sin(rad) + height * Math.cos(rad)
  return Math.max(w / width - 1, h / height - 1)
}

/** Crop rectangle in canvas-relative units (0..1). */
export interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

export const FULL_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 }

export const ASPECTS = ['free', 'original', '1:1', '4:3', '16:9', '3:4', '9:16'] as const
export type Aspect = (typeof ASPECTS)[number]

/** Pixel aspect ratio (width / height) of a preset, or null for free cropping. */
export function aspectRatio(aspect: Aspect, imageWidth: number, imageHeight: number): number | null {
  if (aspect === 'free') return null
  if (aspect === 'original') return imageWidth / imageHeight
  const [w, h] = aspect.split(':').map(Number) as [number, number]
  return w / h
}

/** Convert a pixel aspect ratio to the ratio of a CropRect's w / h on a canvas of that size. */
export function normalizedRatio(ratio: number, canvasWidth: number, canvasHeight: number): number {
  return (ratio * canvasHeight) / canvasWidth
}

/** Largest centered rectangle with the given normalized ratio that fits the canvas. */
export function fitAspect(ratio: number | null): CropRect {
  if (ratio === null) return { ...FULL_CROP }
  const w = ratio >= 1 ? 1 : ratio
  const h = ratio >= 1 ? 1 / ratio : 1
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h }
}

export function isFullCrop(r: CropRect, eps = 1e-6): boolean {
  return r.x < eps && r.y < eps && r.w > 1 - eps && r.h > 1 - eps
}

export function moveCrop(r: CropRect, dx: number, dy: number): CropRect {
  return { ...r, x: clamp(r.x + dx, 0, 1 - r.w), y: clamp(r.y + dy, 0, 1 - r.h) }
}

export type CropHandle = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se'

/**
 * Drag a crop handle by (dx, dy). With a ratio (normalized, see normalizedRatio) only corner
 * handles are meaningful: the opposite corner stays anchored and the rect keeps its shape.
 */
export function resizeCrop(r: CropRect, handle: CropHandle, dx: number, dy: number, ratio: number | null, min = 0.05): CropRect {
  const west = handle.includes('w')
  const east = handle.includes('e')
  const north = handle.includes('n')
  const south = handle.includes('s')

  if (ratio === null) {
    let x0 = r.x
    let y0 = r.y
    let x1 = r.x + r.w
    let y1 = r.y + r.h
    if (west) x0 = clamp(x0 + dx, 0, x1 - min)
    if (east) x1 = clamp(x1 + dx, x0 + min, 1)
    if (north) y0 = clamp(y0 + dy, 0, y1 - min)
    if (south) y1 = clamp(y1 + dy, y0 + min, 1)
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
  }

  const ax = west ? r.x + r.w : r.x
  const ay = north ? r.y + r.h : r.y
  const maxW = west ? ax : 1 - ax
  const maxH = north ? ay : 1 - ay
  const sx = west ? -dx : dx
  const sy = north ? -dy : dy
  // Follow whichever axis the pointer moved further along, in the rect's own proportions.
  let w = Math.abs(sx) >= Math.abs(sy) * ratio ? r.w + sx : (r.h + sy) * ratio
  w = Math.max(w, min, min * ratio)
  let h = w / ratio
  if (w > maxW) {
    w = maxW
    h = w / ratio
  }
  if (h > maxH) {
    h = maxH
    w = h * ratio
  }
  return { x: west ? ax - w : ax, y: north ? ay - h : ay, w, h }
}

export interface PixelRect {
  left: number
  top: number
  width: number
  height: number
}

export function cropToPixels(r: CropRect, width: number, height: number): PixelRect {
  const left = clamp(Math.round(r.x * width), 0, width - 1)
  const top = clamp(Math.round(r.y * height), 0, height - 1)
  return {
    left,
    top,
    width: clamp(Math.round(r.w * width), 1, width - left),
    height: clamp(Math.round(r.h * height), 1, height - top),
  }
}

/** Keep the image's proportions when one side of the output size is edited. */
export function resizeKeepingRatio(side: 'width' | 'height', value: number, ratio: number, min = 16, max = 16384) {
  if (side === 'width') {
    const width = Math.round(clamp(value, min, max))
    return { width, height: Math.max(1, Math.round(width / ratio)) }
  }
  const height = Math.round(clamp(value, min, max))
  return { width: Math.max(1, Math.round(height * ratio)), height }
}

// ---------------------------------------------------------------- curves

export type CurvePoint = [number, number]
export const CURVE_CHANNELS = ['rgb', 'red', 'green', 'blue'] as const
export type CurveChannel = (typeof CURVE_CHANNELS)[number]
export const CURVE_POINTS = 5
/** Minimum horizontal gap between neighbouring curve points. */
export const CURVE_GAP = 0.05

export function linearCurve(n = CURVE_POINTS): CurvePoint[] {
  return Array.from({ length: n }, (_, i) => [i / (n - 1), i / (n - 1)] as CurvePoint)
}

export function isLinearCurve(points: CurvePoint[], eps = 1e-6): boolean {
  return points.every(([x, y]) => Math.abs(x - y) < eps)
}

/** Move one point: end points stay pinned to x = 0 / 1, inner points stay between their neighbours. */
export function moveCurvePoint(points: CurvePoint[], index: number, x: number, y: number): CurvePoint[] {
  const last = points.length - 1
  const nx = index === 0 ? 0 : index === last ? 1 : clamp(x, points[index - 1]![0] + CURVE_GAP, points[index + 1]![0] - CURVE_GAP)
  return points.map((p, i) => (i === index ? [nx, clamp(y, 0, 1)] : [p[0], p[1]]))
}

export const srgbToLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
export const linearToSrgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)

/**
 * mini-gl looks its curves up with linear-light values, where sRGB mid-grey sits at x ≈ 0.21.
 * Resample a curve drawn on sRGB values (like the histogram) into 256 linear-space knots, so
 * the spline mini-gl fits through them reproduces it exactly at every lookup-table entry.
 */
export function linearSpaceCurve(points: CurvePoint[]): CurvePoint[] {
  const f = spline(points)
  return Array.from({ length: 256 }, (_, i) => {
    const x = i / 255
    return [x, srgbToLinear(clamp(f(linearToSrgb(x)), 0, 1))] as CurvePoint
  })
}

/**
 * Curves in the shape mini-gl expects (RGB, R, G, B; null = untouched), or null when every
 * channel is linear and the filter can be skipped.
 */
export function curvesParam(curves: Record<CurveChannel, CurvePoint[]>): (CurvePoint[] | null)[] | null {
  const out = CURVE_CHANNELS.map((c) => (isLinearCurve(curves[c]) ? null : linearSpaceCurve(curves[c])))
  return out.every((c) => c === null) ? null : out
}

/** Natural cubic spline through the points — the same interpolation mini-gl uses for its lookup table. */
export function spline(points: CurvePoint[]): (x: number) => number {
  const pts = [...points].sort((a, b) => a[0] - b[0])
  const n = pts.length
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const y2 = new Array<number>(n).fill(0)
  const u = new Array<number>(n).fill(0)
  for (let i = 1; i < n - 1; i++) {
    const sig = (xs[i]! - xs[i - 1]!) / (xs[i + 1]! - xs[i - 1]!)
    const p = sig * y2[i - 1]! + 2
    y2[i] = (sig - 1) / p
    const d = (ys[i + 1]! - ys[i]!) / (xs[i + 1]! - xs[i]!) - (ys[i]! - ys[i - 1]!) / (xs[i]! - xs[i - 1]!)
    u[i] = ((6 * d) / (xs[i + 1]! - xs[i - 1]!) - sig * u[i - 1]!) / p
  }
  y2[n - 1] = 0
  for (let i = n - 2; i >= 0; i--) y2[i] = y2[i]! * y2[i + 1]! + u[i]!
  return (x) => {
    let lo = 0
    let hi = n - 1
    while (hi - lo > 1) {
      const mid = (hi + lo) >> 1
      if (xs[mid]! > x) hi = mid
      else lo = mid
    }
    const h = xs[hi]! - xs[lo]!
    const a = (xs[hi]! - x) / h
    const b = (x - xs[lo]!) / h
    return a * ys[lo]! + b * ys[hi]! + ((a * a * a - a) * y2[lo]! + (b * b * b - b) * y2[hi]!) * ((h * h) / 6)
  }
}

/** SVG path of the curve in a size × size box (y grows downwards). */
export function curvePath(points: CurvePoint[], size: number, steps = 64): string {
  const f = spline(points)
  const parts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = i / steps
    const y = clamp(f(x), 0, 1)
    parts.push(`${i ? 'L' : 'M'}${(x * size).toFixed(2)} ${((1 - y) * size).toFixed(2)}`)
  }
  return parts.join(' ')
}

// ---------------------------------------------------------------- histogram

export interface Histogram {
  r: Uint32Array
  g: Uint32Array
  b: Uint32Array
  l: Uint32Array
}

/** 256-bin histograms of RGBA pixel data; fully transparent pixels are ignored. */
export function histogram(data: ArrayLike<number>): Histogram {
  const r = new Uint32Array(256)
  const g = new Uint32Array(256)
  const b = new Uint32Array(256)
  const l = new Uint32Array(256)
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    const R = data[i]!
    const G = data[i + 1]!
    const B = data[i + 2]!
    r[R]!++
    g[G]!++
    b[B]!++
    l[Math.round(0.2126 * R + 0.7152 * G + 0.0722 * B)]!++
  }
  return { r, g, b, l }
}

/**
 * Closed SVG area path for one channel in a width × height box. The scale is the 99.5th
 * percentile bin of all channels, so a single spike (e.g. pure black) does not flatten the rest.
 */
export function histogramPath(bins: Uint32Array, width: number, height: number, max: number): string {
  if (max <= 0) return ''
  const step = width / 255
  const parts = [`M0 ${height}`]
  for (let i = 0; i < 256; i++) parts.push(`L${(i * step).toFixed(2)} ${(height - Math.min(1, bins[i]! / max) * height).toFixed(2)}`)
  parts.push(`L${width} ${height}Z`)
  return parts.join(' ')
}

export function histogramScale(h: Histogram): number {
  const all = [...h.r, ...h.g, ...h.b].sort((a, b) => a - b)
  return all[Math.floor(all.length * 0.995)] || all[all.length - 1] || 0
}

// ---------------------------------------------------------------- output

export const EXPORT_FORMATS = ['jpeg', 'png', 'webp'] as const
export type ExportFormat = (typeof EXPORT_FORMATS)[number]

export const EXPORT_EXTENSION: Record<ExportFormat, string> = { jpeg: 'jpg', png: 'png', webp: 'webp' }

export function outputName(fileName: string, format: ExportFormat): string {
  const base = fileName.replace(/\.[^./\\]+$/, '') || 'image'
  return `${base}-edited.${EXPORT_EXTENSION[format]}`
}
