// Builds a review page of every breed's Park dog next to its photo: .cache/design/dog-review.html.
// Needs the dev server running: pnpm dev --port 5174, then node design/make-dog-review.ts
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { webkit } from '@playwright/test'
import sharp from 'sharp'
import data from '../src/data/breeds.json' with { type: 'json' }
import type { Breed, Group } from '../src/data/types.ts'

const root = new URL('../', import.meta.url)
const breeds = data.breeds as Breed[]
const groups = data.groups as Group[]
const browser = await webkit.launch()
const page = await browser.newPage()
await page.goto('http://localhost:5174/design/dog-review.html')
await page.waitForSelector('body[data-ready="1"]')
const drawings: Record<string, string> = await page.evaluate(() =>
  Object.fromEntries([...document.querySelectorAll('canvas')].map((c) => [c.dataset.id!, c.toDataURL('image/webp', 0.85)])),
)
await browser.close()

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const photo = async (b: Breed) =>
  `data:image/webp;base64,${(await sharp(await readFile(new URL(`public${b.image!.grid}`, root))).resize(110).webp({ quality: 60 }).toBuffer()).toString('base64')}`
const card = async (b: Breed) => {
  const s = b.shape
  return `<figure id="${b.id}"><div class="pair"><img src="${drawings[b.id]}" alt="Park dog for ${esc(b.name)}"><img class="ph" src="${await photo(b)}" alt=""></div>
  <figcaption><b>${esc(b.name)}</b><small>${b.dexNo} &middot; len ${s.len}, legs ${s.leg}, snout ${s.snout}, ${s.ears} ears, ${s.tail} tail${s.fluff ? `, fluff ${s.fluff}` : ''}</small></figcaption></figure>`
}
const sections = []
for (const g of groups) {
  const inGroup = breeds.filter((b) => b.groupId === g.id)
  sections.push(`<section><h2>${esc(g.name)} &middot; ${inGroup.length}</h2><div class="grid">${(await Promise.all(inGroup.map(card))).join('')}</div></section>`)
}
const html = `<title>Park Dog Shapes</title>
<style>
  :root { --bg: #eef3ea; --panel: #fff; --ink: #1d261f; --muted: #627064; --line: #d9e1d4; --accent: #2f6b39; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { color-scheme: dark; --bg: #141a15; --panel: #1d241e; --ink: #e6ece5; --muted: #9aa89b; --line: #2f3a30; --accent: #8fd29a; } }
  :root[data-theme="dark"] { color-scheme: dark; --bg: #141a15; --panel: #1d241e; --ink: #e6ece5; --muted: #9aa89b; --line: #2f3a30; --accent: #8fd29a; }
  body { background: var(--bg); color: var(--ink); font: 15px/1.5 -apple-system, system-ui, sans-serif; padding-inline: 16px; padding-block: 28px 60px; }
  main { max-width: 1200px; margin: 0 auto; display: grid; gap: 32px; }
  h1 { font-size: 28px; margin: 0 0 6px; }
  header p { margin: 0; color: var(--muted); max-width: 66ch; }
  h2 { font-size: 18px; margin: 0 0 12px; color: var(--accent); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
  figure { margin: 0; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
  .pair { display: grid; grid-template-columns: 150fr 110fr; }
  .pair img { width: 100%; height: 100%; display: block; object-fit: cover; aspect-ratio: 150 / 110; }
  figcaption { padding: 6px 9px 9px; display: grid; gap: 1px; }
  figcaption b { font-size: 13px; }
  figcaption small { font-size: 11.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
</style>
<main>
  <header>
    <h1>Park dog shapes</h1>
    <p>How each of the ${breeds.length} breeds is drawn in the Park, next to its photo. Colours come from the photo; the shape (body length, legs, snout, ears, tail, fluff) is set per breed. Comment on any dog that looks wrong for its breed.</p>
  </header>
  ${sections.join('\n')}
</main>`
await mkdir(new URL('.cache/design/', root), { recursive: true })
await writeFile(new URL('.cache/design/dog-review.html', root), html)
console.log(`Wrote .cache/design/dog-review.html (${Math.round(html.length / 1024)} KB)`)
