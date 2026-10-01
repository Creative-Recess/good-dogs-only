// Any screen can show a Windows 98 message box through this context.
import { createContext, useContext } from 'react'

export type DialogSpec = {
  title: string
  text: string
  icon?: 'warn' | 'info'
  buttons?: { label: string; onClick?: () => void }[]
}

export const DialogContext = createContext<(d: DialogSpec) => void>(() => {})
export const useDialog = () => useContext(DialogContext)
