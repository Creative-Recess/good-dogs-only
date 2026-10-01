// A titled section of the breed window: a group box in Windows 98, a fold-away Get Info section in Aqua.
import type { ReactNode } from 'react'
import { useTheme } from '../theme/store.ts'
import { isAquaFamily } from '../theme/themes.ts'

type Props = {
  title: string
  /** Shown on the header while folded (Aqua), e.g. "Spotted". */
  hint?: string
  open: boolean
  onToggle: (open: boolean) => void
  className?: string
  children: ReactNode
}

export function Section({ title, hint, open, onToggle, className, children }: Props) {
  const aqua = isAquaFamily(useTheme())
  if (!aqua)
    return (
      <fieldset className={className}>
        <legend>{title}</legend>
        {children}
      </fieldset>
    )
  return (
    <details className="fold" open={open} onToggle={(e) => onToggle(e.currentTarget.open)}>
      <summary>
        {title}
        {hint && <span className="fold-hint">{hint}</span>}
      </summary>
      <div className="fold-body">{children}</div>
    </details>
  )
}
