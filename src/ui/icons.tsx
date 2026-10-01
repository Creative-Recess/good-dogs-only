// <Icon>: draws a named icon in the current theme's style (pixel art for Windows 98, glossy gel for Aqua).
import { useTheme } from '../theme/store.ts'
import { isAquaFamily } from '../theme/themes.ts'
import { AQUA_ICONS } from './icons/aqua.ts'
import type { IconName } from './icons/types.ts'
import { WIN98_ICONS } from './icons/win98.ts'

export function Icon({ name }: { name: IconName }) {
  const aqua = isAquaFamily(useTheme())
  const { size, d } = (aqua ? AQUA_ICONS : WIN98_ICONS)[name]
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering={aqua ? undefined : 'crispEdges'}
      aria-hidden="true"
      // Static, hand-written SVG shapes from icons/ only.
      dangerouslySetInnerHTML={{ __html: d }}
    />
  )
}
