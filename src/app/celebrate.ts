// Any screen can set off the bone confetti (every fifth breed spotted) through this context.
import { createContext, useContext } from 'react'

export const CelebrateContext = createContext<() => void>(() => {})
export const useCelebrate = () => useContext(CelebrateContext)

/** Every fifth breed spotted is worth a celebration. */
export const isMilestone = (count: number) => count > 0 && count % 5 === 0
