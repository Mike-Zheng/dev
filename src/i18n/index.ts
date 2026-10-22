import { computed, ref, watchEffect } from 'vue'
import { en } from './locales/en'
import { zhTW } from './locales/zh-TW'

export type Locale = 'en' | 'zh-TW'

export const locales: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'zh-TW', label: '繁體中文' },
]

const STORAGE_KEY = 'devtoys.locale'

function detect(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'zh-TW') return saved
  } catch {
    /* ignore */
  }
  const nav = (navigator.language || '').toLowerCase()
  return nav.startsWith('zh') ? 'zh-TW' : 'en'
}

const locale = ref<Locale>(detect())

watchEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, locale.value)
  } catch {
    /* ignore */
  }
  document.documentElement.lang = locale.value === 'zh-TW' ? 'zh-Hant' : 'en'
})

type Dict = Record<string, unknown>

function lookup(dict: Dict, path: string): string | undefined {
  let cur: unknown = dict
  for (const part of path.split('.')) {
    if (cur && typeof cur === 'object' && part in (cur as Dict)) {
      cur = (cur as Dict)[part]
    } else {
      return undefined
    }
  }
  return typeof cur === 'string' ? cur : undefined
}

function interpolate(s: string, params?: Record<string, string | number>): string {
  if (!params) return s
  return s.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? String(params[k]) : '{' + k + '}'))
}

export function translate(key: string, params?: Record<string, string | number>): string {
  const primary = locale.value === 'en' ? (en as Dict) : (zhTW as Dict)
  const text = lookup(primary, key) ?? lookup(en as Dict, key) ?? key
  return interpolate(text, params)
}

export interface ToolMessages {
  en: Record<string, string>
  'zh-TW': Record<string, string>
}

/** Register tool-scoped strings under `tools.<id>.*`. */
export function registerToolMessages(id: string, messages: ToolMessages) {
  en.tools[id] = messages.en
  const zhTools = (zhTW.tools ?? (zhTW.tools = {})) as Record<string, Record<string, string>>
  zhTools[id] = messages['zh-TW']
}

export function useI18n() {
  const t = (key: string, params?: Record<string, string | number>) => translate(key, params)
  const isZh = computed(() => locale.value === 'zh-TW')
  return { t, locale, isZh, locales }
}
