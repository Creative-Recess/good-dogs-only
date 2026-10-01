// Builds the clickable design mockup (step 9 of the plan): design/mockup.template.html plus a sample of real
// breeds and photos, inlined as data URIs so it publishes as a single self-contained page.
// Output: .cache/design/<name>.html
// Usage: node design/make-mockup.ts [template=mockup] [output=dogdex-mockup]
//   e.g. node design/make-mockup.ts mockup98 dogdex-98   (the Windows 98 variant; inlines design/vendor/98css)
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { buildBreedList, groups } from '../scripts/lib/dataset.ts'
import { cachedDownload } from '../scripts/lib/downloads.ts'
import { plainText, type Candidate, type PhotoPick } from '../scripts/lib/photos.ts'

/** Common Sydney park breeds across every group, plus three bonus dogs. */
const SAMPLE = [
  'pug', 'chihuahua-smooth-coat', 'italian-greyhound', 'cavalier-king-charles-spaniel',
  'jack-russell-terrier', 'staffordshire-bull-terrier', 'west-highland-white-terrier', 'bull-terrier',
  'labrador-retriever', 'golden-retriever', 'cocker-spaniel', 'hungarian-vizsla',
  'whippet', 'rhodesian-ridgeback', 'dachshund', 'beagle',
  'australian-cattle-dog', 'border-collie', 'german-shepherd-dog',
  'boxer', 'bernese-mountain-dog', 'schnauzer-miniature',
  'french-bulldog', 'dalmatian', 'british-bulldog',
  'cavoodle', 'groodle', 'miniature-fox-terrier',
]
/** Example catches so the mockup opens in a realistic, part-filled state. */
const DEMO_CAUGHT: Record<string, { date: string; note?: string }> = {
  'labrador-retriever': { date: '2026-09-06' },
  'cavoodle': { date: '2026-09-06', note: 'Apricot, called Biscuit' },
  'staffordshire-bull-terrier': { date: '2026-09-13' },
  'border-collie': { date: '2026-09-13' },
  'groodle': { date: '2026-09-20' },
  'french-bulldog': { date: '2026-09-20' },
  'jack-russell-terrier': { date: '2026-09-27' },
  'golden-retriever': { date: '2026-09-27', note: 'Two of them at the off-leash area' },
  'dachshund': { date: '2026-09-30' },
  'cavalier-king-charles-spaniel': { date: '2026-10-01' },
  'pug': { date: '2026-10-01' },
}

const root = new URL('../', import.meta.url)
const readJson = async <T>(p: string): Promise<T> => JSON.parse(await readFile(new URL(p, root), 'utf8')) as T
const temperament = (await readJson<{ breeds: Record<string, { traits: string[]; text: string }> }>('data/temperament.json')).breeds
const picks = (await readJson<{ picks: Record<string, PhotoPick> }>('data/photo-picks.json')).picks
const pools: Record<string, Candidate[]>[] = [await readJson('.cache/photo-candidates.json')]
if (existsSync(new URL('.cache/photo-candidates.r1.json', root))) pools.push(await readJson('.cache/photo-candidates.r1.json'))

/** Wikimedia only serves standard thumbnail widths; 960 is plenty for a phone-width mockup. */
function sourceUrl(c: Candidate): string {
  const u = new URL(c.thumb330)
  u.search = ''
  if (!u.pathname.includes('/thumb/')) return u.href // already the original (narrower than 330px)
  if (c.width > 960) {
    u.pathname = u.pathname.replace('/330px-', '/960px-')
    return u.href
  }
  // Originals live on upload.wikimedia.org: drop "/thumb" and the trailing "330px-..." segment.
  u.host = 'upload.wikimedia.org'
  u.pathname = u.pathname.replace('/thumb/', '/').replace(/\/[^/]+$/, '')
  return u.href
}
const dataUri = (buf: Buffer) => `data:image/webp;base64,${buf.toString('base64')}`

const all = buildBreedList()
const total = (groupId: string) => all.filter((b) => b.groupId === groupId).length
const sample = []
for (const id of SAMPLE) {
  const b = all.find((x) => x.id === id)
  if (!b) throw new Error(`Unknown sample id ${id}`)
  const pick = picks[id]
  const pool = pools.map((p) => p[id] ?? []).flat()
  const c = (pick?.file && pool.find((x) => x.file === pick.file)) || pool[0]
  if (!c) throw new Error(`No photo for ${id}`)
  const local = await cachedDownload(sourceUrl(c), new URL('.cache/mockup-src/', root), '.img')
  const [fx, fy] = pick?.focus ?? [0.5, 0.5]
  const meta = await sharp(local).rotate().metadata()
  const [w, h] = meta.orientation && meta.orientation >= 5 ? [meta.height!, meta.width!] : [meta.width!, meta.height!]
  const side = Math.min(w, h)
  const left = Math.round(Math.min(Math.max(fx * w - side / 2, 0), w - side))
  const top = Math.round(Math.min(Math.max(fy * h - side / 2, 0), h - side))
  const grid = await sharp(local).rotate().extract({ left, top, width: side, height: side }).resize(300, 300).webp({ quality: 72 }).toBuffer()
  const tiny = await sharp(local).rotate().extract({ left, top, width: side, height: side }).resize(32, 32).webp({ quality: 80 }).toBuffer()
  const detailOut = await sharp(local).rotate().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer({ resolveWithObject: true })
  const detail = detailOut.data
  sample.push({
    ...b,
    focus: [fx, fy],
    temperament: temperament[id] ?? null,
    img: { grid: dataUri(grid), tiny: dataUri(tiny), detail: dataUri(detail), w: detailOut.info.width, h: detailOut.info.height },
    credit: {
      author: plainText(c.artistHtml) || plainText(c.credit) || 'Unknown author',
      licence: c.licence,
      licenceUrl: c.licenceUrl,
      sourceUrl: c.descriptionUrl,
    },
  })
  console.log(`${b.dexNo} ${b.name}: ${c.file}`)
}

const data = {
  groups: groups.map((g) => ({ ...g, total: total(g.id) })),
  breeds: sample,
  demoCaught: DEMO_CAUGHT,
  totalEntries: all.length,
}
const [templateName = 'mockup', outName = 'dogdex-mockup'] = process.argv.slice(2)
let template = await readFile(new URL(`design/${templateName}.template.html`, root), 'utf8')
if (template.includes('/*__98CSS__*/')) {
  // 98.css loads its pixel fonts by relative URL; the artifact allows no external files, so inline them.
  const vendor = new URL('design/vendor/98css/', root)
  let css = await readFile(new URL('98.css', vendor), 'utf8')
  for (const font of ['ms_sans_serif', 'ms_sans_serif_bold']) {
    const woff2 = (await readFile(new URL(`${font}.woff2`, vendor))).toString('base64')
    css = css.replace(new RegExp(`url\\(${font}\\.woff2\\)`, 'g'), `url(data:font/woff2;base64,${woff2})`).replace(new RegExp(`,?\\s*url\\(${font}\\.woff\\)\\s*format\\("woff"\\)`, 'g'), '')
  }
  template = template.replace('/*__98CSS__*/', () => `/*! 98.css 0.1.21, MIT, (c) Jordan Scales */\n${css}`)
}
await mkdir(new URL('.cache/design/', root), { recursive: true })
const out = new URL(`.cache/design/${outName}.html`, root)
await writeFile(out, template.replace('__DOGDEX_DATA__', () => JSON.stringify(data)))
console.log(`Wrote ${out.pathname} (${Math.round(JSON.stringify(data).length / 1024)} KB of data)`)
