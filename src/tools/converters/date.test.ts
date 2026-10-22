import { describe, expect, it } from 'vitest'
import { EPOCH_TICKS, dateOutputs, fmtOffset, fromTimestampText, instantFromParts, offsetMinutes, partsIn, toTimestampText } from './date'

// 2024-03-15T12:34:56.789Z
const MS = Date.UTC(2024, 2, 15, 12, 34, 56, 789)

describe('timestamps', () => {
  it('formats seconds, milliseconds and .NET ticks', () => {
    expect(toTimestampText(MS, 'seconds')).toBe('1710506096')
    expect(toTimestampText(MS, 'milliseconds')).toBe('1710506096789')
    expect(toTimestampText(MS, 'ticks')).toBe('638461028967890000')
    expect(toTimestampText(0, 'ticks')).toBe(EPOCH_TICKS.toString())
  })

  it('floors negative seconds', () => {
    expect(toTimestampText(-1500, 'seconds')).toBe('-2')
  })

  it('parses timestamps back', () => {
    expect(fromTimestampText(' 1710506096 ', 'seconds')).toBe(1710506096000)
    expect(fromTimestampText('1710506096789', 'milliseconds')).toBe(MS)
    expect(fromTimestampText('638461028967890000', 'ticks')).toBe(MS)
    expect(fromTimestampText('-86400', 'seconds')).toBe(-86400000)
  })

  it('rejects non-integers', () => {
    expect(fromTimestampText('', 'seconds')).toBeNull()
    expect(fromTimestampText('1.5', 'seconds')).toBeNull()
    expect(fromTimestampText('12abc', 'milliseconds')).toBeNull()
  })
})

describe('time zones', () => {
  it('splits an instant into wall-clock fields', () => {
    expect(partsIn(MS, 'UTC')).toEqual({ year: 2024, month: 3, day: 15, hour: 12, minute: 34, second: 56, ms: 789 })
    expect(partsIn(MS, 'Asia/Taipei')).toEqual({ year: 2024, month: 3, day: 15, hour: 20, minute: 34, second: 56, ms: 789 })
    expect(partsIn(Date.UTC(2024, 0, 1, 0, 0, 0), 'America/New_York')).toMatchObject({ year: 2023, month: 12, day: 31, hour: 19 })
  })

  it('keeps milliseconds positive before the epoch', () => {
    expect(partsIn(-1, 'UTC')).toEqual({ year: 1969, month: 12, day: 31, hour: 23, minute: 59, second: 59, ms: 999 })
  })

  it('computes offsets, including DST and half-hour zones', () => {
    expect(offsetMinutes(MS, 'UTC')).toBe(0)
    expect(offsetMinutes(MS, 'Asia/Taipei')).toBe(480)
    expect(offsetMinutes(MS, 'Asia/Kolkata')).toBe(330)
    expect(offsetMinutes(Date.UTC(2024, 0, 15), 'America/New_York')).toBe(-300)
    expect(offsetMinutes(Date.UTC(2024, 6, 15), 'America/New_York')).toBe(-240)
  })

  it('converts wall-clock fields back to the instant', () => {
    for (const tz of ['UTC', 'Asia/Taipei', 'America/New_York', 'Europe/London', 'Australia/Adelaide']) {
      expect(instantFromParts(partsIn(MS, tz), tz)).toBe(MS)
    }
    expect(instantFromParts({ year: 2024, month: 7, day: 1, hour: 8, minute: 0, second: 0, ms: 0 }, 'America/New_York')).toBe(Date.UTC(2024, 6, 1, 12))
  })

  it('formats offsets', () => {
    expect(fmtOffset(0)).toBe('+00:00')
    expect(fmtOffset(330)).toBe('+05:30')
    expect(fmtOffset(-570)).toBe('-09:30')
  })
})

describe('dateOutputs', () => {
  it('produces ISO, UTC, offset and ticks for a zone', () => {
    const o = dateOutputs(MS, 'Asia/Taipei')
    expect(o.iso).toBe('2024-03-15T20:34:56.789+08:00')
    expect(o.utc).toBe('2024-03-15 12:34:56.789 UTC')
    expect(o.offset).toBe('UTC+08:00')
    expect(o.dst).toBe(false)
    expect(o.ticks).toBe('638461028967890000')
    expect(o.local).toContain('2024')
  })

  it('detects daylight saving time', () => {
    expect(dateOutputs(MS, 'America/New_York').dst).toBe(true)
    expect(dateOutputs(MS, 'America/New_York').iso).toBe('2024-03-15T08:34:56.789-04:00')
    expect(dateOutputs(MS, 'UTC').dst).toBe(false)
  })
})
