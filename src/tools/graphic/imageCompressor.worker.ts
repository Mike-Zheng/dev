// Web Worker that encodes one quality level at a time and measures it against the source.
// Codecs are loaded lazily, so a worker only downloads the WASM it actually needs.
import { FORMAT_INFO, measureDistortion, type Distortion, type RasterFormat } from './imageCompressor'

export type WorkerRequest =
  | { type: 'encode'; job: number; key: number; source: Blob; format: RasterFormat; level: number }
  | { type: 'svg'; job: number; text: string; precision: number }
  | { type: 'release'; key: number }

export type WorkerResponse =
  | { job: number; ok: true; bytes: ArrayBuffer; metrics: Distortion | null }
  | { job: number; ok: false; error: string }

/** Decoded sources of the most recent images, so nine levels decode the original only once. */
const sources = new Map<number, Promise<ImageData>>()
const SOURCE_CACHE = 2

async function decode(blob: Blob): Promise<ImageData> {
  const bmp = await createImageBitmap(blob)
  const canvas = new OffscreenCanvas(bmp.width, bmp.height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('OffscreenCanvas 2D is not available')
  ctx.drawImage(bmp, 0, 0)
  bmp.close()
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

function source(key: number, blob: Blob): Promise<ImageData> {
  let p = sources.get(key)
  if (!p) {
    p = decode(blob)
    sources.set(key, p)
    p.catch(() => sources.delete(key))
    while (sources.size > SOURCE_CACHE) sources.delete(sources.keys().next().value!)
  }
  return p
}

/** JPEG has no alpha channel: composite transparent pixels over white first. */
function flatten(img: ImageData): ImageData {
  const d = new Uint8ClampedArray(img.data)
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3]! / 255
    if (a === 1) continue
    d[i] = d[i]! * a + 255 * (1 - a)
    d[i + 1] = d[i + 1]! * a + 255 * (1 - a)
    d[i + 2] = d[i + 2]! * a + 255 * (1 - a)
    d[i + 3] = 255
  }
  return new ImageData(d, img.width, img.height)
}

let liqReady: Promise<typeof import('libimagequant-wasm/wasm/libimagequant_wasm.js')> | null = null
function liq() {
  liqReady ??= Promise.all([
    import('libimagequant-wasm/wasm/libimagequant_wasm.js'),
    import('libimagequant-wasm/wasm/libimagequant_wasm_bg.wasm?url'),
  ]).then(async ([mod, wasm]) => {
    await mod.default({ module_or_path: wasm.default })
    return mod
  })
  return liqReady
}

/** pngquant-style lossy PNG: libimagequant palette (≤ 256 colors, quality 0–level) → indexed PNG. */
async function encodePng(img: ImageData, level: number): Promise<Uint8Array> {
  const { ImageQuantizer, encode_palette_to_png } = await liq()
  const quantizer = new ImageQuantizer()
  try {
    quantizer.setMaxColors(256)
    quantizer.setQuality(0, level)
    quantizer.setSpeed(4)
    const result = quantizer.quantizeImage(img.data, img.width, img.height)
    try {
      result.setDithering(1)
      const palette = result.getPalette()
      const indices = result.getPaletteIndices(img.data, img.width, img.height)
      return encode_palette_to_png(indices, palette, img.width, img.height)
    } finally {
      result.free()
    }
  } finally {
    quantizer.free()
  }
}

async function encode(img: ImageData, format: RasterFormat, level: number): Promise<ArrayBuffer> {
  if (format === 'jpeg') {
    const { default: enc } = await import('@jsquash/jpeg/encode')
    return enc(flatten(img), { quality: level })
  }
  if (format === 'webp') {
    const { default: enc } = await import('@jsquash/webp/encode')
    return enc(img, { quality: level })
  }
  const png = await encodePng(img, level)
  return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer
}

async function optimizeSvg(text: string, precision: number): Promise<ArrayBuffer> {
  const { optimize } = await import('svgo/browser')
  const { data } = optimize(text, { multipass: true, floatPrecision: precision })
  return new TextEncoder().encode(data).buffer
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data
  if (req.type === 'release') {
    sources.delete(req.key)
    return
  }
  let res: WorkerResponse
  try {
    if (req.type === 'svg') {
      res = { job: req.job, ok: true, bytes: await optimizeSvg(req.text, req.precision), metrics: null }
    } else {
      const src = await source(req.key, req.source)
      const bytes = await encode(src, req.format, req.level)
      const out = await decode(new Blob([bytes], { type: FORMAT_INFO[req.format].mime }))
      if (out.width !== src.width || out.height !== src.height) throw new Error('decoded size mismatch')
      res = { job: req.job, ok: true, bytes, metrics: measureDistortion(src.data, out.data, src.width, src.height) }
    }
  } catch (err) {
    res = { job: req.job, ok: false, error: err instanceof Error ? err.message : String(err) }
  }
  self.postMessage(res, { transfer: res.ok ? [res.bytes] : [] })
}
