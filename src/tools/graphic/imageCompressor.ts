// Pure helpers for the image compressor: format detection, quality levels, distortion metrics,
// the rate–distortion recommendation (ported from Matrix Compress) and a store-only ZIP writer.

export type CompressFormat = 'jpeg' | 'png' | 'webp' | 'svg'
export type RasterFormat = Exclude<CompressFormat, 'svg'>
export type OutputChoice = 'auto' | RasterFormat
export type QualityMetric = 'ssim' | 'psnr'

export const FORMAT_INFO: Record<CompressFormat, { label: string; ext: string; mime: string }> = {
  jpeg: { label: 'JPEG', ext: 'jpg', mime: 'image/jpeg' },
  png: { label: 'PNG', ext: 'png', mime: 'image/png' },
  webp: { label: 'WebP', ext: 'webp', mime: 'image/webp' },
  svg: { label: 'SVG', ext: 'svg', mime: 'image/svg+xml' },
}

export const OUTPUT_CHOICES: OutputChoice[] = ['auto', 'jpeg', 'png', 'webp']

/** Detects the input format from the MIME type, falling back to the file extension. */
export function detectFormat(name: string, mime: string): CompressFormat | null {
  const m = mime.toLowerCase()
  if (m === 'image/jpeg' || m === 'image/jpg' || m === 'image/pjpeg') return 'jpeg'
  if (m === 'image/png' || m === 'image/apng') return 'png'
  if (m === 'image/webp') return 'webp'
  if (m === 'image/svg+xml') return 'svg'
  const ext = /\.([^.]+)$/.exec(name)?.[1]?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'jfif') return 'jpeg'
  if (ext === 'png') return 'png'
  if (ext === 'webp') return 'webp'
  if (ext === 'svg') return 'svg'
  return null
}

/** SVG is always optimized as SVG; raster images follow the chosen output format. */
export function resolveOutputFormat(input: CompressFormat, choice: OutputChoice): CompressFormat {
  if (input === 'svg' || choice === 'auto') return input
  return choice
}

/** Output file name: the source name with its extension replaced. */
export function outputFileName(sourceName: string, format: CompressFormat): string {
  return `${sourceName.replace(/\.[^.]+$/, '')}.${FORMAT_INFO[format].ext}`
}

// ---------------------------------------------------------------- levels

/** Default raster quality levels: Q10 … Q90. */
export const QUALITY_LEVELS = [10, 20, 30, 40, 50, 60, 70, 80, 90]
/** SVG levels are the number of decimals kept in numbers and path data. */
export const SVG_PRECISIONS = [0, 1, 2, 3, 4, 5]

export function defaultLevels(format: CompressFormat): number[] {
  return format === 'svg' ? SVG_PRECISIONS : QUALITY_LEVELS
}

/** Drill-down: the nine levels right above `base` (Q70 → Q71 … Q79). */
export function drillLevels(base: number): number[] {
  return Array.from({ length: 9 }, (_, i) => base + i + 1)
}

/** Only raster levels from the default grid can be refined, and nine steps must still fit under Q100. */
export function canDrill(format: CompressFormat, drilled: boolean, level: number): boolean {
  return format !== 'svg' && !drilled && level <= 91
}

/** Processing order that starts in the middle and fans out (Q50, Q40, Q60, …), so the likely pick shows up first. */
export function centerOutOrder(count: number): number[] {
  if (count <= 0) return []
  const mid = Math.floor((count - 1) / 2)
  const order = [mid]
  for (let d = 1; order.length < count; d++) {
    if (mid - d >= 0) order.push(mid - d)
    if (mid + d < count) order.push(mid + d)
  }
  return order
}

// ---------------------------------------------------------------- metrics

export interface Distortion {
  /** Mean structural similarity of the luminance, 0–1 (1 = identical) */
  ssim: number
  /** Peak signal-to-noise ratio in dB, capped at 100 (identical) */
  psnr: number
  /** Root-mean-square per-channel error, 0–255 */
  rmse: number
  /** Largest per-channel error, 0–255 */
  maxError: number
}

