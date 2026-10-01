// The launch screen: logo and "Tap to launch", then a Windows 98 loading bar or the Mac OS X spinning gear.
import { useEffect, useState } from 'react'
import { useTheme } from '../theme/store.ts'
import { isAquaFamily } from '../theme/themes.ts'
import { Icon } from '../ui/icons.tsx'

export function Launch({ onDone }: { onDone: () => void }) {
  const aqua = isAquaFamily(useTheme())
  const [loading, setLoading] = useState(false)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!loading) return
    const quick = matchMedia('(prefers-reduced-motion: reduce)').matches
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setWidth(100)))
    const timer = setTimeout(onDone, quick ? 150 : aqua ? 2000 : 1700)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [loading, onDone, aqua])
  return (
    <button type="button" className="boot" onClick={() => setLoading(true)} aria-label="Tap to launch Good Dogs Only">
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
          <span className="progress-indicator-bar" style={{ width: `${width}%` }} />
        </span>
      )}
      <span className="sub">{loading ? 'Starting Good Dogs Only...' : 'Tap to launch'}</span>
    </button>
  )
}
