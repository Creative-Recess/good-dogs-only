// The current theme: on <html data-theme>, saved in localStorage.
// index.html sets the attribute before the first paint (so there's no flash of the wrong theme); this module takes it from there.
import { useSyncExternalStore } from 'react'
import { DEFAULT_THEME, isThemeId, THEME_KEY, THEMES, type ThemeId } from './themes.ts'

const listeners = new Set<() => void>()

export function readSavedTheme(storage: Pick<Storage, 'getItem'> | undefined): ThemeId {
  try {
    const saved = storage?.getItem(THEME_KEY)
    return isThemeId(saved) ? saved : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function getTheme(): ThemeId {
  const current = document.documentElement.dataset.theme
  return isThemeId(current) ? current : readSavedTheme(globalThis.localStorage)
}

export function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEMES.find((t) => t.id === theme)!.themeColor)
}

export function setTheme(theme: ThemeId) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Private browsing or storage blocked: the theme still changes for this visit.
  }
  applyTheme(theme)
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useTheme = () => useSyncExternalStore(subscribe, getTheme)
