// The Help window, opened from the ? in the main title bar.
import { useRef } from 'react'
import type { Sighting } from '../lib/sightings.ts'
import { useTheme } from '../theme/store.ts'
import { isAquaFamily } from '../theme/themes.ts'
import { Icon } from '../ui/icons.tsx'
import { useModal } from '../ui/useModal.ts'
import { HelpWindowBody } from './HelpWindowBody.tsx'

type Props = { lastBackup: string | null; sightings: Sighting[] | undefined; onClose: () => void }

export function HelpWindow({ lastBackup, sightings, onClose }: Props) {
  const aqua = isAquaFamily(useTheme())
  const ref = useRef<HTMLDivElement>(null)
  useModal(ref, onClose)
  return (
    <div className="window props helpwin" role="dialog" aria-modal="true" aria-label="Help" ref={ref} tabIndex={-1}>
      <div className="title-bar">
        <div className="title-bar-text">
          {!aqua && <Icon name="bigPaw" />}
          Good Dogs Only Help
        </div>
        <div className="title-bar-controls">
          <button className="close" aria-label="Close" onClick={onClose} />
        </div>
      </div>
      <div className="window-body">
        <HelpWindowBody lastBackup={lastBackup} sightings={sightings} />
      </div>
    </div>
  )
}
