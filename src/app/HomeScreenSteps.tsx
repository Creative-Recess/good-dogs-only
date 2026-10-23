// How to add the app to the Home Screen from wherever it's open: shared by Help and the Add to Home Screen prompt.
// On an iPhone the steps are Safari's, the browser nearly everyone uses there.
import type { Browser, Platform } from '../lib/platform.ts'

export function HomeScreenSteps({ platform, browser }: { platform: Platform; browser: Browser }) {
  if (browser === 'in-app') {
    // An app's own browser (Instagram, Facebook...) can't add to the Home Screen.
    return (
      <ol>
        <li>
          Tap <b>•••</b> or <b>⋮</b> and choose <b>Open in {platform === 'android' ? 'Chrome' : 'Safari'}</b>.
        </li>
        <li>Add it to your Home Screen from there.</li>
      </ol>
    )
  }
  if (platform === 'ios') {
    return (
      <ol>
        <li>
          Tap <b>•••</b> next to the address bar.
        </li>
        <li>
          Tap <b>Share</b>.
        </li>
        <li>
          Tap <b>View More</b>.
        </li>
        <li>
          Tap <b>Add to Home Screen</b>.
        </li>
      </ol>
    )
  }
  if (platform === 'android') {
    return (
      <ol>
        <li>
          Tap <b>⋮</b> at the top right.
        </li>
        <li>
          Tap <b>Install app</b> (or <b>Add to Home screen</b>).
        </li>
      </ol>
    )
  }
  return (
    <ol>
      <li>
        On a phone, use the browser's <b>Add to Home Screen</b>. On a computer, look for <b>Install</b> in the address bar or browser menu.
      </li>
    </ol>
  )
}