const C1 = (0.01 * 255) ** 2
const C2 = (0.03 * 255) ** 2
const SSIM_WINDOW = 8
const SSIM_STRIDE = 4
export const PSNR_CAP = 100

// Pixels are compared as seen over a white background: c' = c·α + 255·(1 − α).
// Everything is computed on the fly (no per-pixel temporary arrays), so a 12 MP photo stays cheap.

/** Largest per-channel difference of pixel `i` (byte offset), over white. */
function channelDiff(a: ArrayLike<number>, b: ArrayLike<number>, i: number, c: number): number {
  const aa = a[i + 3]! / 255
  const ab = b[i + 3]! / 255
  return Math.abs(a[i + c]! * aa + 255 * (1 - aa) - (b[i + c]! * ab + 255 * (1 - ab)))
}

/** Rec. 601 luminance of pixel `i` (byte offset), over white. */
function luma(d: ArrayLike<number>, i: number): number {
  const a = d[i + 3]! / 255
  return (0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!) * a + 255 * (1 - a)
}

/**
 * Compares two RGBA images of the same size.
 * SSIM is the mean over 8×8 luminance windows with a stride of 4, so windows straddle JPEG block edges.
 */
export function measureDistortion(a: ArrayLike<number>, b: ArrayLike<number>, width: number, height: number): Distortion {
  const n = width * height
  if (n === 0 || a.length < n * 4 || b.length < n * 4) throw new Error('size mismatch')

  let sq = 0
  let maxError = 0
  for (let i = 0; i < n * 4; i += 4) {
    for (let c = 0; c < 3; c++) {
      const d = channelDiff(a, b, i, c)
      sq += d * d
      if (d > maxError) maxError = d
    }
  }
  const rmse = Math.sqrt(sq / (n * 3))
  const psnr = rmse === 0 ? PSNR_CAP : Math.min(PSNR_CAP, 20 * Math.log10(255 / rmse))

  // Sliding windows: per band of rows, accumulate column sums, then add up `ww` columns per window.
  const ww = Math.min(SSIM_WINDOW, width)
  const wh = Math.min(SSIM_WINDOW, height)
  const m = ww * wh
  const sx = new Float64Array(width), sy = new Float64Array(width)
  const sxx = new Float64Array(width), syy = new Float64Array(width), sxy = new Float64Array(width)
  let ssimSum = 0
  let windows = 0
  for (let y0 = 0; y0 + wh <= height; y0 += SSIM_STRIDE) {
    sx.fill(0); sy.fill(0); sxx.fill(0); syy.fill(0); sxy.fill(0)
    for (let y = y0; y < y0 + wh; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const p = luma(a, i)
        const q = luma(b, i)
        sx[x] += p; sy[x] += q; sxx[x] += p * p; syy[x] += q * q; sxy[x] += p * q
      }
    }
    for (let x0 = 0; x0 + ww <= width; x0 += SSIM_STRIDE) {
      let px = 0, py = 0, pxx = 0, pyy = 0, pxy = 0
      for (let x = x0; x < x0 + ww; x++) {
        px += sx[x]!; py += sy[x]!; pxx += sxx[x]!; pyy += syy[x]!; pxy += sxy[x]!
      }
      const mx = px / m, my = py / m
      const vx = pxx / m - mx * mx, vy = pyy / m - my * my, cxy = pxy / m - mx * my
      ssimSum += ((2 * mx * my + C1) * (2 * cxy + C2)) / ((mx * mx + my * my + C1) * (vx + vy + C2))
      windows++
    }
  }
  const ssim = Math.max(0, Math.min(1, ssimSum / windows))
  return { ssim, psnr, rmse, maxError: Math.round(maxError) }
}

