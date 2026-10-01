// Dog shapes for the "Who's that dog?" silhouettes of breeds you haven't spotted yet.
// Apple's Vision framework (scripts/vision/mask.swift, so this needs a Mac) cuts the dog out of each square grid
// photo; the result is saved as a small white-on-transparent WebP that the app uses as a CSS mask.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const MASK_SIZE = 256

/** Makes `out` (a mask WebP) for each grid photo that doesn't have one yet. */
export async function makeMasks(jobs: { grid: string; out: string }[], cacheDir: string): Promise<void> {
  const todo = jobs.filter((j) => !existsSync(j.out))
  if (!todo.length) return
  if (process.platform !== 'darwin') throw new Error('Dog masks need macOS (Apple Vision). Build the data on a Mac.')
  await mkdir(cacheDir, { recursive: true })
  const raw = (j: { out: string }) => `${cacheDir}/${j.out.split('/').pop()!.replace(/\.webp$/, '.png')}`
  const missing = todo.filter((j) => !existsSync(raw(j)))
  if (missing.length) {
    console.log(`Cutting out ${missing.length} dogs with Apple Vision...`)
    const script = new URL('../vision/mask.swift', import.meta.url).pathname
    execFileSync('swift', [script, ...missing.flatMap((j) => [j.grid, raw(j)])], { stdio: ['ignore', 'ignore', 'inherit'] })
  }
  for (const j of todo) {
    const alpha = await sharp(raw(j)).resize(MASK_SIZE, MASK_SIZE).greyscale().toColourspace('b-w').raw().toBuffer()
    await sharp({ create: { width: MASK_SIZE, height: MASK_SIZE, channels: 3, background: '#ffffff' } })
      .joinChannel(alpha, { raw: { width: MASK_SIZE, height: MASK_SIZE, channels: 1 } })
      .webp({ quality: 80, alphaQuality: 70 })
      .toFile(j.out)
  }
}
