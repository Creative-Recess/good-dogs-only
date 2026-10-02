// Which kind of device the app is on, for the Add to Home Screen steps in Help.
export type Platform = 'ios' | 'android' | 'other'

export function platformOf(userAgent: string, maxTouchPoints: number): Platform {
  // iPads ask for the desktop site, so they look like a Mac with a touch screen.
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(userAgent)) return 'android'
  return 'other'
}

export const currentPlatform = (): Platform => platformOf(navigator.userAgent, navigator.maxTouchPoints ?? 0)
