import { describe, expect, it } from 'vitest'
import { formatDate, isValidFormat } from './dateFormat'

// Built from local components so the expectations hold in any time zone.
const morning = new Date(2024, 0, 5, 9, 7, 3, 45)
const evening = new Date(2024, 10, 25, 21, 30, 59, 999)

describe('formatDate', () => {
  it('formats the common sortable pattern', () => {
    expect(formatDate(morning, 'yyyy-MM-dd HH:mm:ss.fff')).toBe('2024-01-05 09:07:03.045')
  })

  it('supports unpadded and short tokens', () => {
    expect(formatDate(morning, 'yy/M/d H:m:s')).toBe('24/1/5 9:7:3')
    expect(formatDate(evening, 'ff f')).toBe('99 9')
  })

  it('formats 12-hour clock with AM/PM', () => {
    expect(formatDate(morning, 'hh:mm tt')).toBe('09:07 AM')
    expect(formatDate(evening, 'h:mm tt')).toBe('9:30 PM')
    expect(formatDate(new Date(2024, 0, 1, 0, 0), 'h tt')).toBe('12 AM')
    expect(formatDate(new Date(2024, 0, 1, 12, 0), 'h tt')).toBe('12 PM')
  })

  it('uses the locale for month and weekday names', () => {
    expect(formatDate(morning, 'dddd, MMMM d')).toBe('Friday, January 5')
    expect(formatDate(morning, 'ddd MMM')).toBe('Fri Jan')
    expect(formatDate(morning, 'MMMM', 'zh-TW')).toBe('1月')
  })

  it('keeps quoted literals and unknown characters', () => {
    expect(formatDate(morning, "'Year' yyyy 'at' HH")).toBe('Year 2024 at 09')
    expect(formatDate(morning, 'yyyy#MM')).toBe('2024#01')
  })

  it('renders time-zone offsets consistently with getTimezoneOffset', () => {
    const off = -morning.getTimezoneOffset()
    const sign = off >= 0 ? '+' : '-'
    const hh = String(Math.floor(Math.abs(off) / 60)).padStart(2, '0')
    const mm = String(Math.abs(off) % 60).padStart(2, '0')
    expect(formatDate(morning, 'zzz')).toBe(`${sign}${hh}:${mm}`)
    expect(formatDate(morning, 'zz')).toBe(`${sign}${hh}`)
    expect(formatDate(morning, 'z')).toBe(`${sign}${hh.replace(/^0/, '')}`)
  })
})

describe('isValidFormat', () => {
  it('accepts non-empty formats with balanced quotes', () => {
    expect(isValidFormat('yyyy-MM-dd')).toBe(true)
    expect(isValidFormat("'T'HH")).toBe(true)
  })

  it('rejects empty formats and unbalanced quotes', () => {
    expect(isValidFormat('')).toBe(false)
    expect(isValidFormat('   ')).toBe(false)
    expect(isValidFormat("yyyy 'at")).toBe(false)
  })
})
