import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME, THEME_KEY, THEMES } from '../src/theme/themes.ts'

describe('index.html', () => {
  it('knows the same themes and default as the app, so the first paint is right', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)![1]
    for (const t of THEMES) {
      expect(script).toContain(`'${t.id}'`)
      expect(script).toContain(`${t.id}: '${t.themeColor}'`) // the status bar's colour
    }
    expect(script).toContain(`'${THEME_KEY}'`)
    expect(script).toContain(`: '${DEFAULT_THEME}'`)
  })
})
