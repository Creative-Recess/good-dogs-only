// Maps every dex entry to its English Wikipedia article and Wikidata item, the starting point for photos.
// Tries the display name (or a title from data/wiki-overrides.json), follows redirects, and checks the
// Wikidata item really is a dog breed or crossbreed. Writes data/wiki-map.json and lists anything unresolved.
// Usage: node scripts/map-wikipedia.ts
import { readFile, writeFile } from 'node:fs/promises'
import { buildBreedList } from './lib/dataset.ts'
import { politeFetchJson } from './lib/http.ts'

/** Wikidata "instance of" values we accept: dog breed, dog crossbreed, dog type, dog variety. */
const DOG_CLASSES = ['Q39367', 'Q38547', 'Q38672', 'Q15852455']

type Override = { title: string | null; note?: string }
type WikiPage = {
  title: string
  missing?: boolean
  pageprops?: { wikibase_item?: string; disambiguation?: string }
}
type WikiQuery = {
  query: { pages: WikiPage[]; redirects?: { from: string; to: string }[]; normalized?: { from: string; to: string }[] }
}
type Claim = { mainsnak: { datavalue?: { value: string | { id: string } } } }
type Entities = { entities: Record<string, { claims?: Record<string, Claim[]> }> }

const overridesUrl = new URL('../data/wiki-overrides.json', import.meta.url)
const overrides: Record<string, Override> = JSON.parse(await readFile(overridesUrl, 'utf8')).breeds

const breeds = buildBreedList()
const wanted = breeds.map((b) => ({ id: b.id, title: b.id in overrides ? overrides[b.id].title : b.name }))

const chunk = <T>(xs: T[], n: number) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n))

// 1. Resolve titles (with redirects) to pages and Wikidata ids, 50 per request.
const pageByTitle = new Map<string, { title: string; qid: string | null; problem: string | null }>()
for (const batch of chunk([...new Set(wanted.flatMap((w) => (w.title ? [w.title] : [])))], 50)) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    redirects: '1',
    prop: 'pageprops',
    ppprop: 'wikibase_item|disambiguation',
    titles: batch.join('|'),
  })
  const res = await politeFetchJson<WikiQuery>(`https://en.wikipedia.org/w/api.php?${params}`)
  const hop = new Map<string, string>()
  for (const r of [...(res.query.normalized ?? []), ...(res.query.redirects ?? [])]) hop.set(r.from, r.to)
  const pages = new Map(res.query.pages.map((p) => [p.title, p]))
  for (const asked of batch) {
    let t = asked
    for (let i = 0; i < 5 && hop.has(t); i++) t = hop.get(t)!
    const page = pages.get(t)
    const problem = !page || page.missing ? 'no such article' : page.pageprops?.disambiguation !== undefined ? 'disambiguation page' : null
    pageByTitle.set(asked, { title: t, qid: page?.pageprops?.wikibase_item ?? null, problem })
  }
}

// 2. Fetch Wikidata claims: instance of (P31), image (P18), Commons category (P373).
const qids = [...new Set([...pageByTitle.values()].flatMap((p) => (p.qid ? [p.qid] : [])))]
const claimsByQid = new Map<string, Record<string, Claim[]>>()
for (const batch of chunk(qids, 50)) {
  const params = new URLSearchParams({ action: 'wbgetentities', format: 'json', props: 'claims', ids: batch.join('|') })
  const res = await politeFetchJson<Entities>(`https://www.wikidata.org/w/api.php?${params}`)
  for (const [qid, e] of Object.entries(res.entities)) claimsByQid.set(qid, e.claims ?? {})
}
const values = (claims: Record<string, Claim[]> | undefined, prop: string) =>
  (claims?.[prop] ?? []).flatMap((c) => {
    const v = c.mainsnak.datavalue?.value
    return v === undefined ? [] : [typeof v === 'string' ? v : v.id]
  })

// 3. Assemble the map and report anything that needs a human decision.
const map: Record<string, unknown> = {}
const problems: string[] = []
for (const w of wanted) {
  if (w.title === null) {
    map[w.id] = { title: null, note: overrides[w.id].note }
    continue
  }
  const page = pageByTitle.get(w.title)!
  const claims = page.qid ? claimsByQid.get(page.qid) : undefined
  const instanceOf = values(claims, 'P31')
  const isDog = instanceOf.some((q) => DOG_CLASSES.includes(q))
  if (page.problem) problems.push(`${w.id}: "${w.title}" -> ${page.problem}`)
  else if (!isDog && !overrides[w.id]?.note)
    problems.push(`${w.id}: "${w.title}" -> "${page.title}" (${page.qid}) is not a dog breed: P31=${instanceOf.join(',')}`)
  map[w.id] = {
    title: page.title,
    qid: page.qid,
    commonsCategory: values(claims, 'P373')[0] ?? null,
    wikidataImages: values(claims, 'P18'),
  }
}

await writeFile(new URL('../data/wiki-map.json', import.meta.url), JSON.stringify(map, null, 2) + '\n')
const mapped = Object.values(map).filter((m) => (m as { title: string | null }).title).length
console.log(`Mapped ${mapped} of ${wanted.length} entries; ${problems.length} need attention`)
for (const p of problems) console.log(`  - ${p}`)
if (problems.length) process.exitCode = 1
