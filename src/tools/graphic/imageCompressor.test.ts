import { describe, expect, it } from 'vitest'
import {
  PSNR_CAP,
  bestQualityIndex,
  canDrill,
  centerOutOrder,
  crc32,
  createZip,
  defaultLevels,
  detectFormat,
  differenceImage,
  drillLevels,
  formatChange,
  measureDistortion,
  outputFileName,
  recommend,
  resolveOutputFormat,
  sizeChange,
  smallestIndex,
  uniqueNames,
  type RatePoint,
} from './imageCompressor'

/** w×h RGBA image filled by `fn(x, y)` → [r, g, b, a]. */
function image(w: number, h: number, fn: (x: number, y: number) => number[]): Uint8ClampedArray {
  const d = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d.set(fn(x, y), (y * w + x) * 4)
  return d
}

describe('detectFormat', () => {
  it('uses the MIME type first', () => {
    expect(detectFormat('a.bin', 'image/jpeg')).toBe('jpeg')
    expect(detectFormat('a.bin', 'image/png')).toBe('png')
    expect(detectFormat('a.bin', 'image/webp')).toBe('webp')
    expect(detectFormat('a.bin', 'image/svg+xml')).toBe('svg')
  })

  it('falls back to the extension', () => {
    expect(detectFormat('photo.JPG', '')).toBe('jpeg')
    expect(detectFormat('photo.jfif', '')).toBe('jpeg')
    expect(detectFormat('icon.svg', '')).toBe('svg')
    expect(detectFormat('anim.gif', 'image/gif')).toBeNull()
    expect(detectFormat('README', '')).toBeNull()
  })
})

describe('resolveOutputFormat / outputFileName', () => {
  it('keeps the input format on auto and always keeps SVG', () => {
    expect(resolveOutputFormat('png', 'auto')).toBe('png')
    expect(resolveOutputFormat('png', 'webp')).toBe('webp')
    expect(resolveOutputFormat('svg', 'jpeg')).toBe('svg')
  })

  it('replaces the extension', () => {
    expect(outputFileName('Holiday.PNG', 'jpeg')).toBe('Holiday.jpg')
    expect(outputFileName('a.b.webp', 'webp')).toBe('a.b.webp')
    expect(outputFileName('scan', 'png')).toBe('scan.png')
  })
})

describe('levels', () => {
  it('uses Q10–Q90 for raster images and decimal places for SVG', () => {
    expect(defaultLevels('jpeg')).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90])
    expect(defaultLevels('svg')).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('drills into the nine levels above the base', () => {
    expect(drillLevels(70)).toEqual([71, 72, 73, 74, 75, 76, 77, 78, 79])
    expect(drillLevels(90)).toEqual([91, 92, 93, 94, 95, 96, 97, 98, 99])
  })

  it('only drills from the default raster grid', () => {
    expect(canDrill('jpeg', false, 90)).toBe(true)
    expect(canDrill('jpeg', false, 92)).toBe(false)
    expect(canDrill('jpeg', true, 50)).toBe(false)
    expect(canDrill('svg', false, 2)).toBe(false)
  })

  it('orders work from the middle outwards', () => {
    expect(centerOutOrder(9)).toEqual([4, 3, 5, 2, 6, 1, 7, 0, 8])
    expect(centerOutOrder(6)).toEqual([2, 1, 3, 0, 4, 5])
    expect(centerOutOrder(1)).toEqual([0])
    expect(centerOutOrder(0)).toEqual([])
  })
})

describe('measureDistortion', () => {
  const w = 24
  const h = 16
  const gradient = image(w, h, (x, y) => [x * 10, y * 15, (x + y) * 5, 255])

  it('reports a perfect match for identical images', () => {
    const m = measureDistortion(gradient, gradient, w, h)
    expect(m.ssim).toBeCloseTo(1, 10)
    expect(m.psnr).toBe(PSNR_CAP)
    expect(m.rmse).toBe(0)
    expect(m.maxError).toBe(0)
  })

  it('computes RMSE, max error and PSNR for a uniform offset', () => {
    const shifted = image(w, h, (x, y) => [x * 10 + 4, y * 15, (x + y) * 5, 255])
    const m = measureDistortion(gradient, shifted, w, h)
    // only one of three channels differs by 4 → rmse = sqrt(16 / 3)
    expect(m.rmse).toBeCloseTo(Math.sqrt(16 / 3), 6)
    expect(m.maxError).toBe(4)
    expect(m.psnr).toBeCloseTo(20 * Math.log10(255 / Math.sqrt(16 / 3)), 6)
    expect(m.ssim).toBeGreaterThan(0.95)
  })

  it('scores heavy noise lower than light noise', () => {
    const noisy = (amp: number) => image(w, h, (x, y) => {
      const n = ((x * 7 + y * 13) % 5) - 2
      return [x * 10 + n * amp, y * 15 - n * amp, (x + y) * 5 + n * amp, 255]
    })
    const light = measureDistortion(gradient, noisy(2), w, h)
    const heavy = measureDistortion(gradient, noisy(20), w, h)
    expect(heavy.ssim).toBeLessThan(light.ssim)
    expect(heavy.psnr).toBeLessThan(light.psnr)
    expect(heavy.rmse).toBeGreaterThan(light.rmse)
  })

  it('compares transparent pixels as seen over white', () => {
    const clearBlack = image(4, 4, () => [0, 0, 0, 0])
    const clearRed = image(4, 4, () => [255, 0, 0, 0])
    const opaqueBlack = image(4, 4, () => [0, 0, 0, 255])
    expect(measureDistortion(clearBlack, clearRed, 4, 4).rmse).toBe(0)
    expect(measureDistortion(clearBlack, opaqueBlack, 4, 4).maxError).toBe(255)
  })

  it('handles images smaller than the SSIM window', () => {
    const a = image(3, 2, (x) => [x * 80, 0, 0, 255])
    expect(measureDistortion(a, a, 3, 2).ssim).toBeCloseTo(1, 10)
  })

  it('rejects mismatched buffers', () => {
    expect(() => measureDistortion(gradient, new Uint8ClampedArray(8), w, h)).toThrow()
  })
})

