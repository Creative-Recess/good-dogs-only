// Builds the clickable design mockup (step 9 of the plan): design/mockup.template.html plus a sample of real
// breeds and photos, inlined as data URIs so it publishes as a single self-contained page.
// Output: .cache/design/<name>.html
// Usage: node design/make-mockup.ts [template=mockup] [output=dogdex-mockup]
//   e.g. node design/make-mockup.ts mockup98 dogdex-98   (the Windows 98 variant; inlines src/vendor/98css)
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { buildBreedList, groups } from '../scripts/lib/dataset.ts'
import type { PhotoPick } from '../scripts/lib/photos.ts'
import type { Breed } from '../src/data/types.ts'

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
const traitsData = (await readJson<{ breeds: Record<string, { traits: string[]; text?: string }> }>('data/traits.json')).breeds
const picks = (await readJson<{ picks: Record<string, PhotoPick> }>('data/photo-picks.json')).picks
const dataUri = (buf: Buffer) => `data:image/webp;base64,${buf.toString('base64')}`

const all = buildBreedList()
const shipped = (await readJson<{ breeds: Breed[] }>('src/data/breeds.json')).breeds
const total = (groupId: string) => all.filter((b) => b.groupId === groupId).length
const sample = []
for (const id of SAMPLE) {
  const b = all.find((x) => x.id === id)
  if (!b) throw new Error(`Unknown sample id ${id}`)
  // Use the app's own built images and credits (src/data/breeds.json + public/breeds) so the mockup matches the app.
  const built = shipped.find((x) => x.id === id)
  if (!built?.image || !built.credit) throw new Error(`No built photo for ${id}`)
  const read = (p: string) => readFile(new URL(`public${p}`, root))
  const grid = await sharp(await read(built.image.grid)).resize(300, 300).webp({ quality: 72 }).toBuffer()
  const detailOut = await sharp(await read(built.image.detail)).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer({ resolveWithObject: true })
  sample.push({
    ...b,
    focus: picks[id]?.focus ?? [0.5, 0.5],
    // Traits from the approved list (data/traits.json); our own one-line text where written.
    temperament: { traits: traitsData[b.officialName ?? b.name].traits, text: traitsData[b.officialName ?? b.name].text ?? '' },
    img: { grid: dataUri(grid), tiny: dataUri(grid), detail: dataUri(detailOut.data), w: detailOut.info.width, h: detailOut.info.height },
    credit: built.credit,
  })
  console.log(`${b.dexNo} ${b.name}: ${built.credit.sourceUrl}`)
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
  const css = await readFile(new URL('src/vendor/98css/98.css', root), 'utf8')
  template = template.replace('/*__98CSS__*/', () => `/*! 98.css 0.1.21, MIT, (c) Jordan Scales */\n${css}`)
}
await mkdir(new URL('.cache/design/', root), { recursive: true })
const out = new URL(`.cache/design/${outName}.html`, root)
await writeFile(out, template.replace('__DOGDEX_DATA__', () => JSON.stringify(data)))
console.log(`Wrote ${out.pathname} (${Math.round(JSON.stringify(data).length / 1024)} KB of data)`)
