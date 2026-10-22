import { describe, expect, it } from 'vitest'
import { DEFICIENCIES, MATRICES, baseName, linearToSrgb, simulatePixels, srgbToLinear } from './colorBlindness'

const px = (...rgba: number[]) => new Uint8ClampedArray(rgba)

describe('sRGB transfer functions', () => {
  it('maps the endpoints exactly', () => {
    expect(srgbToLinear(0)).toBe(0)
    expect(srgbToLinear(255)).toBeCloseTo(1, 6)
    expect(linearToSrgb(0)).toBe(0)
    expect(linearToSrgb(1)).toBe(255)
  })

  it('uses the standard sRGB curve', () => {
    // mid-grey 128 ≈ 21.6% linear light; the linear segment applies below 0.04045
    expect(srgbToLinear(128)).toBeCloseTo(0.2158605, 5)
    expect(srgbToLinear(10)).toBeCloseTo(10 / 255 / 12.92, 7)
  })

  it('round-trips every byte', () => {
    for (let i = 0; i < 256; i++) expect(linearToSrgb(srgbToLinear(i))).toBe(i)
  })

  it('clamps out-of-gamut values', () => {
    expect(linearToSrgb(-0.5)).toBe(0)
    expect(linearToSrgb(1.7)).toBe(255)
  })
})

describe('MATRICES', () => {
  it.each(DEFICIENCIES)('%s preserves white (rows sum to ~1)', (kind) => {
    const m = MATRICES[kind]
    for (let row = 0; row < 3; row++) expect(m[row * 3]! + m[row * 3 + 1]! + m[row * 3 + 2]!).toBeCloseTo(1, 2)
  })
})

describe('simulatePixels', () => {
  it('leaves pixels unchanged with the identity matrix', () => {
    const src = px(12, 128, 250, 255, 0, 0, 0, 0)
    expect(simulatePixels(src, [1, 0, 0, 0, 1, 0, 0, 0, 1])).toEqual(src)
  })

  it.each(DEFICIENCIES)('%s keeps black, white and greys neutral', (kind) => {
    const out = simulatePixels(px(0, 0, 0, 255, 255, 255, 255, 255, 128, 128, 128, 255), MATRICES[kind])
    expect(Array.from(out.slice(0, 4))).toEqual([0, 0, 0, 255])
    for (const c of out.slice(4, 7)) expect(c).toBeGreaterThanOrEqual(253)
    for (const c of out.slice(8, 11)) expect(Math.abs(c - 128)).toBeLessThanOrEqual(2)
  })

  it('copies alpha unchanged', () => {
    const out = simulatePixels(px(255, 0, 0, 0, 0, 255, 0, 77, 0, 0, 255, 200), MATRICES.protanopia)
    expect([out[3], out[7], out[11]]).toEqual([0, 77, 200])
  })

  it('makes red and green indistinguishable in hue for protanopia and deuteranopia', () => {
    for (const kind of ['protanopia', 'deuteranopia'] as const) {
      const [r, g] = [simulatePixels(px(255, 0, 0, 255), MATRICES[kind]), simulatePixels(px(0, 255, 0, 255), MATRICES[kind])]
      // both collapse onto the yellow–blue axis: red ≈ green channel, blue lowest
      for (const o of [r, g]) {
        expect(Math.abs(o[0]! - o[1]!)).toBeLessThan(80)
        expect(o[2]!).toBeLessThan(Math.min(o[0]!, o[1]!))
      }
    }
  })

  it('produces known output for pure red under protanopia', () => {
    // linear red (1,0,0) × first column of the matrix, clamped and gamma-encoded
    const out = simulatePixels(px(255, 0, 0, 255), MATRICES.protanopia)
    expect(Array.from(out)).toEqual([linearToSrgb(0.152286), linearToSrgb(0.114503), 0, 255])
  })

  it('does not modify the source and returns a same-sized buffer', () => {
    const src = px(10, 20, 30, 40, 50, 60, 70, 80)
    const copy = src.slice()
    const out = simulatePixels(src, MATRICES.tritanopia)
    expect(src).toEqual(copy)
    expect(out).not.toBe(src)
    expect(out).toHaveLength(src.length)
  })

  it('handles an empty image', () => {
    expect(simulatePixels(new Uint8ClampedArray(0), MATRICES.deuteranopia)).toHaveLength(0)
  })
})

describe('baseName', () => {
  it('strips only the last extension', () => {
    expect(baseName('photo.png')).toBe('photo')
    expect(baseName('archive.tar.gz')).toBe('archive.tar')
    expect(baseName('README')).toBe('README')
  })

  it('falls back to "image" for names that are only an extension', () => {
    expect(baseName('.png')).toBe('image')
    expect(baseName('')).toBe('image')
  })
})
