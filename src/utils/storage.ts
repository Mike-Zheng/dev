/** Namespace for every localStorage key this app owns. */
export const STORAGE_PREFIX = 'dev.'

const LEGACY_PREFIX = 'devtoys.'

/** Move settings saved under the legacy prefix to the current one (runs once, on first import). */
function migrateLegacyKeys() {
  try {
    const legacy: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(LEGACY_PREFIX)) legacy.push(key)
    }
    for (const key of legacy) {
      const next = STORAGE_PREFIX + key.slice(LEGACY_PREFIX.length)
      const value = localStorage.getItem(key)
      if (localStorage.getItem(next) === null && value !== null) localStorage.setItem(next, value)
      localStorage.removeItem(key)
    }
  } catch {
    /* ignore */
  }
}

migrateLegacyKeys()

export function storageKey(name: string): string {
  return STORAGE_PREFIX + name
}
