// Message boxes: a Windows 98 dialog, or an Aqua sheet that drops from the title bar with the app icon (or the dog)
// and a bold title. The last button is the default (the safe choice) and gets focus.
import { useEffect, useRef } from 'react'
import { useTheme } from '../theme/store.ts'
import { isAquaFamily } from '../theme/themes.ts'
import type { DialogSpec } from './dialogs.ts'
import { Icon } from '../ui/icons.tsx'
import { useModal } from '../ui/useModal.ts'

export function Dialog({ spec, onClose }: { spec: DialogSpec; onClose: () => void }) {
  const aqua = isAquaFamily(useTheme())
  const buttons = spec.buttons ?? [{ label: 'OK' }]
  const boxRef = useRef<HTMLDivElement>(null)
  // First, so it remembers what had focus before the dialog (to give it back on close), not the dialog's own button.
  useModal(boxRef, onClose)
  const defaultRef = useRef<HTMLButtonElement>(null)
  useEffect(() => defaultRef.current?.focus(), [spec])
  return (
    <div className="modal">
      <div className="window dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-text" ref={boxRef} tabIndex={-1}>
        <div className="title-bar">
          <div className="title-bar-text" id="dialog-title">{spec.title}</div>
          <div className="title-bar-controls">
            <button className="close" aria-label="Close" onClick={onClose} />
          </div>
        </div>
        <div className="window-body">
          {aqua ? (
            <div className="msg">
              {spec.photo ? <img className="sheet-photo" src={spec.photo} alt="" /> : <Icon name={spec.icon === 'warn' ? 'warn' : 'bigPaw'} />}
              <span>
                <b>{spec.title}</b>
                <span id="dialog-text">{spec.text}</span>
              </span>
            </div>
          ) : (
            <div className="msg">
              {spec.icon === 'warn' && <Icon name="warn" />}
              {spec.icon === 'info' && <Icon name="infoBig" />}
              <span id="dialog-text">{spec.text}</span>
            </div>
          )}
          <div className="btns">
            {buttons.map((b, i) => {
              const isDefault = i === buttons.length - 1
              return (
                <button
                  key={b.label}
                  type="button"
                  ref={isDefault ? defaultRef : undefined}
                  className={isDefault ? 'default' : undefined}
                  onClick={() => {
                    onClose()
                    b.onClick?.()
                  }}
                >
                  {b.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
