import { describe, expect, it } from 'vitest'
import { queryJsonPath } from './jsonPath'

const store = JSON.stringify({
  store: {
    book: [
      { category: 'reference', author: 'Nigel Rees', title: 'Sayings of the Century', price: 8.95 },
      { category: 'fiction', author: 'Evelyn Waugh', title: 'Sword of Honour', price: 12.99 },
      { category: 'fiction', author: 'J. R. R. Tolkien', title: 'The Lord of the Rings', isbn: '0-395-19395-8', price: 22.99 },
    ],
    bicycle: { color: 'red', price: 19.95 },
  },
})

const values = (json: string, path: string): unknown => JSON.parse(queryJsonPath(json, path).output)

describe('queryJsonPath', () => {
  it('returns the whole document for the root path', () => {
    expect(values('{"a":1}', '$')).toEqual([{ a: 1 }])
  })

  it('supports dot, bracket, index and wildcard notation', () => {
    expect(values(store, '$.store.bicycle.color')).toEqual(['red'])
    expect(values(store, "$['store']['bicycle']['price']")).toEqual([19.95])
    expect(values(store, '$.store.book[0].author')).toEqual(['Nigel Rees'])
    expect(values(store, '$.store.book[-1:].title')).toEqual(['The Lord of the Rings'])
    expect(values(store, '$.store.book[*].category')).toEqual(['reference', 'fiction', 'fiction'])
  })

  it('supports recursive descent, unions, slices and filters', () => {
    expect(values(store, '$..price')).toEqual([8.95, 12.99, 22.99, 19.95])
    expect(values(store, '$.store.book[0,2].price')).toEqual([8.95, 22.99])
    expect(values(store, '$.store.book[0:2].price')).toEqual([8.95, 12.99])
    expect(values(store, '$..book[?(@.isbn)].title')).toEqual(['The Lord of the Rings'])
    expect(values(store, '$..book[?(@.price < 10)].title')).toEqual(['Sayings of the Century'])
  })

  it('pretty-prints matches with two spaces', () => {
    expect(queryJsonPath('{"a":{"b":1}}', '$.a').output).toBe('[\n  {\n    "b": 1\n  }\n]')
  })

  it('flags paths that match nothing', () => {
    expect(queryJsonPath(store, '$.store.car')).toEqual({ output: '', error: '', noMatch: true })
  })

  it('returns an empty result for blank JSON or a blank path', () => {
    const empty = { output: '', error: '', noMatch: false }
    expect(queryJsonPath('  ', '$')).toEqual(empty)
    expect(queryJsonPath('{"a":1}', '  ')).toEqual(empty)
  })

  it('reports invalid JSON before looking at the path', () => {
    expect(queryJsonPath('{a:1}', '$').error).toBe('invalidJson')
    expect(queryJsonPath('{a:1}', '').error).toBe('invalidJson')
  })

  it('reports invalid paths', () => {
    expect(queryJsonPath('{"a":1}', '$[?(@.a ===)]').error).toBe('invalidPath')
  })
})