/** Visualises |a − b| as a white → amber → red heat map, amplified by `gain` so small errors stand out. */
export function differenceImage(a: ArrayLike<number>, b: ArrayLike<number>, width: number, height: number, gain = 8): Uint8ClampedArray<ArrayBuffer> {
  const n = width * height
  const out = new Uint8ClampedArray(n * 4)
  for (let i = 0; i < n * 4; i += 4) {
    const d = Math.max(channelDiff(a, b, i, 0), channelDiff(a, b, i, 1), channelDiff(a, b, i, 2))
    const v = Math.min(255, d * gain)
    out[i] = 255
    out[i + 1] = 255 - v * 0.75
    out[i + 2] = 255 - v
    out[i + 3] = 255
  }
  return out
}

// ---------------------------------------------------------------- recommendation

export interface RatePoint {
  size: number
  ssim: number
  psnr: number
}

/**
 * Picks the best size / quality trade-off on the rate–distortion curve (Kneedle, Satopaa et al. 2011):
 * both axes are normalised to 0–1 and the point furthest above the diagonal is the "knee".
 * When the curve has no clear knee, falls back to the score metric² / ln(KB + 1).
 * Returns indices into `points` (−1 when there is nothing to pick).
 */
export function recommend(points: (RatePoint | null)[], metric: QualityMetric): { best: number; runnerUp: number } {
  const valid = points.flatMap((p, i) => (p && p.size > 0 ? [{ ...p, i }] : []))
  if (valid.length === 0) return { best: -1, runnerUp: -1 }
  if (valid.length === 1) return { best: valid[0]!.i, runnerUp: -1 }

  const asc = [...valid].sort((a, b) => a.size - b.size)
  const sizes = asc.map((p) => p.size)
  const signal = asc.map((p) => p[metric])
  const xMin = sizes[0]!
  const xRange = sizes[sizes.length - 1]! - xMin || 1
  const yMin = Math.min(...signal)
  const yRange = Math.max(...signal) - yMin || 1

  let knee = 0, kneeDist = -Infinity
  let second = -1, secondDist = -Infinity
  for (let i = 0; i < asc.length; i++) {
    const d = (signal[i]! - yMin) / yRange - (sizes[i]! - xMin) / xRange
    if (d > kneeDist) {
      second = knee; secondDist = kneeDist
      knee = i; kneeDist = d
    } else if (d > secondDist) {
      second = i; secondDist = d
    }
  }
  if (kneeDist > 0.05) return { best: asc[knee]!.i, runnerUp: second >= 0 && second !== knee ? asc[second]!.i : -1 }

  const scored = asc
    .map((p, k) => ({ i: p.i, score: signal[k]! ** 2 / Math.log(sizes[k]! / 1024 + 1) }))
    .sort((a, b) => b.score - a.score)
  return { best: scored[0]!.i, runnerUp: scored[1]?.i ?? -1 }
}

/** Index of the smallest file, or −1. */
export function smallestIndex(points: (RatePoint | null)[]): number {
  let best = -1
  points.forEach((p, i) => {
    if (p && p.size > 0 && (best < 0 || p.size < points[best]!.size)) best = i
  })
  return best
}

/** Index of the highest SSIM / PSNR, or −1. */
export function bestQualityIndex(points: (RatePoint | null)[], metric: QualityMetric): number {
  let best = -1
  points.forEach((p, i) => {
    if (p && (best < 0 || p[metric] > points[best]![metric])) best = i
  })
  return best
}

// ---------------------------------------------------------------- per-image state

export interface Variant {
  level: number
  status: 'queued' | 'done' | 'error'
  blob: Blob | null
  /** Object URL of `blob` ('' until done) */
  url: string
  metrics: Distortion | null
}

export interface CompressItem {
  id: number
  file: File
  input: CompressFormat
  output: CompressFormat
  /** Object URL of the original file */
  original: string
  width: number
  height: number
  /** Base level of the refined grid, or null for the default grid */
  drill: number | null
  /** Every level computed so far, so leaving a refined grid keeps its results */
  variants: Record<number, Variant>
  /** Level picked by the user; null follows the recommendation */
  pick: number | null
  error: string
}

