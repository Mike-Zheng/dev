import { ref, watch, watchEffect } from 'vue'

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
    const raw = localStorage.getItem('devtoys.theme')
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    /* ignore */
  }
  return 'dark'
}

const theme = ref<ThemeMode>(readTheme())
const wordWrap = ref<boolean>(read('devtoys.wordWrap', true))
const editorFontSize = ref<number>(read('devtoys.editorFontSize', 13))
const sidebarCollapsed = ref<boolean>(read('devtoys.sidebarCollapsed', false))
const favorites = ref<string[]>(read('devtoys.favorites', []))
const recents = ref<string[]>(read('devtoys.recents', []))

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
    localStorage.setItem('devtoys.theme', theme.value)
  } catch {
    /* ignore */
  }
  applyTheme()
})
watch(wordWrap, (v) => persist('devtoys.wordWrap', v))
watch(editorFontSize, (v) => persist('devtoys.editorFontSize', v))
watch(sidebarCollapsed, (v) => persist('devtoys.sidebarCollapsed', v))
watch(favorites, (v) => persist('devtoys.favorites', v), { deep: true })
watch(recents, (v) => persist('devtoys.recents', v), { deep: true })

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
