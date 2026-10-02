// The Cloudflare Worker that serves Good Dogs Only: every request needs the site password first (the app's breed
// photos aren't ours to publish), then the built app is served from the static assets in dist/.
// The sign-in page lives on the app's own address so it works inside the Home Screen app, not just in Safari.
import { isSignedIn, sameText, signInCookie } from './auth.ts'

type Env = {
  /** The built app (dist/), from wrangler.jsonc's "assets". */
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  /** Set with: pnpm exec wrangler secret put SITE_PASSWORD */
  SITE_PASSWORD?: string
}

const html = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })

/** A plain sign-in page in the spirit of the Aqua Glass launch screen; no scripts, no outside files. */
export function signInPage(wrong = false): string {
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#e9eef5">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Good Dogs">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<title>Good Dogs Only</title>
<style>
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body { display: grid; place-items: center; padding: 24px 16px; font: 17px/1.4 -apple-system, "Helvetica Neue", sans-serif; color: #1c2230;
    background: linear-gradient(180deg, #9cc0e6 0%, #d6e2ec 16%, #8fb0d8 34%, #4f7fbf 46%, #6f97c9 66%, #3d68a8 84%, #284f8c 100%); }
  form { width: min(100%, 340px); display: grid; gap: 12px; padding: 24px 22px; border-radius: 16px; background: rgba(250, 251, 253, 0.85);
    -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px); box-shadow: 0 10px 30px rgba(20, 40, 80, 0.25); }
  h1 { margin: 0; font-size: 22px; text-align: center; }
  p { margin: 0; color: #4c5566; font-size: 15px; text-align: center; }
  input { font: inherit; padding: 10px 14px; border-radius: 12px; border: 0; box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.35), 0 0 0 1px #8e8e8e; background: #fff; }
  button { font: inherit; font-weight: 600; padding: 10px; border: 0; border-radius: 12px; color: #fff; cursor: pointer;
    background: linear-gradient(180deg, #dcefff 0%, #9fd0ff 10%, #5aa8f0 48%, #3a8be0 52%, #6cb6f4 85%, #c4e4ff 100%); box-shadow: inset 0 0 0 1px #2f6fb8; text-shadow: 0 -1px 0 rgba(0, 40, 100, 0.35); }
  .wrong { color: #b3261e; }
</style>
</head>
<body>
<form method="post" action="/sign-in">
  <h1>Good Dogs Only</h1>
  <p${wrong ? ' class="wrong"' : ''}>${wrong ? "That's not the password. Try again." : 'Enter the password to open the app.'}</p>
  <input type="password" name="password" autocomplete="current-password" aria-label="Password" required autofocus>
  <button type="submit">Open</button>
</form>
</body>
</html>`
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const password = env.SITE_PASSWORD
    if (!password) return html('<p>The site password hasn\'t been set yet: run <code>pnpm exec wrangler secret put SITE_PASSWORD</code>.</p>', 503)
    const url = new URL(request.url)

    if (url.pathname === '/sign-in' && request.method === 'POST') {
      const given = String((await request.formData()).get('password') ?? '')
      if (!sameText(given, password)) return html(signInPage(true), 401)
      return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': await signInCookie(password, url) } })
    }

    if (await isSignedIn(request, password)) return env.ASSETS.fetch(request)
    // Pages get the sign-in form; anything else (photos, scripts) just gets a no.
    const wantsPage = request.method === 'GET' && (request.headers.get('Accept') ?? '').includes('text/html')
    return wantsPage ? html(signInPage(), 401) : new Response('Sign in first', { status: 401, headers: { 'Cache-Control': 'no-store' } })
  },
}
