import { createHash } from 'node:crypto'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { politeFetch } from './http.ts'

/** Downloads a URL once into a cache directory (named by URL hash) and returns the local path. */
export async function cachedDownload(url: string, dir: URL, ext = '.jpg'): Promise<string> {
  await mkdir(dir, { recursive: true })
  const path = new URL(createHash('sha1').update(url).digest('hex').slice(0, 16) + ext, dir).pathname
  try {
    await access(path)
    return path
  } catch {
    const res = await politeFetch(url, { delayMs: 250 })
    const type = res.headers.get('content-type') ?? ''
    if (!type.startsWith('image/')) throw new Error(`Expected an image from ${url}, got "${type}"`)
    await writeFile(path, Buffer.from(await res.arrayBuffer()))
    return path
  }
}
