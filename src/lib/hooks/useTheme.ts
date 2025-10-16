import { useEffect, useState } from 'react'

type ThemeMode = 'auto' | 'light' | 'dark'
type ResolvedTheme = 'light' | 'dark'

/**
 * Get the system's preferred color scheme
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Theme management hook
 * Manages light/dark theme switching for the application
 * Supports 'auto' mode that follows system preference
 */
export function useTheme() {
  // Read saved theme mode from localStorage, default to 'auto'
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'auto'

    const savedMode = localStorage.getItem('themeMode') as ThemeMode | null
    return savedMode || 'auto'
  })

  // Track the resolved theme (what's actually applied)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return 'light'

    const savedMode = localStorage.getItem('themeMode') as ThemeMode | null
    if (savedMode === 'light' || savedMode === 'dark') return savedMode
    return getSystemTheme()
  })

  // Listen to system theme changes when in auto mode
  useEffect(() => {
    if (themeMode !== 'auto') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light')
    }

    // Set initial value
    setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [themeMode])

  // Apply the resolved theme to the DOM
  useEffect(() => {
    const root = document.documentElement

    // Remove old theme class
    root.classList.remove('light', 'dark')
    // Add new theme class
    root.classList.add(resolvedTheme)

    // Save theme mode to localStorage
    localStorage.setItem('themeMode', themeMode)
  }, [resolvedTheme, themeMode])

  // Update resolved theme when mode changes
  useEffect(() => {
    if (themeMode === 'auto') {
      setResolvedTheme(getSystemTheme())
    } else {
      setResolvedTheme(themeMode)
    }
  }, [themeMode])

  /**
   * Cycle through theme modes: auto -> light -> dark -> auto
   */
  const toggleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'auto') return 'light'
      if (prev === 'light') return 'dark'
      return 'auto'
    })
  }

  return {
    themeMode,
    resolvedTheme,
    setThemeMode,
    toggleTheme,
    isAuto: themeMode === 'auto',
  }
}
