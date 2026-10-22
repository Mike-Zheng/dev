export type TimestampFormat = 'seconds' | 'milliseconds' | 'ticks'

/** .NET ticks (100 ns since 0001-01-01) at the Unix epoch. */
export const EPOCH_TICKS = 621355968000000000n

export interface DateParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  ms: number
}

export function toTimestampText(ms: number, f: TimestampFormat): string {
  if (f === 'seconds') return String(Math.floor(ms / 1000))
  if (f === 'milliseconds') return String(Math.floor(ms))
  return (BigInt(Math.floor(ms)) * 10000n + EPOCH_TICKS).toString()
}

/** Parse an integer timestamp into ms since epoch, or null when it isn't an integer. */
export function fromTimestampText(s: string, f: TimestampFormat): number | null {
  const v = s.trim()
  if (!/^-?\d+$/.test(v)) return null
  if (f === 'seconds') return Number(v) * 1000
  if (f === 'milliseconds') return Number(v)
  const ticks = BigInt(v)
  return Number((ticks - EPOCH_TICKS) / 10000n)
}

/** Wall-clock fields of an instant in time zone `tz`. */
export function partsIn(ms: number, tz: string): DateParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const p: Record<string, number> = {}
  for (const part of dtf.formatToParts(new Date(ms))) {
    if (part.type !== 'literal') p[part.type] = Number(part.value)
  }
  return { year: p.year ?? 1970, month: p.month ?? 1, day: p.day ?? 1, hour: p.hour === 24 ? 0 : (p.hour ?? 0), minute: p.minute ?? 0, second: p.second ?? 0, ms: ((ms % 1000) + 1000) % 1000 }
}

/** UTC offset of `tz` at instant `ms`, in minutes. */
export function offsetMinutes(ms: number, tz: string): number {
  const p = partsIn(ms, tz)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second, p.ms)
  return Math.round((asUtc - ms) / 60000)
}

/** Instant whose wall-clock time in `tz` is `p`. */
export function instantFromParts(p: DateParts, tz: string): number {
  const naive = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second, p.ms)
  let guess = naive - offsetMinutes(naive, tz) * 60000
  guess = naive - offsetMinutes(guess, tz) * 60000
  return guess
}

export function fmtOffset(min: number): string {
  const sign = min >= 0 ? '+' : '-'
  const a = Math.abs(min)
  return `${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`
}

export interface DateOutputs {
  iso: string
  utc: string
  local: string
  offset: string
  dst: boolean
  ticks: string
}

export function dateOutputs(ms: number, tz: string): DateOutputs {
  const d = new Date(ms)
  const off = offsetMinutes(ms, tz)
  const p = partsIn(ms, tz)
  const iso = `${String(p.year).padStart(4, '0')}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}T${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}:${String(p.second).padStart(2, '0')}.${String(p.ms).padStart(3, '0')}${fmtOffset(off)}`
  const jan = offsetMinutes(Date.UTC(p.year, 0, 1), tz)
  const jul = offsetMinutes(Date.UTC(p.year, 6, 1), tz)
  return {
    iso,
    utc: d.toISOString().replace('T', ' ').replace('Z', ' UTC'),
    local: d.toLocaleString(undefined, { timeZone: tz, dateStyle: 'full', timeStyle: 'long' }),
    offset: `UTC${fmtOffset(off)}`,
    dst: jan !== jul,
    ticks: toTimestampText(ms, 'ticks'),
  }
}
