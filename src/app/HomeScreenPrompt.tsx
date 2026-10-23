// First-visit prompt: opened in a phone's browser rather than from the Home Screen, the app explains how to add it
// (an Aqua sheet or a Windows 98 dialog, like the other message boxes). Shown after the launch screen until
// "Don't Show Again". On an iPhone, the Home Screen app keeps its own storage, apart from the browser's, so it also
// warns that spots made in the browser stay there.
// Preview any version with ?homescreen=safari, ios-other, in-app or android.
import { useEffect, useRef } from 'react'
import { canInstall, dontShowAgain, install, type Where } from '../lib/homeScreen.ts'
import { useTheme } from '../theme/store.ts'
import { isAquaFamily } from '../theme/themes.ts'
import { Icon } from '../ui/icons.tsx'
import { useModal } from '../ui/useModal.ts'
import { HomeScreenSteps } from './HomeScreenSteps.tsx'

export function HomeScreenPrompt({ where, spotted, onClose }: { where: Where; spotted: number; onClose: () => void }) {
  const aqua = isAquaFamily(useTheme())
  const boxRef = useRef<HTMLDivElement>(null)
  useModal(boxRef, onClose)
  const okRef = useRef<HTMLButtonElement>(null)
  useEffect(() => okRef.current?.focus(), [])
  // Android's own install sheet when Chrome offers one; written steps otherwise.
  const installable = where.platform === 'android' && canInstall()

  const text = "Good Dogs Only works best from your Home Screen. Here's how to add it."
  // Only an iPhone keeps the Home Screen app's storage apart from the browser's.
  const note =
    where.platform !== 'ios'
      ? null
      : spotted > 0
        ? `Your ${spotted} ${spotted === 1 ? 'spot stays' : 'spots stay'} in this browser. To bring them along, save a backup in Help first, then restore it in the app.`
        : "Add it before you start spotting: spots made in the browser don't move across to the app."

  return (
    <div className="modal">
      <div className="window dialog homescreen" role="alertdialog" aria-modal="true" aria-labelledby="homescreen-title" ref={boxRef} tabIndex={-1}>
        <div className="title-bar">
          <div className="title-bar-text" id="homescreen-title">Add to Home Screen</div>
          <div className="title-bar-controls">
            <button className="close" aria-label="Close" onClick={onClose} />
          </div>
        </div>
        <div className="window-body">
          <div className="msg">
            <Icon name={aqua ? 'bigPaw' : 'infoBig'} />
            <span>
              {aqua && <b>Add to Home Screen</b>}
              <span>{text}</span>
            </span>
          </div>
          {!installable && <HomeScreenSteps platform={where.platform} browser={where.browser} />}
          {note && (
            <div className="warn">
              <Icon name="warn" />
              <span>{note}</span>
            </div>
          )}
          <div className="btns">
            <button
              type="button"
              onClick={() => {
                dontShowAgain()
                onClose()
              }}
            >
              Don't Show Again
            </button>
            {installable ? (
              <button
                type="button"
                className="default"
                ref={okRef}
                onClick={() => {
                  onClose()
                  void install()
                }}
              >
                Install
              </button>
            ) : (
              <button type="button" className="default" ref={okRef} onClick={onClose}>
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
