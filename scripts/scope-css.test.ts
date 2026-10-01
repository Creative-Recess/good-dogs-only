import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { scopeCss } from './lib/scope-css.ts'

const root = ':root[data-theme="win98"]'

describe('scopeCss', () => {
  it('wraps rules in a layer and a theme scope, keeping the licence comment first', () => {
    const out = scopeCss('/*! 98.css (MIT) */button{color:red}', 'vendor', root)
    expect(out.startsWith('/*! 98.css (MIT) */')).toBe(true)
    expect(out).toContain(`@layer vendor {\n@scope (${root}) {\nbutton{color:red}`)
  })

  it('keeps scrollbar rules out of the scope, prefixed with html and the theme instead', () => {
    const out = scopeCss('::-webkit-scrollbar-button:vertical:start,::-webkit-scrollbar-thumb{display:block}', 'vendor', root)
    const html = 'html[data-theme="win98"]'
    expect(out).toContain(`${html} ::-webkit-scrollbar-button:vertical:start,${html} ::-webkit-scrollbar-thumb{display:block}`)
    expect(out.indexOf('::-webkit-scrollbar')).toBeGreaterThan(out.indexOf('\n}\n'))
  })

  it('handles the real 98.css, which has no at-rules', () => {
    const css = readFileSync(new URL('../src/vendor/98css/98.css', import.meta.url), 'utf8')
    expect(() => scopeCss(css, 'vendor', root)).not.toThrow()
  })
})
