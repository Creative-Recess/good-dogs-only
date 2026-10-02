// The password check in front of the app. A correct password sets a signed cookie that lasts a year; the cookie's
// value is an HMAC of a fixed label keyed by the password, so changing the password signs everyone out.

export const COOKIE = 'gdo_auth'
/** Browsers cap cookies at 400 days; a year is plenty and simple to reason about. */
const MAX_AGE = 60 * 60 * 24 * 365

const encoder = new TextEncoder()
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

export async function tokenFor(password: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode('good-dogs-only:v1')))
}

/** Compares two strings in time that doesn't depend on where they differ. */
export function sameText(a: string, b: string): boolean {
  const x = encoder.encode(a)
  const y = encoder.encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}

export function cookieValue(request: Request, name: string): string | null {
  for (const part of (request.headers.get('Cookie') ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return v.join('=')
  }
  return null
}

export async function isSignedIn(request: Request, password: string): Promise<boolean> {
  const value = cookieValue(request, COOKIE)
  return value !== null && sameText(value, await tokenFor(password))
}

/** Secure (https only) everywhere but plain-http local testing, where Safari would refuse to keep it. */
export async function signInCookie(password: string, url: URL): Promise<string> {
  const secure = url.protocol === 'https:' ? '; Secure' : ''
  return `${COOKIE}=${await tokenFor(password)}; Max-Age=${MAX_AGE}; Path=/; HttpOnly${secure}; SameSite=Lax`
}
