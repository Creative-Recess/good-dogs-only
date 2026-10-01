// Picks a dog's body and patch colours from its photo, for the Park's drawn dogs.
// Looks at the middle of a 24x24 thumbnail, skips grass and sky, and takes the most common colour as the body
// and the most common clearly different one as the patch.
import sharp from 'sharp'
import type { Rgb } from '../../src/data/types.ts'
import { DEFAULT_COLOURS as FALLBACK } from '../../src/park/dog.ts'

export function pickColours(pixels: Iterable<Rgb>): { body: Rgb; patch: Rgb } {
  const counts = new Map<string, { n: number; r: number; g: number; b: number }>()
  for (const [r, g, b] of pixels) {
    if (g > r + 10 && g > b) continue // grass
    if (b > r + 25 && b > g) continue // sky
    const key = `${r >> 5},${g >> 5},${b >> 5}`
    const e = counts.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    e.n++
    e.r += r
    e.g += g
    e.b += b
    counts.set(key, e)
  }
  const ranked = [...counts.values()].sort((a, z) => z.n - a.n).map((e) => [e.r / e.n, e.g / e.n, e.b / e.n].map(Math.round) as Rgb)
  const body = ranked[0]
  if (!body) return FALLBACK
  const distance = (c: Rgb) => Math.abs(c[0] - body[0]) + Math.abs(c[1] - body[1]) + Math.abs(c[2] - body[2])
  const patch = ranked.find((c) => distance(c) > 120) ?? (body.map((v) => Math.min(255, Math.round(v * 1.35))) as Rgb)
  return { body, patch }
}

/** Colours from an image file or buffer (the square grid crop works best: it's centred on the dog). */
export async function photoColours(input: string | Buffer): Promise<{ body: Rgb; patch: Rgb }> {
  const { data } = await sharp(input).resize(24, 24, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const pixels: Rgb[] = []
  for (let y = 5; y < 20; y++) for (let x = 5; x < 19; x++) {
    const i = (y * 24 + x) * 3
    pixels.push([data[i], data[i + 1], data[i + 2]])
  }
  return pickColours(pixels)
}
