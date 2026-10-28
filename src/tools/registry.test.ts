// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { en } from '@/i18n/locales/en'
import { zhTW } from '@/i18n/locales/zh-TW'
import { findTool, groups, isExternalTool, tools, toolsOfGroup } from './registry'
import '.'

type Dict = { [key: string]: unknown }

/** Flattens a nested dictionary into dotted key paths. */
function keyPaths(dict: Dict, prefix = ''): string[] {
  return Object.entries(dict).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keyPaths(v as Dict, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

describe('tool registry', () => {
  it('registers every tool exactly once', () => {
    const ids = tools.map((t) => t.id)
    expect(ids.length).toBeGreaterThanOrEqual(30)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('assigns every tool to a known group and leaves no group empty', () => {
    const groupIds = groups.map((g) => g.id)
    for (const tool of tools) expect(groupIds).toContain(tool.group)
    for (const id of groupIds) expect(toolsOfGroup(id).length).toBeGreaterThan(0)
  })

  it('finds tools by id', () => {
    expect(findTool('json-yaml')?.group).toBe('converters')
    expect(findTool('does-not-exist')).toBeUndefined()
  })

  beforeAll(() => {
    // jsdom has no matchMedia; useSettings reads it when a tool component is loaded.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
  })

  it('registers Photo Collage and Merino Vector as external links', () => {
    for (const id of ['photo-collage', 'merino-vector']) {
      const tool = findTool(id)
      expect(tool && isExternalTool(tool)).toBe(true)
      expect(tool?.href).toMatch(/^https:\/\/mike-zheng\.github\.io\//)
      expect(tool?.group).toBe('graphic')
    }
    expect(isExternalTool(findTool('json-yaml')!)).toBe(false)
  })

  it.each(tools.filter((t) => !isExternalTool(t)).map((t) => [t.id, t] as const))('lazy-loads the %s component', async (_, tool) => {
    const mod = await tool.component!()
    expect(mod.default).toBeTruthy()
  }, 30_000)
})

describe('i18n dictionaries', () => {
  it('defines the same app-level keys in en and zh-TW', () => {
    const { tools: _enTools, ...enRest } = en as Dict
    const { tools: _zhTools, ...zhRest } = zhTW as Dict
    expect(keyPaths(zhRest).sort()).toEqual(keyPaths(enRest).sort())
  })

  it.each(tools.map((t) => [t.id] as const))('has matching, non-empty strings for %s', (id) => {
    const enTool = (en.tools as Record<string, Dict>)[id]
    const zhTool = ((zhTW as Dict).tools as Record<string, Dict>)[id]
    expect(enTool).toBeDefined()
    expect(zhTool).toBeDefined()
    expect(Object.keys(zhTool!).sort()).toEqual(Object.keys(enTool!).sort())
    for (const key of ['title', 'short', 'description']) {
      expect(enTool![key]).toBeTruthy()
      expect(zhTool![key]).toBeTruthy()
    }
    for (const value of [...Object.values(enTool!), ...Object.values(zhTool!)]) {
      expect(typeof value === 'string' && value.trim().length > 0).toBe(true)
    }
  })

  it('uses the same interpolation placeholders in both languages', () => {
    const placeholders = (s: unknown) => (typeof s === 'string' ? (s.match(/\{\w+\}/g) ?? []).sort() : [])
    const enTools = en.tools as Record<string, Dict>
    const zhTools = (zhTW as Dict).tools as Record<string, Dict>
    for (const id of Object.keys(enTools)) {
      for (const [key, value] of Object.entries(enTools[id]!)) {
        expect(placeholders(zhTools[id]?.[key]), `tools.${id}.${key}`).toEqual(placeholders(value))
      }
    }
  })
})
