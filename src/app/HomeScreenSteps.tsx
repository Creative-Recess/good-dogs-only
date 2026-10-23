// How to add the app to the Home Screen from wherever it's open: shared by Help and the first-visit prompt.
import type { Browser, Platform } from '../lib/platform.ts'

export function HomeScreenSteps({ platform, browser }: { platform: Platform; browser: Browser }) {
  if (browser === 'in-app') {
    return (
      <ol>
        <li>
          Tap this app's menu (<b>•••</b> or <b>⋮</b>) and choose <b>Open in {platform === 'android' ? 'Chrome' : 'Safari'}</b>. An app's own browser can't add
          to the Home Screen.
        </li>
        <li>Then add it to your Home Screen from there.</li>
      </ol>
    )
  }
  return (
    <ol>
      {platform === 'ios' && browser === 'safari' && (
        <>
          <li>
            Tap <b>•••</b> next to the address bar, then <b>Share</b>. (If you see the <b>Share</b> button itself, tap that.)
          </li>
          <li>
            Tap <b>Add to Home Screen</b>. If it isn't there, tap <b>View More</b> first.
          </li>
        </>
      )}
      {platform === 'ios' && browser === 'ios-other' && (
        <li>
          Tap <b>Share</b> at the top right, then <b>Add to Home Screen</b>.
        </li>
      )}
      {platform === 'android' && (
        <li>
          Open the browser menu <b>⋮</b>, then <b>Install app</b> or <b>Add to Home screen</b>.
        </li>
      )}
      {platform === 'other' && (
        <li>
          On a phone, use the browser's <b>Add to Home Screen</b>. On a computer, look for <b>Install</b> in the address bar or browser menu.
        </li>
      )}
      <li>Open it from the new icon. It runs full screen, like an app.</li>
    </ol>
  )
}
