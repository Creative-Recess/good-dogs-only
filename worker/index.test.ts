import { describe, expect, it } from 'vitest'
import { COOKIE, tokenFor } from './auth.ts'
import worker from './index.ts'

const PASSWORD = 'good dog'
const assets = { fetch: async (r: Request) => new Response(`asset ${new URL(r.url).pathname}`) }
const env = { ASSETS: assets, SITE_PASSWORD: PASSWORD }
const page = (path: string, init: RequestInit = {}) => new Request(`https://dogs.example${path}`, { headers: { Accept: 'text/html' }, ...init })

describe('the site password', () => {
  it('shows the sign-in page instead of the app until you sign in', async () => {
    const res = await worker.fetch(page('/'), env)
    expect(res.status).toBe(401)
    expect(await res.text()).toContain('Enter the password')
  })

  it("doesn't serve photos or scripts without signing in", async () => {
    const res = await worker.fetch(new Request('https://dogs.example/breeds/pug.webp'), env)
    expect(res.status).toBe(401)
  })

  it('rejects a wrong password', async () => {
    const res = await worker.fetch(page('/sign-in', { method: 'POST', body: new URLSearchParams({ password: 'cat' }) }), env)
    expect(res.status).toBe(401)
    expect(res.headers.get('Set-Cookie')).toBeNull()
  })

  it('signs you in for a year with the right password, then serves the app', async () => {
    const res = await worker.fetch(page('/sign-in', { method: 'POST', body: new URLSearchParams({ password: PASSWORD }) }), env)
    expect(res.status).toBe(303)
    const cookie = res.headers.get('Set-Cookie')!
    expect(cookie).toMatch(/HttpOnly; Secure; SameSite=Lax/)
    expect(cookie).toMatch(/Max-Age=31536000/)
    const app = await worker.fetch(page('/', { headers: { Accept: 'text/html', Cookie: cookie.split(';')[0] } }), env)
    expect(await app.text()).toBe('asset /')
  })

  it('signs everyone out when the password changes', async () => {
    const old = `${COOKIE}=${await tokenFor('old password')}`
    const res = await worker.fetch(page('/', { headers: { Accept: 'text/html', Cookie: old } }), env)
    expect(res.status).toBe(401)
  })

  it('says so if the password was never set', async () => {
    const res = await worker.fetch(page('/'), { ASSETS: assets })
    expect(res.status).toBe(503)
  })
})
