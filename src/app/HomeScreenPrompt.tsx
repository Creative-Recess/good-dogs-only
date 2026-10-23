// Opened in a phone's browser rather than from the Home Screen, the app explains how to add it, every time, over the
// launch screen: a message box (Aqua or Windows 98, like the others) in the middle of the screen, over a
// shade that blocks the app until it's closed. When an Android phone already has the app, it offers to open it there
// instead.
// Preview any version with ?homescreen=safari, ios-other, in-app, android or android-installed.
import { useEffect, useRef, useState } from 'react'
import { canInstall, install, openApp, type Where } from '../lib/homeScreen.ts'
import { useTheme } from '../theme/store.ts'
import { isAquaFamily } from '../theme/themes.ts'
import { Icon } from '../ui/icons.tsx'
import { useModal } from '../ui/useModal.ts'
import { HomeScreenSteps } from './HomeScreenSteps.tsx'

export function HomeScreenPrompt({ where, onClose }: { where: Where; onClose: () => void }) {
  const aqua = isAquaFamily(useTheme())
  const boxRef = useRef<HTMLDivElement>(null)
  useModal(boxRef, onClose)
  const defaultRef = useRef<HTMLButtonElement>(null)
  useEffect(() => defaultRef.current?.focus(), [where.installed])
  // Android: open the installed app; or Chrome's own install sheet when it offers one; or written steps.
  const installable = !where.installed && where.platform === 'android' && canInstall()
  // iPhone: Safari is the one browser we give steps for (Brave and apps' own browsers can't add it at all), so any
  // other browser is sent to Safari first.
  // A page can't open Safari itself, so it copies the link to paste there.
  const needsSafari = where.platform === 'ios' && where.browser !== 'safari'
  const [copied, setCopied] = useState(false)
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/`)
      setCopied(true)
    } catch {
      // Clipboard refused: the button stays as it was, and the address bar still has the link to copy by hand.
    }
  }
  const title = where.installed ? 'Open the App' : needsSafari ? 'Open in Safari' : 'Add to Home Screen'

  return (
    <div className="modal homescreen-modal">
      <div className="window dialog homescreen" role="alertdialog" aria-modal="true" aria-labelledby="homescreen-title" ref={boxRef} tabIndex={-1}>
        <div className="title-bar">
          <div className="title-bar-text" id="homescreen-title">{title}</div>
          <div className="title-bar-controls">
            <button className="close" aria-label="Close" onClick={onClose} />
          </div>
        </div>
        <div className="window-body">
          {aqua && (
            <div className="msg head">
              <Icon name="bigPaw" />
              <b>{title}</b>
            </div>
          )}
          {where.installed ? (
            <p className="why">Good Dogs Only is on your Home Screen. Open it there to use it full screen.</p>
          ) : (
            <>
              {needsSafari ? (
                <>
                  <p className="why">To add Good Dogs Only to your Home Screen, open it in Safari.</p>
                  <ol>
                    <li>
                      Tap <b>Copy Link</b>.
                    </li>
                    <li>
                      Open <b>Safari</b> and paste it into the address bar.
                    </li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="why">This will allow Good Dogs Only to save data and work like a normal app store app.</p>
                  {!installable && <HomeScreenSteps platform={where.platform} browser={where.browser} />}
                </>
              )}
            </>
          )}
          <div className="btns">
            {where.installed ? (
              <>
                <button type="button" onClick={onClose}>
                  Close
                </button>
                <button type="button" className="default" ref={defaultRef} onClick={openApp}>
                  Open App
                </button>
              </>
            ) : needsSafari ? (
              <>
                <button type="button" onClick={onClose}>
                  Close
                </button>
                <button type="button" className="default" ref={defaultRef} onClick={() => void copyLink()}>
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
              </>
            ) : installable ? (
              <button
                type="button"
                className="default"
                ref={defaultRef}
                onClick={() => {
                  onClose()
                  void install()
                }}
              >
                Install
              </button>
            ) : (
              <button type="button" className="default" ref={defaultRef} onClick={onClose}>
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
