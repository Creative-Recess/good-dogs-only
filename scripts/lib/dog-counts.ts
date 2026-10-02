// How many dogs are in each breed photo, counted by Apple's Vision framework (scripts/vision/count-dogs.swift, so this
// needs a Mac). Counts are cached by file name in .cache/dog-counts.json, since photo files never change their contents.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

export async function countDogs(photos: string[], cacheFile: string): Promise<Map<string, number>> {
  const cache: Record<string, number> = existsSync(cacheFile) ? JSON.parse(await readFile(cacheFile, 'utf8')) : {}
  const todo = photos.filter((p) => cache[basename(p)] === undefined)
  if (todo.length) {
    if (process.platform !== 'darwin') throw new Error('Counting dogs needs macOS (Apple Vision). Build the data on a Mac.')
    console.log(`Counting the dogs in ${todo.length} photos with Apple Vision...`)
    const script = new URL('../vision/count-dogs.swift', import.meta.url).pathname
    const out = execFileSync('swift', [script, ...todo], { encoding: 'utf8', maxBuffer: 1 << 24 })
    for (const line of out.trim().split('\n')) {
      const [count, path] = line.split('\t')
      if (path) cache[basename(path)] = Number(count)
    }
    await writeFile(cacheFile, JSON.stringify(cache, null, 1) + '\n')
  }
  return new Map(photos.map((p) => [p, cache[basename(p)] ?? -1]))
}
