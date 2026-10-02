// A country's flag in the current theme's style: a gel orb for Aqua, a small pixel flag for Windows 98.
import { COUNTRIES } from '../data/countries.ts'
import { useTheme } from '../theme/store.ts'
import { isAquaFamily } from '../theme/themes.ts'

export function Flag({ code }: { code: string }) {
  const aqua = isAquaFamily(useTheme())
  const c = COUNTRIES[code]
  if (!c) return null
  // Static, hand-written SVG from data/countries.ts only.
  const art = { __html: c.art }
  if (aqua)
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <g clipPath="url(#aq-clip)">
          <svg x={-16 * (c.fx ?? 0.5)} width="48" height="32" viewBox="0 0 30 20" preserveAspectRatio="none" dangerouslySetInnerHTML={art} />
        </g>
        <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
        <ellipse cx="16" cy="9.5" rx="10.5" ry="6.5" fill="url(#aq-shine)" opacity="0.8" />
      </svg>
    )
  return (
    <svg viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <svg x="1" y="3" width="14" height="10" viewBox="0 0 30 20" preserveAspectRatio="none" dangerouslySetInnerHTML={art} />
      <rect x="1" y="3" width="14" height="10" fill="none" stroke="#000" />
    </svg>
  )
}
