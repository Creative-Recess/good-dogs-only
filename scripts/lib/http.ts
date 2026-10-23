// Shared HTTP helpers for the data scripts. Wikimedia requires a descriptive User-Agent with contact details.
export const USER_AGENT = `GoodDogsOnly/0.1 (https://github.com/Creative-Recess/good-dogs-only) Node.js/${process.versions.node}`

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** GET with a descriptive User-Agent, a pause between calls, and retries on 429/5xx (honouring Retry-After). */
export async function politeFetch(url: string, { delayMs = 500, retries = 4 } = {}): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    await sleep(delayMs)
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT } })
    if (res.ok) return res
    if (attempt < retries && (res.status === 429 || res.status >= 500)) {
      const retryAfter = Number(res.headers.get('retry-after'))
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * 2 ** attempt)
      continue
    }
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`)
  }
}

export async function politeFetchText(url: string, opts?: { delayMs?: number }): Promise<string> {
  return (await politeFetch(url, opts)).text()
}

export async function politeFetchJson<T>(url: string, opts?: { delayMs?: number }): Promise<T> {
  return (await politeFetch(url, opts)).json() as Promise<T>
}
