import { describe, expect, it } from 'vitest'
import {
  FULL_CROP,
  aspectRatio,
  cropToPixels,
  curvePath,
  curvesParam,
  defaultAdjustments,
  fitAspect,
  histogram,
  histogramPath,
  histogramScale,
  isFullCrop,
  isGroupNeutral,
  isLinearCurve,
  linearCurve,
  linearSpaceCurve,
  linearToSrgb,
  moveCrop,
  moveCurvePoint,
  normalizedRatio,
  outputName,
  resizeCrop,
  resizeKeepingRatio,
  rotateQuarter,
  rotatedSize,
  spline,
  srgbToLinear,
  straightenScale,
  type CurvePoint,
} from './photoEditor'

describe('adjustments', () => {
  it('starts neutral in every group', () => {
    const adj = defaultAdjustments()
    expect(Object.keys(adj)).toHaveLength(15)
    expect(isGroupNeutral(adj, 'lights')).toBe(true)
    adj.contrast = 0.2
    expect(isGroupNeutral(adj, 'lights')).toBe(false)
    expect(isGroupNeutral(adj, 'colors')).toBe(true)
  })
})

describe('rotation', () => {
  it('wraps quarter turns in both directions', () => {
    expect(rotateQuarter(0, 90)).toBe(90)
    expect(rotateQuarter(270, 90)).toBe(0)
    expect(rotateQuarter(0, -90)).toBe(270)
  })

  it('swaps the canvas size on odd quarter turns', () => {
    expect(rotatedSize(400, 300, 0)).toEqual({ width: 400, height: 300 })
    expect(rotatedSize(400, 300, 90)).toEqual({ width: 300, height: 400 })
    expect(rotatedSize(400, 300, 180)).toEqual({ width: 400, height: 300 })
  })

  it('zooms just enough to hide the corners when straightening', () => {
    expect(straightenScale(400, 300, 0)).toBe(0)
    // a square turned 45° needs √2 zoom
    expect(straightenScale(100, 100, 45)).toBeCloseTo(Math.SQRT2 - 1, 10)
    expect(straightenScale(400, 300, -10)).toBe(straightenScale(400, 300, 10))
  })
})

describe('crop', () => {
  it('resolves aspect presets', () => {
    expect(aspectRatio('free', 400, 300)).toBeNull()
    expect(aspectRatio('original', 400, 300)).toBeCloseTo(4 / 3)
    expect(aspectRatio('16:9', 400, 300)).toBeCloseTo(16 / 9)
    expect(aspectRatio('3:4', 400, 300)).toBeCloseTo(3 / 4)
  })

  it('converts pixel ratios to canvas-relative ones', () => {
    // a square crop on a 400×200 canvas is half as wide as it is tall in relative units
    expect(normalizedRatio(1, 400, 200)).toBe(0.5)
    expect(normalizedRatio(2, 400, 200)).toBe(1)
  })

  it('fits the largest centered frame', () => {
    expect(fitAspect(null)).toEqual(FULL_CROP)
    expect(fitAspect(1)).toEqual(FULL_CROP)
    expect(fitAspect(0.5)).toEqual({ x: 0.25, y: 0, w: 0.5, h: 1 })
    expect(fitAspect(2)).toEqual({ x: 0, y: 0.25, w: 1, h: 0.5 })
  })

  it('detects a full crop', () => {
    expect(isFullCrop(FULL_CROP)).toBe(true)
    expect(isFullCrop({ x: 0, y: 0, w: 0.99, h: 1 })).toBe(false)
  })

  it('keeps a moved frame inside the canvas', () => {
    const r = { x: 0.2, y: 0.2, w: 0.5, h: 0.5 }
    const m = moveCrop(r, 0.1, -0.1)
    expect(m.x).toBeCloseTo(0.3)
    expect(m.y).toBeCloseTo(0.1)
    expect(moveCrop(r, 1, 1)).toEqual({ x: 0.5, y: 0.5, w: 0.5, h: 0.5 })
    expect(moveCrop(r, -1, -1)).toEqual({ x: 0, y: 0, w: 0.5, h: 0.5 })
  })

  it('resizes freely from edges and corners within bounds', () => {
    const r = { x: 0.2, y: 0.2, w: 0.5, h: 0.5 }
    const e = resizeCrop(r, 'e', 0.1, 0.3, null)
    expect([e.x, e.y]).toEqual([0.2, 0.2])
    expect(e.w).toBeCloseTo(0.6)
    expect(e.h).toBeCloseTo(0.5)
    const nw = resizeCrop(r, 'nw', -0.5, -0.5, null)
    expect(nw.x).toBe(0)
    expect(nw.y).toBe(0)
    expect(nw.w).toBeCloseTo(0.7)
    // cannot collapse below the minimum size
    expect(resizeCrop(r, 'w', 0.9, 0, null).w).toBeCloseTo(0.05)
  })

  it('keeps the ratio and anchors the opposite corner', () => {
    const r = { x: 0.1, y: 0.1, w: 0.4, h: 0.2 } // ratio 2
    const se = resizeCrop(r, 'se', 0.2, 0, 2)
    expect(se.x).toBe(0.1)
    expect(se.y).toBe(0.1)
    expect(se.w).toBeCloseTo(0.6)
    expect(se.w / se.h).toBeCloseTo(2)

    const nw = resizeCrop(r, 'nw', 0, 0.05, 2) // dragged down: shrinks
    expect(nw.x + nw.w).toBeCloseTo(0.5)
    expect(nw.y + nw.h).toBeCloseTo(0.3)
    expect(nw.h).toBeCloseTo(0.15)
    expect(nw.w / nw.h).toBeCloseTo(2)

    // growing past the canvas is clamped while keeping the ratio
    const big = resizeCrop(r, 'se', 5, 5, 2)
    expect(big.x + big.w).toBeLessThanOrEqual(1 + 1e-9)
    expect(big.y + big.h).toBeLessThanOrEqual(1 + 1e-9)
    expect(big.w / big.h).toBeCloseTo(2)
  })

  it('converts to whole pixels inside the canvas', () => {
    expect(cropToPixels(FULL_CROP, 640, 480)).toEqual({ left: 0, top: 0, width: 640, height: 480 })
    expect(cropToPixels({ x: 0.25, y: 0.5, w: 0.5, h: 0.5 }, 640, 480)).toEqual({ left: 160, top: 240, width: 320, height: 240 })
    expect(cropToPixels({ x: 0.999, y: 0, w: 0.5, h: 1 }, 100, 100).width).toBe(1)
  })

  it('resizes keeping the proportions', () => {
    expect(resizeKeepingRatio('width', 800, 4 / 3)).toEqual({ width: 800, height: 600 })
    expect(resizeKeepingRatio('height', 300, 4 / 3)).toEqual({ width: 400, height: 300 })
    expect(resizeKeepingRatio('width', 2, 1)).toEqual({ width: 16, height: 16 })
  })
})

