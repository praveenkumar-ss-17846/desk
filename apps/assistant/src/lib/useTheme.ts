import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export type Theme = 'light' | 'dark'

// Persisted light/dark theme. Applies a data-theme attribute on <html>
// which the CSS variables in index.css key off of.
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('desk.assistant.theme', 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0f1021' : '#f4f4fb')
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return { theme, toggle }
}
