// The themes Good Dogs Only can wear, in the order the Theme setting lists them.
export const THEMES = [
  { id: 'glass', label: 'Aqua Glass', themeColor: '#e9eef5' },
  { id: 'aqua', label: 'Aqua', themeColor: '#dcdcdc' },
  { id: 'win98', label: 'Windows 98', themeColor: '#008080' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']
export const DEFAULT_THEME: ThemeId = 'glass'
/** localStorage key. The theme is a setting for this phone, so it isn't part of backups. */
export const THEME_KEY = 'good-dogs-only.theme'

export const isThemeId = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v)
/** Aqua and Aqua Glass share their window kit (traffic lights, toolbar, sheets); Windows 98 has its own. */
export const isAquaFamily = (t: ThemeId) => t !== 'win98'
