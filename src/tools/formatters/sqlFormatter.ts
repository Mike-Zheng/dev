import { format as formatSql, type KeywordCase, type SqlLanguage } from 'sql-formatter'
import { indentString, type Indent } from '@/utils/indent'
import type { FormatResult } from './jsonFormatter'

export const sqlLanguages: { value: SqlLanguage; label: string }[] = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'transactsql', label: 'Transact-SQL' },
  { value: 'plsql', label: 'PL/SQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'db2', label: 'Db2' },
  { value: 'n1ql', label: 'N1QL' },
  { value: 'redshift', label: 'Amazon Redshift' },
  { value: 'spark', label: 'Spark SQL' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'trino', label: 'Trino' },
]

export interface SqlFormatOptions {
  language: SqlLanguage
  indent: Exclude<Indent, 'minified'>
  keywordCase: KeywordCase
}

export function formatSqlCode(src: string, o: SqlFormatOptions): FormatResult {
  if (!src.trim()) return { output: '', error: '' }
  try {
    const ind = indentString(o.indent)
    return {
      output: formatSql(src, {
        language: o.language,
        useTabs: o.indent === 'tab',
        tabWidth: ind === '\t' ? 4 : ind.length,
        keywordCase: o.keywordCase,
      }),
      error: '',
    }
  } catch (e) {
    return { output: '', error: (e as Error).message }
  }
}
