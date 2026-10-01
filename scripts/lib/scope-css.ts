// Fences a vendored stylesheet in to one theme: inside a cascade layer (so our theme CSS always wins over it)
// and an @scope on <html data-theme> (so its element rules, like `button {}`, never reach other themes).
// @scope adds no specificity, so the stylesheet behaves as it did unscoped.
//
// WebKit ignores scrollbar-button styles under @scope or a :root selector (the track and thumb work, the arrows
// don't), so ::-webkit-scrollbar rules stay out of the scope, prefixed with `html` plus the root's attribute instead.
// Expects flat CSS (no nested at-rules), which is what 98.css is.
export function scopeCss(css: string, layer: string, rootSelector: string): string {
  // Keep a leading licence comment (/*! ... */) at the top, outside the wrapper.
  const licence = /^\s*\/\*![\s\S]*?\*\//.exec(css)?.[0] ?? ''
  const body = css.slice(licence.length)
  if (/@[a-z]/i.test(body.replace(/\/\*[\s\S]*?\*\//g, ''))) throw new Error('scopeCss expects CSS without at-rules')
  const htmlPrefix = rootSelector.replace(/^:root/, 'html')
  const scoped: string[] = []
  const prefixed: string[] = []
  for (const [, selectors, declarations] of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const list = selectors.trim().split(',').map((s) => s.trim())
    if (list.every((s) => s.startsWith('::-webkit-scrollbar'))) prefixed.push(`${list.map((s) => `${htmlPrefix} ${s}`).join(',')}{${declarations}}`)
    else scoped.push(`${selectors.trim()}{${declarations}}`)
  }
  return `${licence.trim()}\n@layer ${layer} {\n@scope (${rootSelector}) {\n${scoped.join('\n')}\n}\n${prefixed.join('\n')}\n}\n`
}
