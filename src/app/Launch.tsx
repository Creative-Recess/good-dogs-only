// The launch screen: logo and "Tap to launch", then a Windows 98 loading bar.
import { useEffect, useState } from 'react'
import { Icon } from '../ui/icons.tsx'

export function Launch({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!loading) return
    const quick = matchMedia('(prefers-reduced-motion: reduce)').matches
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setWidth(100)))
    const timer = setTimeout(onDone, quick ? 150 : 1700)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [loading, onDone])
  return (
    <button type="button" className="boot" onClick={() => setLoading(true)} aria-label="Tap to launch Good Dogs Only">
      <span className="logo">
        <Icon name="bigPaw" />
        <span className="word">Good Dogs Only</span>
      </span>
      <span className={`progress-indicator segmented${loading ? '' : ' waiting'}`}>
        <span className="progress-indicator-bar" style={{ width: `${width}%` }} />
      </span>
      <span className="sub">{loading ? 'Starting Good Dogs Only...' : 'Tap to launch'}</span>
    </button>
  )
}
