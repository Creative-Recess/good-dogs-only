import { useLayoutEffect, type RefObject } from 'react'
import { useTheme } from '../theme/store.ts'

/**
 * Shrinks an element's font size in half-pixel steps until its text fits (no overflow either way), down to a
 * minimum; past that, CSS clamping or an ellipsis takes over. For the odd long word wider than its tile.
 * Runs again when the theme changes, since each theme has its own fonts and sizes.
 */
export function useShrinkToFit(ref: RefObject<HTMLElement | null>, max: number, min: number, key: unknown) {
  const theme = useTheme()
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Measure the text itself, with any ellipsis switched off: scrollWidth rounds to whole pixels, which can hide a
    // sliver of overflow that still shows as "...".
    el.style.textOverflow = 'clip'
    const range = document.createRange()
    range.selectNodeContents(el)
    const css = getComputedStyle(el)
    const padding = parseFloat(css.paddingLeft) + parseFloat(css.paddingRight)
    const overflows = () => {
      // The room inside the padding, in on-screen pixels (the app is scaled, so convert with the element's own scale).
      const scale = el.getBoundingClientRect().width / (el.offsetWidth || 1)
      const room = (el.clientWidth - padding) * scale
      return range.getBoundingClientRect().width > room + 0.25 || el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
    }
    let size = max
    el.style.fontSize = `${size}px`
    while (size > min && overflows()) {
      size -= 0.5
      el.style.fontSize = `${size}px`
    }
    el.style.textOverflow = ''
  }, [ref, max, min, key, theme])
}