describe('differenceImage', () => {
  it('is white where the images match and reddens with the error', () => {
    const a = image(2, 1, () => [100, 100, 100, 255])
    const b = image(2, 1, (x) => (x === 0 ? [100, 100, 100, 255] : [110, 100, 100, 255]))
    const d = differenceImage(a, b, 2, 1, 8)
    expect(Array.from(d.slice(0, 4))).toEqual([255, 255, 255, 255])
    expect(Array.from(d.slice(4, 8))).toEqual([255, 195, 175, 255])
  })
})

describe('recommend', () => {
  const pt = (size: number, ssim: number, psnr = 30): RatePoint => ({ size, ssim, psnr })

  it('picks the knee of the curve', () => {
    // quality saturates quickly while the size keeps growing
    const points = [pt(10_000, 0.6), pt(20_000, 0.9), pt(30_000, 0.95), pt(60_000, 0.97), pt(120_000, 0.98)]
    // distance above the diagonal: 0, 0.698, 0.739, 0.66, 0
    const { best, runnerUp } = recommend(points, 'ssim')
    expect(best).toBe(2)
    expect(runnerUp).toBe(1)
  })

  it('follows the chosen metric', () => {
    const points = [pt(10_000, 0.6, 25), pt(20_000, 0.9, 26), pt(30_000, 0.95, 38), pt(60_000, 0.97, 40)]
    expect(recommend(points, 'ssim').best).toBe(1)
    expect(recommend(points, 'psnr').best).toBe(2)
  })

  it('skips missing points and keeps the original indices', () => {
    const points = [null, pt(10_000, 0.6), null, pt(20_000, 0.9), pt(30_000, 0.95), pt(60_000, 0.97)]
    expect(recommend(points, 'ssim').best).toBe(3)
  })

  it('handles empty and single inputs', () => {
    expect(recommend([], 'ssim')).toEqual({ best: -1, runnerUp: -1 })
    expect(recommend([null, pt(5000, 0.9)], 'ssim')).toEqual({ best: 1, runnerUp: -1 })
  })

  it('falls back to the score on a straight line', () => {
    const points = [pt(10_000, 0.5), pt(20_000, 0.6), pt(30_000, 0.7)]
    const { best } = recommend(points, 'ssim')
    expect(best).toBeGreaterThanOrEqual(0)
  })
})

describe('smallestIndex / bestQualityIndex', () => {
  const points = [null, { size: 300, ssim: 0.99, psnr: 45 }, { size: 100, ssim: 0.8, psnr: 30 }, { size: 200, ssim: 0.9, psnr: 50 }]
  it('finds the extremes', () => {
    expect(smallestIndex(points)).toBe(2)
    expect(bestQualityIndex(points, 'ssim')).toBe(1)
    expect(bestQualityIndex(points, 'psnr')).toBe(3)
    expect(smallestIndex([null])).toBe(-1)
  })
})

describe('sizeChange / formatChange', () => {
  it('reports the relative size change', () => {
    expect(sizeChange(1000, 250)).toBe(-75)
    expect(sizeChange(1000, 1100)).toBeCloseTo(10)
    expect(sizeChange(0, 10)).toBe(0)
    expect(formatChange(-74.6)).toBe('-75%')
    expect(formatChange(9.6)).toBe('+10%')
    expect(formatChange(-0.2)).toBe('0%')
  })
})

describe('uniqueNames', () => {
  it('suffixes duplicates case-insensitively', () => {
    expect(uniqueNames(['a.jpg', 'A.jpg', 'a.jpg', 'b.png', 'noext', 'noext'])).toEqual([
      'a.jpg',
      'A (2).jpg',
      'a (3).jpg',
      'b.png',
      'noext',
      'noext (2)',
    ])
  })
})

describe('createZip', () => {
  it('computes the standard CRC-32', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926)
  })

  it('writes a readable stored archive', () => {
    const files = [
      { name: 'a.txt', data: new TextEncoder().encode('hello') },
      { name: '圖片.png', data: new Uint8Array([1, 2, 3, 4]) },
    ]
    const zip = createZip(files, new Date(2024, 0, 2, 3, 4, 6))
    const v = new DataView(zip.buffer)
    // end of central directory
    const eocd = zip.length - 22
    expect(v.getUint32(eocd, true)).toBe(0x06054b50)
    expect(v.getUint16(eocd + 10, true)).toBe(2)
    // walk the local headers
    let p = 0
    for (const f of files) {
      expect(v.getUint32(p, true)).toBe(0x04034b50)
      expect(v.getUint32(p + 14, true)).toBe(crc32(f.data))
      const nameLen = v.getUint16(p + 26, true)
      expect(new TextDecoder().decode(zip.slice(p + 30, p + 30 + nameLen))).toBe(f.name)
      const size = v.getUint32(p + 18, true)
      expect(Array.from(zip.slice(p + 30 + nameLen, p + 30 + nameLen + size))).toEqual(Array.from(f.data))
      p += 30 + nameLen + size
    }
    expect(v.getUint32(p, true)).toBe(0x02014b50)
    expect(v.getUint32(eocd + 16, true)).toBe(p)
  })
})
