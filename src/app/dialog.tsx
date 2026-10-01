// Windows 98 message boxes. The last button is the default (the safe choice) and gets focus.
import { useEffect, useRef } from 'react'
import type { DialogSpec } from './dialogs.ts'
import { Icon } from '../ui/icons.tsx'


export function Dialog({ spec, onClose }: { spec: DialogSpec; onClose: () => void }) {
  const buttons = spec.buttons ?? [{ label: 'OK' }]
  const defaultRef = useRef<HTMLButtonElement>(null)
  useEffect(() => defaultRef.current?.focus(), [spec])
  return (
    <div className="modal">
      <div className="window dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-text">
        <div className="title-bar">
          <div className="title-bar-text" id="dialog-title">{spec.title}</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose} />
          </div>
        </div>
        <div className="window-body">
          <div className="msg">
            {spec.icon === 'warn' && <Icon name="warn" />}
            {spec.icon === 'info' && <Icon name="infoBig" />}
            <span id="dialog-text">{spec.text}</span>
          </div>
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
