// Builds what the app ships: resized breed photos in public/breeds/ and src/data/breeds.json.
// For each pick in data/photo-picks.json it fetches fresh licence + author details from Commons, downloads the
// photo once (cached in .cache/originals/), and writes a square grid crop centred on the dog plus a detail image.
// Usage: node scripts/build-data.ts
import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import type { Breed, PhotoCredit } from '../src/data/types.ts'
import { buildBreedList, groups } from './lib/dataset.ts'
import { cachedDownload } from './lib/downloads.ts'
import { makeMasks } from './lib/masks.ts'
import { politeFetchJson } from './lib/http.ts'
import { isAllowedLicence } from './lib/licences.ts'
import { plainText, type PhotoPick } from './lib/photos.ts'

const GRID_SIZE = 400
const DETAIL_MAX = { width: 1200, height: 1500 }
// Wikimedia only serves thumbnails at standard widths; 1280 is the smallest that covers the detail size.
const SOURCE_WIDTH = 1280

type Meta = Record<string, { value: string } | undefined>
type ImageInfo = { url: string; thumburl?: string; width: number; height: number; descriptionurl: string; extmetadata?: Meta }

const picks: Record<string, PhotoPick> = JSON.parse(await readFile(new URL('../data/photo-picks.json', import.meta.url), 'utf8')).picks
const outDir = new URL('../public/breeds/', import.meta.url)
const originals = new URL('../.cache/originals/', import.meta.url)
const chunk = <T>(xs: T[], n: number) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n))

// 1. Fresh image details for every picked file, 50 per request.
const files = [...new Set(Object.values(picks).flatMap((p) => (p.file ? [p.file] : [])))]
const info = new Map<string, ImageInfo>()
for (const batch of chunk(files, 50)) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiurlwidth: String(SOURCE_WIDTH),
    iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl',
    titles: batch.join('|'),
  })
  const res = await politeFetchJson<{ query: { pages: { title: string; imageinfo?: ImageInfo[] }[]; normalized?: { from: string; to: string }[] } }>(
    `https://commons.wikimedia.org/w/api.php?${params}`,
  )
  const renamed = new Map((res.query.normalized ?? []).map((n) => [n.to, n.from]))
  for (const p of res.query.pages) if (p.imageinfo?.[0]) info.set(renamed.get(p.title) ?? p.title, p.imageinfo[0])
}

// 2. Images and credits per entry.
await mkdir(outDir, { recursive: true })
const written = new Set<string>()
const breeds: Breed[] = []
const maskJobs: { grid: string; out: string }[] = []
const problems: string[] = []
for (const b of buildBreedList()) {
  const pick = picks[b.id]
  if (!pick) problems.push(`${b.id}: no entry in data/photo-picks.json`)
  if (!pick?.file && !pick?.external) {
    breeds.push(b)
    continue
  }

  // Where the photo comes from: a Wikimedia Commons file (licence-checked), or a page Justin chose (Dogs Australia).
  let local: string
  let credit: PhotoCredit
  if (pick.external) {
    local = await cachedDownload(pick.external.url, originals, '.img')
    credit = {
      author: pick.external.credit,
      licence: `Copyright ${pick.external.credit}`,
      licenceUrl: null,
      sourceUrl: pick.external.sourceUrl,
      changes: 'Resized, and cropped to a square for the grid',
      restricted: true,
    }
  } else {
    const ii = info.get(pick.file!)
    const meta = ii?.extmetadata ?? {}
    const licence = meta.LicenseShortName?.value ?? ''
    if (!ii) {
      problems.push(`${b.id}: ${pick.file} not found on Commons`)
      breeds.push(b)
      continue
    }
    if (!isAllowedLicence(licence)) problems.push(`${b.id}: ${pick.file} has licence "${licence}", not on the allow-list`)
    // Use the 1280px thumbnail when the original is bigger, otherwise the original itself (never upscale).
    local = await cachedDownload(ii.width > SOURCE_WIDTH && ii.thumburl ? ii.thumburl : ii.url, originals, '.img')
    const author = plainText(meta.Artist?.value ?? '') || plainText(meta.Credit?.value ?? '') || 'Unknown author (see source page)'
    credit = {
      author: author.length > 120 ? `${author.slice(0, 117)}...` : author,
      licence,
      licenceUrl: meta.LicenseUrl?.value ?? null,
      sourceUrl: ii.descriptionurl,
      changes: 'Resized, and cropped to a square for the grid',
    }
  }

  const [fx, fy] = pick.focus ?? [0.5, 0.5]
  const hash = createHash('sha1').update(`${pick.file ?? pick.external?.url}|${fx}|${fy}|v1`).digest('hex').slice(0, 8)
  const gridName = `${b.id}-${hash}-grid.webp`
  const detailName = `${b.id}-${hash}.webp`

  const image = sharp(local).rotate() // respect EXIF orientation
  const { width = 0, height = 0 } = await image.metadata().then((m) => (m.orientation && m.orientation >= 5 ? { width: m.height, height: m.width } : m))
  const side = Math.min(width, height)
  const left = Math.round(Math.min(Math.max(fx * width - side / 2, 0), width - side))
  const top = Math.round(Math.min(Math.max(fy * height - side / 2, 0), height - side))
  await sharp(local).rotate().extract({ left, top, width: side, height: side }).resize(GRID_SIZE, GRID_SIZE).webp({ quality: 76 }).toFile(new URL(gridName, outDir).pathname)
  const detail = await sharp(local)
    .rotate()
    .resize({ ...DETAIL_MAX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(new URL(detailName, outDir).pathname)
  const maskName = `${b.id}-${hash}-mask.webp`
  written.add(gridName).add(detailName).add(maskName)
  maskJobs.push({ grid: new URL(gridName, outDir).pathname, out: new URL(maskName, outDir).pathname })

  breeds.push({
    ...b,
    image: { grid: `/breeds/${gridName}`, detail: `/breeds/${detailName}`, mask: `/breeds/${maskName}`, width: detail.width, height: detail.height, focus: [fx, fy] },
    credit,
  })
}

// 3. The dog's shape for each photo (for unseen breeds' silhouettes), made once and kept.
await makeMasks(maskJobs, new URL('../.cache/masks', import.meta.url).pathname)

// 4. Remove images from earlier builds that are no longer used, then write the data file.
for (const f of await readdir(outDir)) if (!written.has(f)) await rm(new URL(f, outDir))
await writeFile(new URL('../src/data/breeds.json', import.meta.url), JSON.stringify({ groups, breeds }, null, 1) + '\n')
const withPhoto = breeds.filter((b) => b.image).length
console.log(`Wrote ${breeds.length} entries (${withPhoto} with photos) to src/data/breeds.json`)
for (const p of problems) console.log(`  - ${p}`)
if (problems.length) process.exitCode = 1
