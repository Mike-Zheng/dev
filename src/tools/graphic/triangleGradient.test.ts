import { describe, expect, it } from 'vitest'
import {
  DEFAULT_OPTIONS,
  PALETTES,
  backgroundAt,
  cellPixels,
  createRandom,
  extractPalette,
  generateTriangles,
  parseHex,
  shade,
  toHex,
  toSvg,
  type TriangleOptions,
} from './triangleGradient'

const opts = (o: Partial<TriangleOptions> = {}): TriangleOptions => ({ ...DEFAULT_OPTIONS, colors: PALETTES[0]!, ...o })

describe('createRandom', () => {
  it('follows the Park–Miller sequence', () => {
    const r = createRandom(1)
    expect(r()).toBeCloseTo(16806 / 0x7ffffffe, 12)
    expect(r()).toBeCloseTo((16807 * 16807 - 1) / 0x7ffffffe, 12)
  })

  it('is deterministic and stays within [0, 1)', () => {
    const a = createRandom(42)
    const b = createRandom(42)
    for (let i = 0; i < 1000; i++) {
      const v = a()
      expect(v).toBe(b())
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('maps a zero seed to a valid state', () => {
    expect(createRandom(0)()).toBe(createRandom(0x7ffffffe)())
  })
})

describe('colours', () => {
  it('parses and formats hex colours', () => {
    expect(parseHex('#0a7bbd')).toEqual([10, 123, 189])
    expect(parseHex('fff')).toEqual([255, 255, 255])
    expect(parseHex('#12345')).toBeNull()
    expect(toHex([10, 123, 189])).toBe('#0a7bbd')
    expect(toHex([300, -5, 127.6])).toBe('#ff0080')
  })

  it('fades the background towards the bottom and spreads stops along the diagonal', () => {
    const stops = [parseHex('#ff0000')!, parseHex('#0000ff')!]
    expect(backgroundAt(0, 0, 100, 100, stops)).toEqual([255, 0, 0])
    const end = backgroundAt(100, 100, 100, 100, stops)
    expect(end.map(Math.round)).toEqual([0, 0, 204])
    const mid = backgroundAt(50, 50, 100, 100, stops)
    expect(mid[0]).toBeCloseTo(mid[2], 6)
  })

  it('keeps flat, light-facing triangles at their base colour', () => {
    expect(shade([100, 150, 200], [0, 0, 1]).map(Math.round)).toEqual([100, 150, 200])
  })

  it('darkens triangles tilted away from the light', () => {
    const tilted = shade([100, 150, 200], [-0.6, -0.6, Math.sqrt(1 - 0.72)])
    expect(tilted[0]).toBeLessThan(100)
  })
})

describe('generateTriangles', () => {
  it('is reproducible for a seed and changes with it', () => {
    expect(generateTriangles(opts({ seed: 7 }))).toEqual(generateTriangles(opts({ seed: 7 })))
    expect(generateTriangles(opts({ seed: 7 }))).not.toEqual(generateTriangles(opts({ seed: 8 })))
  })

  it('covers a grid wider than the canvas', () => {
    const o = opts({ width: 400, height: 300, cellSize: 10, variance: 0 })
    const cell = cellPixels(10)
    const columns = Math.ceil((400 + 2 * cell) / cell) + 2
    const rows = Math.ceil((300 + 2 * cell) / (0.865 * cell))
    const tris = generateTriangles(o)
    expect(tris).toHaveLength(2 * (rows - 1) * (columns - 1))
    const xs = tris.flatMap((t) => t.points.map((p) => p[0]))
    const ys = tris.flatMap((t) => t.points.map((p) => p[1]))
    expect(Math.min(...xs)).toBeLessThanOrEqual(0)
    expect(Math.max(...xs)).toBeGreaterThanOrEqual(400)
    expect(Math.min(...ys)).toBeLessThanOrEqual(0)
    expect(Math.max(...ys)).toBeGreaterThanOrEqual(300)
  })

  it('uses a single colour unshaded when the surface is flat', () => {
    const tris = generateTriangles(opts({ width: 200, height: 200, colors: ['#336699'], depth: 0, variance: 0 }))
    for (const t of tris) {
      expect(t.color[2]).toBeLessThanOrEqual(153)
      expect(t.color[2]).toBeGreaterThanOrEqual(Math.floor(153 * 0.8))
      expect(t.color[0] / t.color[2]).toBeCloseTo(51 / 153, 1)
    }
  })

  it('produces valid colours for every option extreme', () => {
    for (const v of [0, 100]) {
      const tris = generateTriangles(opts({ width: 120, height: 80, variance: v, depth: v, dither: v, cellSize: v }))
      for (const t of tris) for (const c of t.color) expect(Number.isInteger(c) && c >= 0 && c <= 255).toBe(true)
    }
  })
})

describe('toSvg', () => {
  it('writes only the triangles that touch the canvas', () => {
    const tris = generateTriangles(opts({ width: 300, height: 200 }))
    const svg = toSvg(tris, 300, 200)
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="300" height="200" viewBox="0 0 300 200">/)
    const paths = svg.match(/<path /g) ?? []
    expect(paths.length).toBeGreaterThan(0)
    expect(paths.length).toBeLessThan(tris.length)
    expect(svg).toMatch(/<path d="M[-\d.]+ [-\d.]+L[-\d.]+ [-\d.]+L[-\d.]+ [-\d.]+Z" fill="#[0-9a-f]{6}" stroke="#[0-9a-f]{6}"\/>/)
  })
})

describe('extractPalette', () => {
  const image = (pixels: [number, number, number, number][]) => Uint8ClampedArray.from(pixels.flat())

  it('finds the dominant colours ordered light to dark', () => {
    const data = image([...Array(50).fill([20, 40, 160, 255]), ...Array(50).fill([240, 200, 40, 255])])
    expect(extractPalette(data, 2)).toEqual(['#f0c828', '#1428a0'])
  })

  it('ignores transparent and white pixels', () => {
    const data = image([...Array(50).fill([255, 255, 255, 255]), ...Array(50).fill([200, 0, 0, 10]), [0, 128, 0, 255]])
    expect(extractPalette(data)).toEqual(['#008000'])
    expect(extractPalette(image([[255, 255, 255, 255]]))).toEqual([])
  })
})
