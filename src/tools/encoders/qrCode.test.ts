import { describe, expect, it } from 'vitest'
import QRCode from 'qrcode'
import { canvasOptions, decodeQr, levels, MARGIN, svgOptions, type Level } from './qrCode'

/** Renders the module matrix into black-on-white RGBA pixels, like a canvas would. */
function renderPixels(text: string, level: Level, scale = 4) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: level })
  const size = (modules.size + MARGIN * 2) * scale
  const rgba = new Uint8ClampedArray(size * size * 4).fill(255)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const mx = Math.floor(x / scale) - MARGIN
      const my = Math.floor(y / scale) - MARGIN
      if (mx >= 0 && my >= 0 && mx < modules.size && my < modules.size && modules.get(my, mx)) {
        const i = (y * size + x) * 4
        rgba[i] = rgba[i + 1] = rgba[i + 2] = 0
      }
    }
  }
  return { rgba, size }
}

describe('options', () => {
  it('lists the four error correction levels', () => {
    expect(levels.map((l) => l.value)).toEqual(['L', 'M', 'Q', 'H'])
  })

  it('maps the level into canvas and SVG options', () => {
    expect(canvasOptions('H')).toMatchObject({ errorCorrectionLevel: 'H', margin: MARGIN, width: 320 })
    expect(svgOptions('Q')).toEqual({ type: 'svg', errorCorrectionLevel: 'Q', margin: MARGIN })
  })

  it('produces an SVG with the requested options', async () => {
    const svg = await QRCode.toString('https://example.com', svgOptions('M'))
    expect(svg.startsWith('<svg')).toBe(true)
  })

  it('higher levels need more modules for the same text', () => {
    const size = (level: Level) => QRCode.create('https://example.com/some/long/path', { errorCorrectionLevel: level }).modules.size
    expect(size('H')).toBeGreaterThan(size('L'))
  })
})

describe('decodeQr', () => {
  it.each(levels.map((l) => l.value))('round-trips text at level %s', (level) => {
    const { rgba, size } = renderPixels('https://example.com', level)
    expect(decodeQr(rgba, size, size)).toBe('https://example.com')
  })

  it('round-trips UTF-8 text', () => {
    const { rgba, size } = renderPixels('你好，dev!', 'M')
    expect(decodeQr(rgba, size, size)).toBe('你好，dev!')
  })

  it('returns null when there is no QR code', () => {
    const size = 64
    expect(decodeQr(new Uint8ClampedArray(size * size * 4).fill(255), size, size)).toBeNull()
  })
})
