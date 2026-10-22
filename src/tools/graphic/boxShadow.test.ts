import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SMOOTH_OPTIONS,
  SMOOTH_PRESETS,
  layersToCss,
  parseHex,
  smoothShadowLayers,
  splitShadows,
  toCssDeclaration,
  toTailwindClass,
  type SmoothShadowOptions,
} from './boxShadow'
import { SHADOW_EXAMPLES } from './boxShadowExamples'

const opts = (o: Partial<SmoothShadowOptions> = {}): SmoothShadowOptions => ({ ...DEFAULT_SMOOTH_OPTIONS, ...o })

describe('parseHex', () => {
  it('parses short and long hex colours', () => {
    expect(parseHex('#030712')).toEqual([3, 7, 18])
    expect(parseHex('fff')).toEqual([255, 255, 255])
    expect(parseHex('#12345')).toBeNull()
    expect(parseHex('red')).toBeNull()
  })
})

describe('smoothShadowLayers', () => {
  it('matches smoothshadows.com for the default settings', () => {
    expect(layersToCss(smoothShadowLayers(DEFAULT_SMOOTH_OPTIONS))).toEqual([
      '0px 1px 1px rgba(3, 7, 18, 0.02)',
      '0px 5px 4px rgba(3, 7, 18, 0.03)',
      '0px 12px 9px rgba(3, 7, 18, 0.05)',
      '0px 20px 15px rgba(3, 7, 18, 0.06)',
      '0px 32px 24px rgba(3, 7, 18, 0.08)',
    ])
  })

  it('eases offsets and blur in quadratically up to the configured maximum', () => {
    const layers = smoothShadowLayers(opts({ layers: 4, x: -16, y: 16, blur: 32 }))
    expect(layers.map((l) => [l.x, l.y, l.blur])).toEqual([
      [-1, 1, 2],
      [-4, 4, 8],
      [-9, 9, 18],
      [-16, 16, 32],
    ])
  })

  it('never emits negative zero', () => {
    const [first] = smoothShadowLayers(opts({ x: -1, layers: 10 }))
    expect(Object.is(first!.x, -0)).toBe(false)
    expect(layersToCss([first!])[0]).toMatch(/^0px /)
  })

  it('distributes alpha by style', () => {
    const alpha = (style: SmoothShadowOptions['style']) => smoothShadowLayers(opts({ style, layers: 4, opacity: 0.4 })).map((l) => +l.alpha.toFixed(2))
    expect(alpha('soft')).toEqual([0.1, 0.2, 0.3, 0.4])
    expect(alpha('sharp')).toEqual([0.4, 0.3, 0.2, 0.1])
    expect(alpha('linear')).toEqual([0.4, 0.4, 0.4, 0.4])
  })

  it('falls back to black for an invalid colour and at least one layer', () => {
    const layers = smoothShadowLayers(opts({ color: 'nope', layers: 0 }))
    expect(layers).toHaveLength(1)
    expect(layers[0]!.rgb).toEqual([0, 0, 0])
  })

  it('includes the smoothshadows.com preset library', () => {
    expect(SMOOTH_PRESETS).toHaveLength(18)
    expect(SMOOTH_PRESETS.find((p) => p.collection === 'sharpTilted' && p.size === 16)!.options).toEqual({ style: 'sharp', layers: 5, opacity: 0.1, blur: 16, y: 16, x: 8 })
  })
})

describe('splitShadows', () => {
  it('splits only on top-level commas and normalises whitespace', () => {
    expect(splitShadows('rgba(0, 0, 0, 0.1)  0 1px 2px,inset 0 0 0 1px hsla(0,0%,100%,.08) , ')).toEqual([
      'rgba(0, 0, 0, 0.1) 0 1px 2px',
      'inset 0 0 0 1px hsla(0,0%,100%,.08)',
    ])
  })
})

describe('output formats', () => {
  const value = 'rgba(0, 0, 0, 0.16) 0 1px 4px, #333 0 0 0 3px'

  it('writes a CSS declaration with one shadow per line', () => {
    expect(toCssDeclaration(value)).toBe('box-shadow: rgba(0, 0, 0, 0.16) 0 1px 4px,\n  #333 0 0 0 3px;')
    expect(toCssDeclaration('  ')).toBe('')
  })

  it('writes a Tailwind arbitrary value class', () => {
    expect(toTailwindClass(value)).toBe('shadow-[rgba(0,0,0,0.16)_0_1px_4px,#333_0_0_0_3px]')
    expect(toTailwindClass('inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)')).toBe('shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.06)]')
    expect(toTailwindClass('')).toBe('')
  })
})

describe('SHADOW_EXAMPLES', () => {
  it('holds the 96 CSS Scan examples, each a parseable shadow list', () => {
    expect(SHADOW_EXAMPLES).toHaveLength(96)
    for (const e of SHADOW_EXAMPLES) expect(splitShadows(e.css).length).toBeGreaterThan(0)
  })
})
