import { describe, expect, it } from 'vitest'
import { parseCron, type CronOptions } from './cron'

// Local-time start so the schedule (and its local formatting) does not depend on the machine's time zone.
const start = new Date(2026, 0, 1, 0, 0, 0)
const base: CronOptions = { useSeconds: false, count: 3, format: 'yyyy-MM-dd ddd HH:mm:ss', zh: false, currentDate: start }

describe('parseCron', () => {
  it('returns nothing for empty input', () => {
    expect(parseCron('   ', base)).toEqual({ description: '', dates: [], error: '' })
  })

  it('describes and schedules a daily expression', () => {
    const r = parseCron('0 12 * * *', base)
    expect(r.error).toBe('')
    expect(r.description).toBe('At 12:00')
    expect(r.dates).toEqual(['2026-01-01 Thu 12:00:00', '2026-01-02 Fri 12:00:00', '2026-01-03 Sat 12:00:00'])
  })

  it('handles step expressions', () => {
    const r = parseCron('*/5 * * * *', { ...base, format: 'HH:mm' })
    expect(r.description).toBe('Every 5 minutes')
    expect(r.dates).toEqual(['00:05', '00:10', '00:15'])
  })

  it('honours the requested count', () => {
    expect(parseCron('* * * * *', { ...base, count: 7 }).dates).toHaveLength(7)
  })

  it('supports a seconds field when enabled', () => {
    const r = parseCron('*/10 * * * * *', { ...base, useSeconds: true, format: 'HH:mm:ss' })
    expect(r.description).toBe('Every 10 seconds')
    expect(r.dates).toEqual(['00:00:10', '00:00:20', '00:00:30'])
  })

  it('rejects the wrong number of fields for the seconds setting', () => {
    expect(parseCron('*/10 * * * * *', base).error).toBe('invalid')
    expect(parseCron('* * * * *', { ...base, useSeconds: true }).error).toBe('invalid')
  })

  it('rejects out-of-range values', () => {
    expect(parseCron('61 * * * *', base)).toEqual({ description: '', dates: [], error: 'invalid' })
  })

  it('reports an invalid output format before parsing', () => {
    expect(parseCron('* * * * *', { ...base, format: "yyyy 'unterminated" }).error).toBe('formatInvalid')
    expect(parseCron('* * * * *', { ...base, format: '  ' }).error).toBe('formatInvalid')
  })

  it('describes in Traditional Chinese', () => {
    const r = parseCron('*/5 * * * *', { ...base, zh: true })
    expect(r.description).toBe('每 5 分鐘')
  })
})
