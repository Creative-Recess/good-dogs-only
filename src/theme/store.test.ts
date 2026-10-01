import { describe, expect, it } from 'vitest'
import { readSavedTheme } from './store.ts'
import { DEFAULT_THEME, THEME_KEY } from './themes.ts'

const storage = (value: string | null) => ({ getItem: (k: string) => (k === THEME_KEY ? value : null) })

describe('readSavedTheme', () => {
  it('uses the saved theme', () => {
    expect(readSavedTheme(storage('win98'))).toBe('win98')
  })
  it('falls back to Aqua when nothing valid is saved', () => {
    expect(DEFAULT_THEME).toBe('aqua')
    expect(readSavedTheme(storage(null))).toBe('aqua')
    expect(readSavedTheme(storage('beos'))).toBe('aqua')
    expect(readSavedTheme({ getItem: () => { throw new Error('blocked') } })).toBe('aqua')
  })
})
