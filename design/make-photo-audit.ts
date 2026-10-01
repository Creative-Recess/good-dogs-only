// Builds a one-page audit of every breed photo the app ships, split into Dogs Australia photos and the rest.
// Images are inlined as data URIs so it publishes as a single self-contained page.
// Output: .cache/design/photo-audit.html
// Usage: node design/make-photo-audit.ts
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import type { PhotoPick } from '../scripts/lib/photos.ts'
import type { Breed } from '../src/data/types.ts'

const root = new URL('../', import.meta.url)
const readJson = async <T>(p: string): Promise<T> => JSON.parse(await readFile(new URL(p, root), 'utf8')) as T
const { breeds, groups } = await readJson<{ breeds: Breed[]; groups: { id: string; name: string }[] }>('src/data/breeds.json')
const picks = (await readJson<{ picks: Record<string, PhotoPick> }>('data/photo-picks.json')).picks
const groupName = Object.fromEntries(groups.map((g) => [g.id, g.name]))
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const img = async (p: string, width: number) =>
  `data:image/webp;base64,${(await sharp(await readFile(new URL(`public${p}`, root))).resize({ width, withoutEnlargement: true }).webp({ quality: 68 }).toBuffer()).toString('base64')}`

const isDA = (b: Breed) => b.credit?.author === 'Dogs Australia'
const official = breeds.filter(isDA)
const other = breeds.filter((b) => !isDA(b))

async function card(b: Breed, full: boolean) {
  const meta = `<span class="dex">${b.dexNo}</span> ${esc(groupName[b.groupId] ?? b.groupId)}`
  if (!full) return `<figure class="tile"><img src="${await img(b.image!.grid, 220)}" alt=""><figcaption><b>${esc(b.name)}</b><small>${meta}</small></figcaption></figure>`
  const c = b.credit!, note = picks[b.id]?.note ?? ''
  return `<article class="card" id="${b.id}">
    <img src="${await img(b.image!.detail, 640)}" alt="${esc(b.name)}" style="object-position:${b.image!.focus[0] * 100}% ${b.image!.focus[1] * 100}%">
    <div class="body">
      <h3>${esc(b.name)}</h3>
      <p class="meta">${meta}${b.tier === 'unofficial' ? '&nbsp;&middot; not an official breed' : '&nbsp;&middot; not on Dogs Australia browse pages'}</p>
      ${note ? `<p class="note">${esc(note)}</p>` : ''}
      <p class="credit">${esc(c.author)}&nbsp;&middot; ${esc(c.licence)}${c.sourceUrl ? `&nbsp;&middot; <a href="${esc(c.sourceUrl)}" target="_blank" rel="noopener">source</a>` : ''}</p>
    </div>
  </article>`
}

const html = `<title>Breed Photo Audit</title>
<style>
  :root { --bg: #f3f1ec; --panel: #fff; --ink: #1f2420; --muted: #66706a; --line: #dedad0; --accent: #1f5e8c; --tag: #e7eef4; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { color-scheme: dark; --bg: #151816; --panel: #1f2320; --ink: #e8ebe7; --muted: #9aa49d; --line: #333a35; --accent: #8cc2ea; --tag: #23303a; } }
  :root[data-theme="dark"] { color-scheme: dark; --bg: #151816; --panel: #1f2320; --ink: #e8ebe7; --muted: #9aa49d; --line: #333a35; --accent: #8cc2ea; --tag: #23303a; }
  body { background: var(--bg); color: var(--ink); font: 15px/1.5 -apple-system, system-ui, sans-serif; padding-inline: 16px; padding-block: 28px 60px; }
  main { max-width: 1180px; margin: 0 auto; display: grid; gap: 36px; }
  header h1 { font-size: 28px; margin: 0 0 6px; text-wrap: balance; }
  header p { margin: 0; color: var(--muted); max-width: 66ch; }
  .counts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .counts a { background: var(--tag); color: var(--accent); padding: 4px 10px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 13px; font-variant-numeric: tabular-nums; }
  h2 { font-size: 19px; margin: 0 0 4px; }
  section > p { margin: 0 0 16px; color: var(--muted); max-width: 66ch; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 16px; }
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; display: grid; grid-template-rows: auto 1fr; }
  .card img { width: 100%; aspect-ratio: 770 / 540; object-fit: cover; display: block; background: var(--line); }
  .card .body { padding: 10px 12px 12px; display: grid; gap: 4px; align-content: start; }
  .card h3 { margin: 0; font-size: 16px; }
  .card p { margin: 0; font-size: 13px; }
  .meta, .credit { color: var(--muted); }
  .note { font-style: italic; }
  .credit a { color: var(--accent); }
  .dex { font-variant-numeric: tabular-nums; font-weight: 700; color: var(--accent); }
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 10px; }
  .tile { margin: 0; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
  .tile img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; background: var(--line); }
  .tile figcaption { padding: 5px 7px 7px; display: grid; gap: 1px; }
  .tile b { font-size: 12px; line-height: 1.25; overflow-wrap: anywhere; }
  .tile small { font-size: 11px; color: var(--muted); }
</style>
<main>
  <header>
    <h1>Breed photo audit</h1>
    <p>Every photo Good Dogs Only ships, split by where it came from. The ones not from Dogs Australia are in their own section after them, shown larger with where each one came from. Leave a comment on any photo you want swapped.</p>
    <div class="counts"><a href="#official">${official.length} Dogs Australia photos</a><a href="#other">${other.length} other photos</a></div>
  </header>
  <section id="official">
    <h2>Dogs Australia photos&nbsp;&middot; ${official.length}</h2>
    <p>From the Dogs Australia browse-a-breed pages. Shown as the square crop used on the Breeds grid.</p>
    <div class="tiles">${(await Promise.all(official.map((b) => card(b, false)))).join('')}</div>
  </section>
  <section id="other">
    <h2>Other photos&nbsp;&middot; ${other.length}</h2>
    <p>${other.filter((b) => b.tier !== 'unofficial').length} official breeds that Dogs Australia's browse pages don't have, and the ${other.filter((b) => b.tier === 'unofficial').length} bonus breeds. All from Wikimedia Commons. Shown cropped exactly as on the breed page, with the note from when each one was picked.</p>
    <div class="cards">${(await Promise.all(other.map((b) => card(b, true)))).join('')}</div>
  </section>
</main>`
await mkdir(new URL('.cache/design/', root), { recursive: true })
const out = new URL('.cache/design/photo-audit.html', root)
await writeFile(out, html)
console.log(`Wrote ${out.pathname} (${Math.round(html.length / 1024)} KB): ${official.length} Dogs Australia, ${other.length} other`)
