// Builds one numbered comparison sheet per dex entry from its top photo candidates, for visual review.
// Reads .cache/photo-candidates.json; writes .cache/review/<round>/<dexNo>-<id>.jpg plus index.json there
// (which file each tile number is). If an entry already has a pick it is shown first, as tile 1, so a reviewer
// can keep it. Thumbnails are downloaded once into .cache/thumbs/.
// Usage: node scripts/make-review-sheets.ts <round> <perSheet> [id ...]   (no ids = every entry)
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp, { type OverlayOptions } from 'sharp'
import { buildBreedList } from './lib/dataset.ts'
import { cachedDownload } from './lib/downloads.ts'
import type { Candidate, PhotoPick } from './lib/photos.ts'

const [round, perSheetArg, ...onlyIds] = process.argv.slice(2)
if (!round || !perSheetArg) throw new Error('Usage: node scripts/make-review-sheets.ts <round> <perSheet> [id ...]')
const PER_SHEET = Number(perSheetArg)
const TILE = 330
const COLS = 3
const HEADER = 44
const LABEL = 22

const escapeXml = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)
const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8')) as T
const candidates = await readJson<Record<string, Candidate[]>>('../.cache/photo-candidates.json')
const picksPath = new URL('../data/photo-picks.json', import.meta.url)
const picks: Record<string, PhotoPick> = existsSync(picksPath) ? (await readJson<{ picks: Record<string, PhotoPick> }>(picksPath.href)).picks : {}
const reviewDir = new URL(`../.cache/review/${round}/`, import.meta.url)
const thumbDir = new URL('../.cache/thumbs/', import.meta.url)
await mkdir(reviewDir, { recursive: true })

const index: Record<string, { sheet: string; tiles: { n: number; file: string }[] }> = {}
const breeds = buildBreedList().filter((b) => onlyIds.length === 0 || onlyIds.includes(b.id))
for (const [i, b] of breeds.entries()) {
  const pool = candidates[b.id] ?? []
  const current = pool.find((c) => c.file === picks[b.id]?.file)
  const top = [...(current ? [current] : []), ...pool.filter((c) => c !== current)].slice(0, PER_SHEET)
  const sheet = `${b.dexNo}-${b.id}.jpg`
  index[b.id] = { sheet, tiles: top.map((c, n) => ({ n: n + 1, file: c.file })) }
  if (top.length === 0) continue

  const rows = Math.ceil(top.length / COLS)
  const width = COLS * TILE
  const height = HEADER + rows * (TILE + LABEL)
  // Two downloads at a time: the most Wikimedia's robot policy allows.
  const locals: string[] = []
  for (let n = 0; n < top.length; n += 2) {
    locals.push(...(await Promise.all(top.slice(n, n + 2).map((c) => cachedDownload(c.thumb330, thumbDir)))))
  }
  const layers: OverlayOptions[] = []
  for (const [n, c] of top.entries()) {
    const local = locals[n]
    const tile = await sharp(local).resize(TILE, TILE, { fit: 'contain', background: '#222' }).jpeg().toBuffer()
    const left = (n % COLS) * TILE
    const rowTop = HEADER + Math.floor(n / COLS) * (TILE + LABEL)
    layers.push({ input: tile, left, top: rowTop + LABEL })
    const caption = `${n + 1}${c === current ? ' (current)' : ''}  ${c.width}x${c.height}  ${c.flags.join(', ')}`.slice(0, 52)
    layers.push({
      input: Buffer.from(
        `<svg width="${TILE}" height="${LABEL}"><rect width="100%" height="100%" fill="#000"/><text x="6" y="16" font-family="Helvetica" font-size="14" fill="#fff">${escapeXml(caption)}</text></svg>`,
      ),
      left,
      top: rowTop,
    })
  }
  const title = `${b.dexNo}  ${b.name}${b.forms.length ? ` (${b.forms.join(', ')})` : ''}`.slice(0, 95)
  layers.push({
    input: Buffer.from(
      `<svg width="${width}" height="${HEADER}"><rect width="100%" height="100%" fill="#1a3d2b"/><text x="10" y="29" font-family="Helvetica" font-weight="bold" font-size="20" fill="#fff">${escapeXml(title)}</text></svg>`,
    ),
    left: 0,
    top: 0,
  })
  await sharp({ create: { width, height, channels: 3, background: '#333' } })
    .composite(layers)
    .jpeg({ quality: 82 })
    .toFile(new URL(sheet, reviewDir).pathname)
  console.log(`[${i + 1}/${breeds.length}] ${round}/${sheet} (${top.length} candidates)`)
}
await writeFile(new URL('index.json', reviewDir), JSON.stringify(index, null, 1) + '\n')
console.log(`Wrote .cache/review/${round}/index.json`)
