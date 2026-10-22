import { describe, expect, it } from 'vitest'
import { blobQuality, extensionFor, fitWithin, needsOpaqueBackground, outputFileName } from './imageConverter'

describe('extensionFor / outputFileName', () => {
  it('maps formats to file extensions', () => {
    expect(extensionFor('image/png')).toBe('png')
    expect(extensionFor('image/jpeg')).toBe('jpg')
    expect(extensionFor('image/webp')).toBe('webp')
  })

  it('replaces the last extension of the source name', () => {
    expect(outputFileName('photo.PNG', 'image/jpeg')).toBe('photo.jpg')
    expect(outputFileName('my.holiday.photo.jpeg', 'image/webp')).toBe('my.holiday.photo.webp')
    expect(outputFileName('scan', 'image/png')).toBe('scan.png')
  })
})

describe('fitWithin', () => {
  it('keeps the size when there is no limit or the image already fits', () => {
    expect(fitWithin(4000, 3000, 0)).toEqual({ width: 4000, height: 3000 })
    expect(fitWithin(800, 600, 1024)).toEqual({ width: 800, height: 600 })
    expect(fitWithin(1024, 1024, 1024)).toEqual({ width: 1024, height: 1024 })
  })

  it('scales the longer side down to the limit, keeping the aspect ratio', () => {
    expect(fitWithin(4000, 3000, 1000)).toEqual({ width: 1000, height: 750 })
    expect(fitWithin(3000, 4000, 1000)).toEqual({ width: 750, height: 1000 })
    expect(fitWithin(1920, 1080, 1280)).toEqual({ width: 1280, height: 720 })
  })

  it('rounds and never shrinks a side below one pixel', () => {
    expect(fitWithin(1000, 333, 100)).toEqual({ width: 100, height: 33 })
    expect(fitWithin(10000, 1, 64)).toEqual({ width: 64, height: 1 })
  })

  it('never upscales', () => {
    expect(fitWithin(10, 10, 16384)).toEqual({ width: 10, height: 10 })
  })
})

describe('needsOpaqueBackground', () => {
  it('is only true for JPEG', () => {
    expect(needsOpaqueBackground('image/jpeg')).toBe(true)
    expect(needsOpaqueBackground('image/png')).toBe(false)
    expect(needsOpaqueBackground('image/webp')).toBe(false)
  })
})

describe('blobQuality', () => {
  it('converts a percentage to the 0–1 range, clamped', () => {
    expect(blobQuality(90)).toBe(0.9)
    expect(blobQuality(100)).toBe(1)
    expect(blobQuality(1)).toBe(0.01)
    expect(blobQuality(150)).toBe(1)
    expect(blobQuality(-5)).toBe(0)
  })
})
