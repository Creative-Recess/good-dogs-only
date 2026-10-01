// Gathers candidate breed photos from Wikimedia Commons and ranks them, ready for visual review.
// Sources per entry: the Wikipedia lead image, Wikidata images, then "Quality images" and other files in the
// breed's Commons category tree (or the overrides in data/photo-sources.json).
// Writes .cache/photo-candidates.json (a regenerable cache, not committed).
// Usage: node scripts/fetch-photo-candidates.ts [id ...]   (with ids, refreshes just those entries in the cache)
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { buildBreedList } from './lib/dataset.ts'
import { politeFetchJson } from './lib/http.ts'
import { isAllowedLicence } from './lib/licences.ts'
import type { Candidate } from './lib/photos.ts'

type WikiEntry = { title: string | null; commonsCategory?: string | null; wikidataImages?: string[] }
type Sources = { categories?: string[]; searches?: string[] }
type Meta = Record<string, { value: string } | undefined>
type ImageInfo = { url: string; thumburl?: string; width: number; height: number; mime: string; descriptionurl: string; extmetadata?: Meta }

const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8')) as T
const wikiMap = await readJson<Record<string, WikiEntry>>('../data/wiki-map.json')
const sources = (await readJson<{ breeds: Record<string, Sources> }>('../data/photo-sources.json')).breeds

const COMMONS = 'https://commons.wikimedia.org/w/api.php'
const api = <T>(base: string, params: Record<string, string>) =>
  politeFetchJson<T>(`${base}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`, { delayMs: 350 })
const chunk = <T>(xs: T[], n: number) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n))
const asFile = (name: string) => (name.startsWith('File:') ? name : `File:${name}`).replace(/_/g, ' ')

async function searchFiles(query: string, limit: number): Promise<string[]> {
  const res = await api<{ query?: { search: { title: string }[] } }>(COMMONS, {
    action: 'query',
    list: 'search',
    srnamespace: '6',
    srlimit: String(limit),
    srsearch: query,
  })
  return (res.query?.search ?? []).map((s) => s.title)
}

