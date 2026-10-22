import { describe, expect, it } from 'vitest'
import { baseFileName, dataUrlPayload, decodeDataUrl, decodedSize, extensionOfMime, mimeOfDataUrl, toPreviewUrl } from './base64Image'

// 1×1 transparent PNG (68 bytes)
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
const PNG_URL = `data:image/png;base64,${PNG_B64}`

describe('dataUrlPayload', () => {
  it('strips the data URL prefix', () => {
    expect(dataUrlPayload(PNG_URL)).toBe(PNG_B64)
  })

  it('returns bare Base64 unchanged', () => {
    expect(dataUrlPayload(PNG_B64)).toBe(PNG_B64)
  })
})

describe('toPreviewUrl', () => {
  it('returns an empty string for blank input', () => {
    expect(toPreviewUrl('')).toBe('')
    expect(toPreviewUrl('  \n ')).toBe('')
  })

  it('keeps data URLs as-is (trimmed)', () => {
    expect(toPreviewUrl(`  ${PNG_URL}\n`)).toBe(PNG_URL)
  })

  it('wraps bare Base64 as a PNG data URL and removes whitespace', () => {
    expect(toPreviewUrl('iVBO Rw0K\nGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=')
  })
})

describe('decodedSize', () => {
  it('measures bare Base64 and data URLs', () => {
    expect(decodedSize(PNG_B64)).toBe(68)
    expect(decodedSize(PNG_URL)).toBe(68)
  })

  it('returns null for empty or invalid input', () => {
    expect(decodedSize('')).toBeNull()
    expect(decodedSize('not*base64')).toBeNull()
  })
})

describe('mimeOfDataUrl / extensionOfMime', () => {
  it('reads the MIME type of a data URL', () => {
    expect(mimeOfDataUrl(PNG_URL)).toBe('image/png')
    expect(mimeOfDataUrl('data:image/svg+xml;base64,PHN2Zy8+')).toBe('image/svg+xml')
    expect(mimeOfDataUrl('data:image/gif,abc')).toBe('image/gif')
  })

  it('falls back to image/png when no MIME type is given', () => {
    expect(mimeOfDataUrl('data:;base64,AAAA')).toBe('image/png')
    expect(mimeOfDataUrl('data:,AAAA')).toBe('image/png')
  })

  it('derives the file extension from the MIME subtype', () => {
    expect(extensionOfMime('image/jpeg')).toBe('jpeg')
    expect(extensionOfMime('image/svg+xml')).toBe('svg')
    expect(extensionOfMime('image')).toBe('png')
  })
})

describe('baseFileName', () => {
  it('removes only the last extension', () => {
    expect(baseFileName('photo.png')).toBe('photo')
    expect(baseFileName('archive.tar.gz')).toBe('archive.tar')
    expect(baseFileName('README')).toBe('README')
  })

  it('falls back to "image" when nothing is left', () => {
    expect(baseFileName('.png')).toBe('image')
    expect(baseFileName('')).toBe('image')
  })
})

describe('decodeDataUrl', () => {
  it('decodes bytes and file type of a data URL', () => {
    const { bytes, mime, ext } = decodeDataUrl(PNG_URL)
    expect(mime).toBe('image/png')
    expect(ext).toBe('png')
    expect(bytes.length).toBe(68)
    // PNG signature
    expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  })

  it('handles SVG data URLs', () => {
    const { bytes, ext } = decodeDataUrl('data:image/svg+xml;base64,PHN2Zy8+')
    expect(ext).toBe('svg')
    expect(new TextDecoder().decode(bytes)).toBe('<svg/>')
  })

  it('throws on an invalid payload', () => {
    expect(() => decodeDataUrl('data:image/png;base64,***')).toThrow()
  })
})
