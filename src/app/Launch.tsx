// The launch screen: logo and "Tap to launch", then a Windows 98 loading bar or the Mac OS X spinning gear, with a
// few dog-themed loading lines, ending on "Releasing the hounds..." as it opens.
import { useEffect, useState } from 'react'
import { useTheme } from '../theme/store.ts'
import { isAquaFamily } from '../theme/themes.ts'
import { Icon } from '../ui/icons.tsx'

const LINES = ['Fetching sticks...', 'Checking every tree...', 'Untangling leads...']
const DONE = 'Releasing the hounds...'
/** How long each line shows; the last ("Releasing the hounds") gets one more step before the app opens. */
const STEP_MS = 550
const TOTAL_MS = STEP_MS * (LINES.length + 1)
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export function Launch({ onDone }: { onDone: () => void }) {
  const aqua = isAquaFamily(useTheme())
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!loading) return
    if (reducedMotion()) {
      const timer = setTimeout(onDone, 150)
      return () => clearTimeout(timer)
    }
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setWidth(100)))
    const ticks = Array.from({ length: LINES.length }, (_, i) => setTimeout(() => setStep(i + 1), STEP_MS * (i + 1)))
    const timer = setTimeout(onDone, TOTAL_MS)
    return () => {
      cancelAnimationFrame(frame)
      ticks.forEach(clearTimeout)
      clearTimeout(timer)
    }
  }, [loading, onDone])
  return (
    <button type="button" className="boot" onClick={() => {
        // With Reduce Motion on, skip straight to the last line.
        if (reducedMotion()) setStep(LINES.length)
        setLoading(true)
      }} aria-label="Tap to launch Good Dogs Only">
      <span className="logo">
        <Icon name="bigPaw" />
        <span className="word">Good Dogs Only</span>
      </span>
      {aqua ? (
        <span className={`gear${loading ? '' : ' waiting'}`} aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} style={{ '--i': i } as React.CSSProperties} />
          ))}
        </span>
      ) : (
        <span className={`progress-indicator segmented${loading ? '' : ' waiting'}`}>
          <span className="progress-indicator-bar" style={{ width: `${width}%`, transitionDuration: `${TOTAL_MS - STEP_MS / 2}ms` }} />
        </span>
      )}
      <span className="sub" aria-live="polite">
        {loading ? (step < LINES.length ? LINES[step] : DONE) : 'Tap to launch'}
      </span>
    </button>
  )
}