export function levelsOf(item: Pick<CompressItem, 'drill' | 'output'>): number[] {
  return item.drill !== null ? drillLevels(item.drill) : defaultLevels(item.output)
}

export function pointOf(v: Variant | undefined): RatePoint | null {
  return v?.status === 'done' && v.blob && v.metrics ? { size: v.blob.size, ssim: v.metrics.ssim, psnr: v.metrics.psnr } : null
}

// ---------------------------------------------------------------- summary

/** Size change in percent (negative = smaller). */
export function sizeChange(original: number, compressed: number): number {
  return original > 0 ? ((compressed - original) / original) * 100 : 0
}

export function formatChange(percent: number): string {
  const r = Math.round(percent)
  return r > 0 ? `+${r}%` : `${r === 0 ? 0 : r}%`
}

// ---------------------------------------------------------------- ZIP (store only)

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** Makes file names unique by appending " (2)", " (3)" … before the extension. */
export function uniqueNames(names: string[]): string[] {
  const used = new Set<string>()
  return names.map((name) => {
    let candidate = name
    const m = /^(.*?)(\.[^.]*)?$/.exec(name)!
    for (let n = 2; used.has(candidate.toLowerCase()); n++) candidate = `${m[1]} (${n})${m[2] ?? ''}`
    used.add(candidate.toLowerCase())
    return candidate
  })
}

/** Builds an uncompressed ZIP archive (the images are already compressed, deflating them again gains nothing). */
export function createZip(files: { name: string; data: Uint8Array }[], date = new Date()): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder()
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  const entries = files.map((f) => ({ name: enc.encode(f.name), data: f.data, crc: crc32(f.data) }))
  const localSize = entries.reduce((s, e) => s + 30 + e.name.length + e.data.length, 0)
  const centralSize = entries.reduce((s, e) => s + 46 + e.name.length, 0)
  const out = new Uint8Array(localSize + centralSize + 22)
  const v = new DataView(out.buffer)
  let p = 0
  const offsets: number[] = []
  for (const e of entries) {
    offsets.push(p)
    v.setUint32(p, 0x04034b50, true)
    v.setUint16(p + 4, 20, true)
    v.setUint16(p + 6, 0x0800, true) // UTF-8 names
    v.setUint16(p + 8, 0, true) // stored
    v.setUint16(p + 10, dosTime, true)
    v.setUint16(p + 12, dosDate, true)
    v.setUint32(p + 14, e.crc, true)
    v.setUint32(p + 18, e.data.length, true)
    v.setUint32(p + 22, e.data.length, true)
    v.setUint16(p + 26, e.name.length, true)
    v.setUint16(p + 28, 0, true)
    out.set(e.name, p + 30)
    out.set(e.data, p + 30 + e.name.length)
    p += 30 + e.name.length + e.data.length
  }
  const centralStart = p
  entries.forEach((e, i) => {
    v.setUint32(p, 0x02014b50, true)
    v.setUint16(p + 4, 20, true)
    v.setUint16(p + 6, 20, true)
    v.setUint16(p + 8, 0x0800, true)
    v.setUint16(p + 10, 0, true)
    v.setUint16(p + 12, dosTime, true)
    v.setUint16(p + 14, dosDate, true)
    v.setUint32(p + 16, e.crc, true)
    v.setUint32(p + 20, e.data.length, true)
    v.setUint32(p + 24, e.data.length, true)
    v.setUint16(p + 28, e.name.length, true)
    v.setUint32(p + 42, offsets[i]!, true)
    out.set(e.name, p + 46)
    p += 46 + e.name.length
  })
  v.setUint32(p, 0x06054b50, true)
  v.setUint16(p + 8, entries.length, true)
  v.setUint16(p + 10, entries.length, true)
  v.setUint32(p + 12, p - centralStart, true)
  v.setUint32(p + 16, centralStart, true)
  return out
}
