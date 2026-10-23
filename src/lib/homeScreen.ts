// When to show the Add to Home Screen prompt, and Android's own install sheet.
import { currentBrowser, currentPlatform, isPhone, isStandalone, type Browser, type Platform } from './platform.ts'

/** Set to 'off' to leave the prompt out. Only the E2E tests do, so it doesn't cover the app they're testing. */
const OFF_KEY = 'good-dogs-only.home-screen-prompt'

/** `installed`: the app is already on this phone's Home Screen (only Android can tell). */
export type Where = { platform: Platform; browser: Browser; installed?: boolean }

/** ?homescreen=safari, ios-other, in-app, android or android-installed shows that version of the prompt, anywhere. */
function previewed(search: string): Where | null {
  const v = new URLSearchParams(search).get('homescreen')
  if (v === 'safari' || v === 'ios-other' || v === 'in-app') return { platform: 'ios', browser: v }
  if (v === 'android') return { platform: 'android', browser: 'browser' }
  if (v === 'android-installed') return { platform: 'android', browser: 'browser', installed: true }
  return null
}

/** Whether Chrome on Android has this app installed (listed in the manifest's related_applications). An iPhone
 *  never says, so there it's always false. */
export async function isInstalled(): Promise<boolean> {
  const nav = navigator as { getInstalledRelatedApps?: () => Promise<unknown[]> }
  try {
    return ((await nav.getInstalledRelatedApps?.()) ?? []).length > 0
  } catch {
    return false
  }
}

/** Hands this page over to the installed app: Android opens a link within an installed app's scope in that app. */
export function openApp() {
  location.href = `intent://${location.host}${location.pathname}#Intent;scheme=https;end`
}

/** Where to show the prompt for: opened in a phone's browser, every visit. Null leaves it out. */
export function homeScreenPromptFor(): Where | null {
  const preview = previewed(location.search)
  if (preview) return preview
  if (isStandalone() || !isPhone()) return null
  const platform = currentPlatform()
  if (platform === 'other') return null
  try {
    if (localStorage.getItem(OFF_KEY) === 'off') return null
  } catch {
    // Storage blocked: show it.
  }
  return { platform, browser: currentBrowser() }
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
