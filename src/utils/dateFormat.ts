/**
 * Minimal .NET-style custom date format implementation used by the Cron and Date tools.
 * Supported tokens: yyyy yy MM M dd d HH H hh h mm m ss s fff ff f tt dddd ddd zzz zz z
 * Literal text can be quoted with single quotes.
 */
const TOKEN = /yyyy|yy|MMMM|MMM|MM|M|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|fff|ff|f|tt|zzz|zz|z|'[^']*'/g

function pad(n: number, len: number) {
  return String(n).padStart(len, '0')
}

function tzOffsetString(d: Date, withMinutes: boolean, withColon: boolean): string {
  const off = -d.getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  const abs = Math.abs(off)
  const h = pad(Math.floor(abs / 60), 2)
  const m = pad(abs % 60, 2)
  if (!withMinutes) return `${sign}${h}`
  return `${sign}${h}${withColon ? ':' : ''}${m}`
}

export function formatDate(date: Date, format: string, locale = 'en-US'): string {
  return format.replace(TOKEN, (tok) => {
    switch (tok) {
      case 'yyyy':
        return pad(date.getFullYear(), 4)
      case 'yy':
        return pad(date.getFullYear() % 100, 2)
      case 'MMMM':
        return date.toLocaleString(locale, { month: 'long' })
      case 'MMM':
        return date.toLocaleString(locale, { month: 'short' })
      case 'MM':
        return pad(date.getMonth() + 1, 2)
      case 'M':
        return String(date.getMonth() + 1)
      case 'dddd':
        return date.toLocaleString(locale, { weekday: 'long' })
      case 'ddd':
        return date.toLocaleString(locale, { weekday: 'short' })
      case 'dd':
        return pad(date.getDate(), 2)
      case 'd':
        return String(date.getDate())
      case 'HH':
        return pad(date.getHours(), 2)
      case 'H':
        return String(date.getHours())
      case 'hh':
        return pad(date.getHours() % 12 || 12, 2)
      case 'h':
        return String(date.getHours() % 12 || 12)
      case 'mm':
        return pad(date.getMinutes(), 2)
      case 'm':
        return String(date.getMinutes())
      case 'ss':
        return pad(date.getSeconds(), 2)
      case 's':
        return String(date.getSeconds())
      case 'fff':
        return pad(date.getMilliseconds(), 3)
      case 'ff':
        return pad(Math.floor(date.getMilliseconds() / 10), 2)
      case 'f':
        return String(Math.floor(date.getMilliseconds() / 100))
      case 'tt':
        return date.getHours() < 12 ? 'AM' : 'PM'
      case 'zzz':
        return tzOffsetString(date, true, true)
      case 'zz':
        return tzOffsetString(date, false, false)
      case 'z':
        return tzOffsetString(date, false, false).replace(/^([+-])0/, '$1')
      default:
        return tok.startsWith("'") ? tok.slice(1, -1) : tok
    }
  })
}

export function isValidFormat(format: string): boolean {
  if (!format.trim()) return false
  const quotes = (format.match(/'/g) ?? []).length
  return quotes % 2 === 0
}