/** Follows {{Category redirect|...}} so searches use the category that actually holds the files. */
async function resolveCategory(cat: string): Promise<string> {
  const res = await api<{ query: { pages: { revisions?: { slots: { main: { content: string } } }[] }[] } }>(COMMONS, {
    action: 'query',
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    titles: `Category:${cat}`,
  })
  const content = res.query.pages[0]?.revisions?.[0]?.slots.main.content ?? ''
  const target = /\{\{\s*Category redirect\s*\|\s*(?:Category:)?([^|}]+)/i.exec(content)?.[1]?.trim()
  if (target && target !== cat) console.log(`  category "${cat}" redirects to "${target}"`)
  return target ?? cat
}

const onlyIds = process.argv.slice(2)
const breeds = buildBreedList().filter((b) => onlyIds.length === 0 || onlyIds.includes(b.id))
const unknown = onlyIds.filter((id) => !breeds.some((b) => b.id === id))
if (unknown.length) throw new Error(`Unknown ids: ${unknown.join(', ')}`)

// 1. Wikipedia lead images, 50 articles per request.
const leadByTitle = new Map<string, string>()
const titles = [...new Set(breeds.flatMap((b) => wikiMap[b.id]?.title ?? []))]
for (const batch of chunk(titles, 50)) {
  const res = await api<{ query: { pages: { title: string; pageimage?: string }[]; redirects?: { from: string; to: string }[] } }>(
    'https://en.wikipedia.org/w/api.php',
    { action: 'query', prop: 'pageimages', piprop: 'name', pilicense: 'free', redirects: '1', titles: batch.join('|') },
  )
  for (const p of res.query.pages) if (p.pageimage) leadByTitle.set(p.title, asFile(p.pageimage))
}

// 2. Candidate file names per entry, remembering how each was found.
const via = new Map<string, Map<string, Set<string>>>()
const add = (id: string, file: string, how: string) => {
  const forBreed = via.get(id) ?? new Map<string, Set<string>>()
  via.set(id, forBreed)
  const hows = forBreed.get(asFile(file)) ?? new Set<string>()
  hows.add(how)
  forBreed.set(asFile(file), hows)
}
for (const [i, b] of breeds.entries()) {
  const wiki = wikiMap[b.id]
  const override = sources[b.id]
  if (!override && wiki?.title && leadByTitle.has(wiki.title)) add(b.id, leadByTitle.get(wiki.title)!, 'lead')
  if (!override) for (const f of wiki?.wikidataImages ?? []) add(b.id, f, 'wikidata')
  const categories = override?.categories ?? (wiki?.commonsCategory ? [wiki.commonsCategory] : [])
  for (const cat of await Promise.all(categories.map(resolveCategory))) {
    for (const f of await searchFiles(`incategory:"Quality images" deepcat:"${cat}"`, 25)) add(b.id, f, 'quality')
    for (const f of await searchFiles(`deepcat:"${cat}" filetype:bitmap`, 25)) add(b.id, f, 'category')
  }
  for (const q of override?.searches ?? []) for (const f of await searchFiles(`${q} filetype:bitmap`, 15)) add(b.id, f, 'search')
  console.log(`[${i + 1}/${breeds.length}] ${b.name}: ${via.get(b.id)?.size ?? 0} files`)
}

// 3. Size, type, licence and categories for every distinct file, 50 per request.
const info = new Map<string, ImageInfo>()
const allFiles = [...new Set([...via.values()].flatMap((m) => [...m.keys()]))]
for (const batch of chunk(allFiles, 50)) {
  const res = await api<{ query: { pages: { title: string; imageinfo?: ImageInfo[] }[]; normalized?: { from: string; to: string }[] } }>(COMMONS, {
    action: 'query',
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '330',
    iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl|Categories|Assessments|DateTimeOriginal',
    titles: batch.join('|'),
  })
  const renamed = new Map((res.query.normalized ?? []).map((n) => [n.to, n.from]))
  for (const p of res.query.pages) if (p.imageinfo?.[0]) info.set(renamed.get(p.title) ?? p.title, p.imageinfo[0])
}

// 4. Score: prefer assessed and editor-chosen images, decent resolution; demote puppies, art, black and white
// and old photos. Photos categorised as mixes are dropped for official breeds.
const ART =
  /\b(paintings?|drawings?|illustrations?|engravings?|lithographs?|prints?|stamps?|postcards?|statues?|sculptures?|figurines?|skeletons?|skulls?|cartoons?|posters?|books?|magazines?|museums?|stereo ?cards?|stereographs?|bronze|marble|porcelain|taxidermy|fresco(e?s)?|mosaics?|murals?|reliefs?|tapestr(y|ies)|coins?|vases?|ceramics?|frescoes)\b|in art\b/i
const MONO = /black[- ]and[- ]white|monochrome|sepia|grayscale|greyscale|\bb&w\b/i
/** Commons breed categories include "<breed> hybrids" subcategories; those photos are mixes, not the breed. */
const MIXED = /hybrids?\b|cross-?breeds?\b|mixed[- ]breeds?|\bmix(es)?\b|doodles?\b|poos?\b/i
const PUPPY = /\b(pupp(y|ies)|welpen?|cachorros?|chiots?|whelps?)\b/i
const GROUP = /\b(two|three|four|pack|group|litter|pair|with (a |an |his |her )?(man|woman|owner|child|girl|boy|people))\b/i

function score(file: string, ii: ImageInfo, hows: Set<string>): { score: number; flags: string[] } {
  const meta = ii.extmetadata ?? {}
  const text = `${file} ${meta.Categories?.value ?? ''}`
  const assessments = meta.Assessments?.value ?? ''
  const minSide = Math.min(ii.width, ii.height)
  const flags: string[] = []
  let s = 0
  const penalise = (points: number, flag: string) => {
    s -= points
    flags.push(flag)
  }
  if (hows.has('lead')) s += 2
  if (hows.has('wikidata')) s += 2
  if (hows.has('quality') || /quality/i.test(assessments)) s += 3
  if (/featured/i.test(assessments)) s += 2
  if (minSide >= 1200) s += 1
  if (minSide < 900) s -= 1
  if (minSide < 600) penalise(4, 'low-res')
  const ratio = Math.max(ii.width, ii.height) / minSide
  if (ratio > 2.2) penalise(3, 'extreme aspect ratio')
  if (PUPPY.test(text)) penalise(3, 'puppy')
  if (ART.test(text)) penalise(8, 'artwork or object')
  if (MONO.test(text)) penalise(6, 'black and white')
  if (GROUP.test(file)) penalise(2, 'maybe several dogs or people')
  const year = /\b(18\d\d|19[0-5]\d)\b/.exec(file + ' ' + (meta.DateTimeOriginal?.value ?? ''))
  if (year) penalise(3, `old (${year[1]})`)
  if (/side view|conformation/i.test(text)) flags.push('show-style side view')
  return { score: s, flags }
}

const cachePath = new URL('../.cache/photo-candidates.json', import.meta.url)
const out: Record<string, Candidate[]> = onlyIds.length && existsSync(cachePath) ? JSON.parse(await readFile(cachePath, 'utf8')) : {}
let rejected = 0
for (const b of breeds) {
  const list: Candidate[] = []
  for (const [file, hows] of via.get(b.id) ?? []) {
    const ii = info.get(file)
    const meta = ii?.extmetadata ?? {}
    const licence = meta.LicenseShortName?.value ?? ''
    const mixed = b.tier === 'ankc' && MIXED.test(meta.Categories?.value ?? '')
    if (!ii || !ii.thumburl || !/^image\/(jpeg|png|webp|tiff)$/.test(ii.mime) || !isAllowedLicence(licence) || Math.min(ii.width, ii.height) < 400 || mixed) {
      rejected++
      continue
    }
    list.push({
      file,
      width: ii.width,
      height: ii.height,
      mime: ii.mime,
      thumb330: ii.thumburl,
      descriptionUrl: ii.descriptionurl,
      licence,
      licenceUrl: meta.LicenseUrl?.value ?? null,
      artistHtml: meta.Artist?.value ?? '',
      credit: meta.Credit?.value ?? '',
      categories: (meta.Categories?.value ?? '').split('|').filter(Boolean),
      via: [...hows],
      ...score(file, ii, hows),
    })
  }
  out[b.id] = list.sort((x, y) => y.score - x.score || Math.min(y.width, y.height) - Math.min(x.width, x.height))
}

await mkdir(new URL('../.cache/', import.meta.url), { recursive: true })
await writeFile(cachePath, JSON.stringify(out, null, 1) + '\n')
const thin = breeds.filter((b) => (out[b.id]?.length ?? 0) < 3).map((b) => `${b.id} (${out[b.id]?.length ?? 0})`)
console.log(`\n${allFiles.length} files checked, ${rejected} rejected (licence, type, size or a mix).`)
console.log(`Entries with fewer than 3 usable candidates: ${thin.length ? thin.join(', ') : 'none'}`)
