export const THEME_STORAGE_KEY = 'gym-community-theme'

export function normalizeThemeMode(value) {
  return value === 'light' ? 'light' : 'dark'
}

export function getNextThemeMode(value) {
  return normalizeThemeMode(value) === 'dark' ? 'light' : 'dark'
}

export function resolveThemeMode(storedValue) {
  return normalizeThemeMode(storedValue)
}
