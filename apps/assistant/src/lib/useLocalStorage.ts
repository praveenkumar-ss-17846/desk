import { useEffect, useState } from 'react'

// A useState that automatically persists to localStorage, so every
// feature in the app works offline and survives reloads / app restarts.
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore write errors (e.g. private mode quota limits).
    }
  }, [key, value])

  return [value, setValue] as const
}
