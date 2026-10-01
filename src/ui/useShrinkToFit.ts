import { useLayoutEffect, type RefObject } from 'react'

/**
 * Shrinks an element's font size in half-pixel steps until its text fits (no overflow either way), down to a
 * minimum; past that, CSS clamping or an ellipsis takes over. For the odd long word wider than its tile.
 */
export function useShrinkToFit(ref: RefObject<HTMLElement | null>, max: number, min: number, key: unknown) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let size = max
    el.style.fontSize = `${size}px`
    while (size > min && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) {
      size -= 0.5
      el.style.fontSize = `${size}px`
    }
  }, [ref, max, min, key])
}
