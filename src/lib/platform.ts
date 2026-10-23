// Which kind of device and browser the app is in, for the Add to Home Screen steps (Help and the first-visit prompt).
export type Platform = 'ios' | 'android' | 'other'

export function platformOf(userAgent: string, maxTouchPoints: number): Platform {
  // iPads ask for the desktop site, so they look like a Mac with a touch screen.
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(userAgent)) return 'android'
  return 'other'
}

/** Where the page is open: the phone's own browser, another browser on an iPhone, or an app's built-in browser
 *  (Instagram, Facebook, Gmail...), which can't add anything to the Home Screen. */
export type Browser = 'safari' | 'ios-other' | 'in-app' | 'browser'

/** `brave`: the page can see Brave's own `navigator.brave`, for when Brave leaves its name out of the user agent. */
export function browserOf(userAgent: string, platform: Platform, brave = false): Browser {
  if (/FBAN|FBAV|Instagram|GSA\/|Line\/|Snapchat|TikTok|LinkedInApp|Twitter|Pinterest|; wv\)/.test(userAgent)) return 'in-app'
  if (platform !== 'ios') return 'browser'
  // Every iPhone browser is Safari's engine, and some (Brave, DuckDuckGo, Opera) copy Safari's user agent and only
  // add their name at the end.
  if (brave || /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|YaBrowser|DuckDuckGo|Ddg\/|Brave/.test(userAgent)) return 'ios-other'
  // Safari says "Safari/"; an app's built-in iOS browser that doesn't name itself leaves it out.
  return /Safari\//.test(userAgent) ? 'safari' : 'in-app'
}

export const currentPlatform = (): Platform => platformOf(navigator.userAgent, navigator.maxTouchPoints ?? 0)
export const currentBrowser = (): Browser => browserOf(navigator.userAgent, currentPlatform(), 'brave' in navigator)

/** Running from the Home Screen icon rather than a browser tab. */
export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

/** A phone: a touch screen whose short side is phone-sized (so not a tablet or a computer). */
export const isPhone = () => matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600
