import { useEffect, useState } from 'react'

const pct = (fraction: number) => `${Math.round(fraction * 100)}%`

/** A segmented Windows 98 progress bar that fills up when it first appears, with its percentage on top. */
export function ProgressBar({ fraction, label }: { fraction: number; label: string }) {
  // Always show a sliver once anything is spotted.
  const target = fraction > 0 ? Math.max(fraction * 100, 3) : 0
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(target))
    return () => cancelAnimationFrame(id)
  }, [target])
  return (
    <div className="progress-indicator segmented" role="progressbar" aria-label={label} aria-valuenow={Math.round(fraction * 100)} aria-valuemin={0} aria-valuemax={100}>
      <span className="progress-indicator-bar" style={{ width: `${width}%` }} />
      {/* The label in black, and again in white clipped to the filled part, so it reads over both. */}
      <span className="pct-in" aria-hidden="true">{pct(fraction)}</span>
      <span className="pct-in on" aria-hidden="true" style={{ clipPath: `inset(0 ${100 - width}% 0 0)` }}>{pct(fraction)}</span>
    </div>
  )
}