describe('curves', () => {
  it('builds an identity curve', () => {
    const c = linearCurve()
    expect(c).toHaveLength(5)
    expect(c[2]).toEqual([0.5, 0.5])
    expect(isLinearCurve(c)).toBe(true)
  })

  it('pins the end points horizontally and keeps inner points ordered', () => {
    const c = linearCurve()
    expect(moveCurvePoint(c, 0, 0.3, 0.2)[0]).toEqual([0, 0.2])
    expect(moveCurvePoint(c, 4, 0.3, 1.5)[4]).toEqual([1, 1])
    const moved = moveCurvePoint(c, 1, 0.9, 0.4)[1]!
    expect(moved[0]).toBeCloseTo(0.45)
    expect(moved[1]).toBe(0.4)
    // the input is not mutated
    expect(c[1]).toEqual([0.25, 0.25])
  })

  it('only sends modified channels to mini-gl', () => {
    const lin = { rgb: linearCurve(), red: linearCurve(), green: linearCurve(), blue: linearCurve() }
    expect(curvesParam(lin)).toBeNull()
    const red = moveCurvePoint(linearCurve(), 2, 0.5, 0.7)
    const p = curvesParam({ ...lin, red })!
    expect(p[0]).toBeNull()
    expect(p[1]).toHaveLength(256)
    expect(p[2]).toBeNull()
    expect(p[3]).toBeNull()
  })

  it('converts sRGB-space curves into the linear space mini-gl samples in', () => {
    expect(linearToSrgb(srgbToLinear(0.5))).toBeCloseTo(0.5, 10)
    for (const [x, y] of linearSpaceCurve(linearCurve())) expect(y).toBeCloseTo(x, 10)
    // raising sRGB mid-grey to 0.7 must brighten mid-grey, wherever it lands in linear light
    const lut = spline(linearSpaceCurve(moveCurvePoint(linearCurve(), 2, 0.5, 0.7)))
    expect(linearToSrgb(lut(srgbToLinear(0.5)))).toBeCloseTo(0.7, 2)
  })

  it('interpolates through the points with a natural cubic spline', () => {
    const f = spline(linearCurve())
    for (const x of [0, 0.1, 0.33, 0.5, 0.9, 1]) expect(f(x)).toBeCloseTo(x, 10)
    const pts: CurvePoint[] = [
      [0, 0],
      [0.5, 0.8],
      [1, 1],
    ]
    const g = spline(pts)
    expect(g(0.5)).toBeCloseTo(0.8, 10)
    expect(g(0.25)).toBeGreaterThan(0.25)
  })

  it('draws an svg path across the box', () => {
    const d = curvePath(linearCurve(), 256, 4)
    expect(d).toBe('M0.00 256.00 L64.00 192.00 L128.00 128.00 L192.00 64.00 L256.00 0.00')
  })
})

describe('histogram', () => {
  it('bins RGBA pixels and skips transparent ones', () => {
    const h = histogram(new Uint8ClampedArray([255, 0, 0, 255, 255, 255, 255, 255, 10, 20, 30, 0]))
    expect(h.r[255]).toBe(2)
    expect(h.g[0]).toBe(1)
    expect(h.g[255]).toBe(1)
    expect(h.r[10]).toBe(0)
    expect(h.l[255]).toBe(1)
    expect(h.l[54]).toBe(1) // 0.2126 × 255
  })

  it('scales by a high percentile instead of the tallest spike', () => {
    const h = histogram(new Uint8ClampedArray(4 * 1000).map((_, i) => (i % 4 === 3 ? 255 : 0)))
    expect(histogramScale(h)).toBe(1000)
    const d = histogramPath(h.r, 255, 50, 1000)
    expect(d.startsWith('M0 50 L0.00 0.00 L1.00 50.00')).toBe(true)
    expect(d.endsWith('L255 50Z')).toBe(true)
    expect(histogramPath(h.r, 255, 50, 0)).toBe('')
  })
})

describe('outputName', () => {
  it('replaces the extension and marks the file as edited', () => {
    expect(outputName('IMG_0001.HEIC', 'jpeg')).toBe('IMG_0001-edited.jpg')
    expect(outputName('photo.tar.png', 'webp')).toBe('photo.tar-edited.webp')
    expect(outputName('noext', 'png')).toBe('noext-edited.png')
    expect(outputName('', 'png')).toBe('image-edited.png')
  })
})
