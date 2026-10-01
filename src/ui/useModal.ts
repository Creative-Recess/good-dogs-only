// Makes a window behave like a modal: Escape closes it, Tab stays inside it, and focus goes back where it was when it closes.
// Windows can stack (a sheet over the breed window), so only the top one reacts to keys.
import { useEffect, useRef, type RefObject } from 'react'

const stack: RefObject<HTMLElement | null>[] = []
const FOCUSABLE = 'button:not([disabled]), [href], input:not([type="hidden"]):not([hidden]), select, textarea, [tabindex]:not([tabindex="-1"]), summary'

export function useModal(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  })

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    stack.push(ref)
    // Focus the window itself unless something inside it (like a dialog's default button) already took focus.
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (stack.at(-1) !== ref || !ref.current) return
      if (e.key === 'Escape') {
        e.preventDefault()
        close.current()
      } else if (e.key === 'Tab') {
        const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
        if (!items.length) return
        const first = items[0]
        const last = items.at(-1)!
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      stack.splice(stack.indexOf(ref), 1)
      if (before?.isConnected) before.focus({ preventScroll: true })
    }
  }, [ref])
}
