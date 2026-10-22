import { describe, expect, it } from 'vitest'
import { parseJsonTable, serializeTable } from './jsonTable'

describe('parseJsonTable', () => {
  it('returns no data and no error for blank input', () => {
    expect(parseJsonTable('  ')).toEqual({ data: null, error: '' })
  })

  it('builds columns from the union of keys in first-seen order', () => {
    const r = parseJsonTable('[{"id":1,"name":"Ada"},{"name":"Linus","lang":"C"}]')
    expect(r.error).toBe('')
    expect(r.data).toEqual({
      columns: ['id', 'name', 'lang'],
      rows: [
        ['1', 'Ada', ''],
        ['', 'Linus', 'C'],
      ],
    })
  })

  it('stringifies nested values and blanks null', () => {
    const r = parseJsonTable('[{"a":{"b":1},"c":[1,2],"d":null,"e":false}]')
    expect(r.data?.rows).toEqual([['{"b":1}', '[1,2]', '', 'false']])
  })

  it('puts primitives and arrays under a "value" column', () => {
    const r = parseJsonTable('[1, "x", [2]]')
    expect(r.data).toEqual({ columns: ['value'], rows: [['1'], ['x'], ['[2]']] })
  })

  it('rejects non-arrays, empty arrays and invalid JSON', () => {
    expect(parseJsonTable('{"a":1}').error).toBe('invalid')
    expect(parseJsonTable('[]').error).toBe('invalid')
    expect(parseJsonTable('[{"a":').error).toBe('invalid')
  })
})

describe('serializeTable', () => {
  const data = {
    columns: ['name', 'note'],
    rows: [
      ['Ada', 'a,b'],
      ['Li "Bo"', 'line1\nline2'],
      ['tab\there', 'semi;colon'],
    ],
  }

  it('writes CSV with RFC 4180 quoting', () => {
    expect(serializeTable(data, 'csv')).toBe('name,note\nAda,"a,b"\n"Li ""Bo""","line1\nline2"\ntab\there,semi;colon')
  })

  it('writes TSV, quoting cells that contain tabs', () => {
    expect(serializeTable(data, 'tsv')).toBe('name\tnote\nAda\ta,b\n"Li ""Bo"""\t"line1\nline2"\n"tab\there"\tsemi;colon')
  })

  it('writes semicolon-separated values', () => {
    expect(serializeTable(data, 'fsv')).toBe('name;note\nAda;a,b\n"Li ""Bo""";"line1\nline2"\ntab\there;"semi;colon"')
  })

  it('quotes carriage returns', () => {
    expect(serializeTable({ columns: ['a'], rows: [['x\ry']] }, 'csv')).toBe('a\n"x\ry"')
  })
})
