// When to show the Add to Home Screen prompt, and Android's own install sheet.
import { currentBrowser, currentPlatform, isPhone, isStandalone, type Browser, type Platform } from './platform.ts'

const DISMISSED_KEY = 'good-dogs-only.home-screen-prompt'

export type Where = { platform: Platform; browser: Browser }

/** ?homescreen=safari, ios-other, in-app or android shows that version of the prompt, anywhere. */
function previewed(search: string): Where | null {
  const v = new URLSearchParams(search).get('homescreen')
  if (v === 'safari' || v === 'ios-other' || v === 'in-app') return { platform: 'ios', browser: v }
  if (v === 'android') return { platform: 'android', browser: 'browser' }
  return null
}

/** Where to show the prompt for: opened in a phone's browser and not turned off. Null leaves it out. */
export function homeScreenPromptFor(): Where | null {
  const preview = previewed(location.search)
  if (preview) return preview
  if (isStandalone() || !isPhone()) return null
  const platform = currentPlatform()
  if (platform === 'other') return null
  try {
    if (localStorage.getItem(DISMISSED_KEY)) return null
  } catch {
    // Storage blocked: show it, and "Don't Show Again" just closes it.
  }
  return { platform, browser: currentBrowser() }
}

export function dontShowAgain() {
  try {
    localStorage.setItem(DISMISSED_KEY, 'dismissed')
  } catch {
    // Storage blocked: it'll ask again next visit.
  }
}

// Chrome on Android offers its own install sheet, but only to a page that caught this event, and it can fire
// before the app has drawn, so it's caught as soon as the app loads.
type InstallEvent = Event & { prompt: () => Promise<unknown> }
let installEvent: InstallEvent | null = null
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  installEvent = e as InstallEvent
})

export const canInstall = () => installEvent !== null

/** Opens Android's install sheet (once: Chrome allows each event to be used one time). */
export async function install() {
  const e = installEvent
  installEvent = null
  await e?.prompt()
}
