import { CronExpressionParser } from 'cron-parser'
import cronstrue from 'cronstrue'
import 'cronstrue/locales/zh_TW'
import { formatDate, isValidFormat } from '@/utils/dateFormat'

export interface CronOptions {
  useSeconds: boolean
  count: number
  /** .NET-style date format for the upcoming dates. */
  format: string
  zh: boolean
  /** Date to start the schedule from (defaults to now). */
  currentDate?: Date
}

export interface CronResult {
  description: string
  dates: string[]
  error: '' | 'invalid' | 'formatInvalid'
}

/** Describe a cron expression and list its next scheduled dates. */
export function parseCron(expression: string, o: CronOptions): CronResult {
  const expr = expression.trim()
  if (!expr) return { description: '', dates: [], error: '' }
  if (!isValidFormat(o.format)) return { description: '', dates: [], error: 'formatInvalid' }
  const expectedParts = o.useSeconds ? 6 : 5
  if (expr.split(/\s+/).length !== expectedParts) return { description: '', dates: [], error: 'invalid' }
  try {
    const description = cronstrue.toString(expr, { locale: o.zh ? 'zh_TW' : 'en', use24HourTimeFormat: true })
    const it = CronExpressionParser.parse(expr, o.currentDate ? { currentDate: o.currentDate } : undefined)
    const dates: string[] = []
    for (let i = 0; i < o.count; i++) dates.push(formatDate(it.next().toDate(), o.format, o.zh ? 'zh-TW' : 'en-US'))
    return { description, dates, error: '' }
  } catch {
    return { description: '', dates: [], error: 'invalid' }
  }
}
