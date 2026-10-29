import { ref, watch, watchEffect } from 'vue'
import { storageKey } from '@/utils/storage'

export type ThemeMode = 'system' | 'light' | 'dark'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

function readTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(storageKey('theme'))
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    /* ignore */
  }
  return 'system'
}

const theme = ref<ThemeMode>(readTheme())
const wordWrap = ref<boolean>(read(storageKey('wordWrap'), true))
const editorFontSize = ref<number>(read(storageKey('editorFontSize'), 13))
const sidebarCollapsed = ref<boolean>(read(storageKey('sidebarCollapsed'), false))
const favorites = ref<string[]>(read(storageKey('favorites'), []))
const recents = ref<string[]>(read(storageKey('recents'), []))

const media = window.matchMedia('(prefers-color-scheme: dark)')
const isDark = ref(false)

function applyTheme() {
  const dark = theme.value === 'dark' || (theme.value === 'system' && media.matches)
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
}
media.addEventListener('change', applyTheme)

watchEffect(() => {
  try {
    localStorage.setItem(storageKey('theme'), theme.value)
  } catch {
    /* ignore */
  }
  applyTheme()
})
watch(wordWrap, (v) => persist(storageKey('wordWrap'), v))
watch(editorFontSize, (v) => persist(storageKey('editorFontSize'), v))
watch(sidebarCollapsed, (v) => persist(storageKey('sidebarCollapsed'), v))
watch(favorites, (v) => persist(storageKey('favorites'), v), { deep: true })
watch(recents, (v) => persist(storageKey('recents'), v), { deep: true })

export function useSettings() {
  function toggleFavorite(id: string) {
    const i = favorites.value.indexOf(id)
    if (i >= 0) favorites.value.splice(i, 1)
    else favorites.value.push(id)
  }
  function isFavorite(id: string) {
    return favorites.value.includes(id)
  }
  function pushRecent(id: string) {
    recents.value = [id, ...recents.value.filter((x) => x !== id)].slice(0, 6)
  }
  function toggleTheme() {
    theme.value = isDark.value ? 'light' : 'dark'
  }
  return {
    theme,
    isDark,
    wordWrap,
    editorFontSize,
    sidebarCollapsed,
    favorites,
    recents,
    toggleFavorite,
    isFavorite,
    pushRecent,
    toggleTheme,
  }
}
