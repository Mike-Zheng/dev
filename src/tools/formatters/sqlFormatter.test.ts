import { describe, expect, it } from 'vitest'
import { formatSqlCode, sqlLanguages, type SqlFormatOptions } from './sqlFormatter'

const base: SqlFormatOptions = { language: 'sql', indent: 'two', keywordCase: 'preserve' }

describe('formatSqlCode', () => {
  it('breaks clauses onto their own lines with two-space indentation', () => {
    expect(formatSqlCode('select a, b from t where a = 1', base).output).toBe(
      'select\n  a,\n  b\nfrom\n  t\nwhere\n  a = 1',
    )
  })

  it('honours four-space and tab indentation', () => {
    expect(formatSqlCode('select a from t', { ...base, indent: 'four' }).output).toBe('select\n    a\nfrom\n    t')
    expect(formatSqlCode('select a from t', { ...base, indent: 'tab' }).output).toBe('select\n\ta\nfrom\n\tt')
  })

  it('changes keyword case', () => {
    expect(formatSqlCode('select a from t', { ...base, keywordCase: 'upper' }).output).toBe('SELECT\n  a\nFROM\n  t')
    expect(formatSqlCode('SELECT a FROM t', { ...base, keywordCase: 'lower' }).output).toBe('select\n  a\nfrom\n  t')
    expect(formatSqlCode('SeLeCt a FrOm t', base).output).toBe('SeLeCt\n  a\nFrOm\n  t')
  })

  it('supports dialect-specific syntax', () => {
    expect(formatSqlCode('select `a` from `t`', { ...base, language: 'mysql' }).output).toBe('select\n  `a`\nfrom\n  `t`')
    expect(formatSqlCode('select top 5 a from t', { ...base, language: 'transactsql' }).error).toBe('')
  })

  it('returns nothing for blank input', () => {
    expect(formatSqlCode('   ', base)).toEqual({ output: '', error: '' })
  })

  it('reports an error for unparsable SQL', () => {
    const r = formatSqlCode("select 'unterminated", base)
    expect(r.output).toBe('')
    expect(r.error).not.toBe('')
  })

  it('every listed language formats a simple query', () => {
    for (const { value } of sqlLanguages) {
      expect(formatSqlCode('select a from t', { ...base, language: value }).error, value).toBe('')
    }
  })
})
