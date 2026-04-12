import { useCallback, useEffect, useState } from 'react'
import { getNextThemeMode, resolveThemeMode, THEME_STORAGE_KEY } from '../utils/theme'

export function useTheme() {
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return resolveThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY))
  })

  useEffect(() => {
    if (typeof document === 'undefined') return

    document.documentElement.dataset.theme = themeMode
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  const handleToggleTheme = useCallback(() => {
    setThemeMode((current) => getNextThemeMode(current))
  }, [])

  return {
    themeMode,
    handleToggleTheme,
  }
}
