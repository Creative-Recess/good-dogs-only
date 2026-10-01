// Prototype: ways to show a breed you haven't seen yet, Pokedex style, from each photo's dog mask.
// Masks come from scripts/vision/mask.swift (Apple Vision, on this Mac) into .cache/silhouettes/.
// Usage: node design/make-silhouettes.ts  -> .cache/design/silhouettes.html
import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import data from '../src/data/breeds.json' with { type: 'json' }
import type { Breed } from '../src/data/types.ts'

const IDS = ['affenpinscher', 'staffordshire-bull-terrier', 'labrador-retriever', 'dachshund', 'border-collie', 'pug', 'afghan-hound', 'cavoodle', 'french-bulldog', 'great-dane', 'bichon-frise', 'australian-cattle-dog']
const SIZE = 200
const root = new URL('../', import.meta.url)
const breeds = data.breeds as Breed[]

type Rgba = [number, number, number, number]
/** Draws a tile from the mask: fill for the dog, a ring around its edge, and a background. */
async function render(mask: Uint8Array, photo: Uint8Array, style: (inside: number, edge: number, px: Rgba, x: number, y: number) => Rgba) {
  const out = Buffer.alloc(SIZE * SIZE * 4)
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= SIZE || y >= SIZE ? 0 : mask[y * SIZE + x] / 255)
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const inside = at(x, y)
      // Distance-ish edge: inside pixels with an outside neighbour within 3px, or outside pixels next to the dog.
      let edge = 0
      for (let dy = -3; dy <= 3 && !edge; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 9 && Math.abs(at(x + dx, y + dy) - inside) > 0.5) { edge = 1; break }
      const i = (y * SIZE + x) * 4
      const px: Rgba = [photo[i], photo[i + 1], photo[i + 2], 255]
      const [r, g, b, a] = style(inside, edge, px, x, y)
      const clamp = (v: number) => Math.max(0, Math.min(255, v))
      out[i] = clamp(r); out[i + 1] = clamp(g); out[i + 2] = clamp(b); out[i + 3] = clamp(a)
    }
  return `data:image/webp;base64,${(await sharp(out, { raw: { width: SIZE, height: SIZE, channels: 4 } }).webp({ quality: 82 }).toBuffer()).toString('base64')}`
}
const mix = (a: number[], b: number[], t: number) => a.map((v, k) => Math.round(v + (b[k] - v) * t))

const STYLES: { name: string; note: string; draw: Parameters<typeof render>[2] }[] = [
  { name: 'Grey photo', note: 'What the app does now.', draw: (_i, _e, p) => { const l = Math.round(0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2]); const v = Math.round(l * 0.72 + 255 * 0.28 * 1.04); return [v, v, v, 255] } },
  { name: 'Silhouette', note: '"Who\'s that dog?": a solid dark shape on a light ground.', draw: (i) => (i > 0.5 ? [38, 46, 70, 255] : [236, 240, 246, 255]) },
  { name: 'Outline', note: 'Just the shape\'s edge, like a colouring book.', draw: (i, e) => (e ? [40, 48, 72, 255] : i > 0.5 ? [255, 255, 255, 255] : [244, 246, 250, 255]) },
  { name: 'Pokedex', note: 'Dark silhouette with a glowing rim on a blue spotlight.', draw: (i, e, _p, x, y) => { if (e && i <= 0.5) return [170, 220, 255, 255]; if (i > 0.5) return [16, 22, 44, 255]; const d = Math.hypot(x - SIZE / 2, y - SIZE / 2) / (SIZE * 0.7); return [...mix([120, 180, 245], [30, 70, 150], Math.min(1, d)), 255] as Rgba } },
  { name: 'Ghost', note: 'A faint photo inside an outline, so you can still tell the colouring.', draw: (i, e, p) => { if (e) return [60, 70, 95, 255]; if (i > 0.5) { const l = Math.round(0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2]); const v = Math.round(200 + l * 0.2); return [v, v, Math.min(255, v + 6), 255] } return [248, 249, 252, 255] } },
  { name: 'Blueprint', note: 'White outline on blueprint paper with a faint grid.', draw: (i, e, _p, x, y) => { if (e) return [235, 244, 255, 255]; const grid = x % 20 === 0 || y % 20 === 0; const base = [34, 86, 160]; return [...(grid ? mix(base, [255, 255, 255], 0.12) : i > 0.5 ? mix(base, [255, 255, 255], 0.06) : base), 255] as Rgba } },
]

const rows: string[] = []
for (const id of IDS) {
  const b = breeds.find((x) => x.id === id)!
  const mask = new Uint8Array(await sharp(new URL(`.cache/silhouettes/${id}-mask.png`, root).pathname).resize(SIZE, SIZE).greyscale().raw().toBuffer())
  const photo = new Uint8Array(await sharp(new URL(`public${b.image!.grid}`, root).pathname).resize(SIZE, SIZE).ensureAlpha().raw().toBuffer())
  const cells = await Promise.all(STYLES.map((s) => render(mask, photo, s.draw)))
  const real = `data:image/webp;base64,${(await sharp(new URL(`public${b.image!.grid}`, root).pathname).resize(SIZE, SIZE).webp({ quality: 80 }).toBuffer()).toString('base64')}`
  rows.push(`<tr><th scope="row">${b.name}</th>${cells.map((c) => `<td><img src="${c}" alt=""></td>`).join('')}<td><img src="${real}" alt=""></td></tr>`)
}
const html = `<title>Unseen Dog Styles</title>
<style>
  :root { --bg: #f1f3f7; --panel: #fff; --ink: #1b2233; --muted: #5d6779; --line: #dde2ea; --accent: #2b62c4; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { color-scheme: dark; --bg: #11151c; --panel: #1a2029; --ink: #e6eaf1; --muted: #9aa5b6; --line: #2c3442; --accent: #8db6ff; } }
  :root[data-theme="dark"] { color-scheme: dark; --bg: #11151c; --panel: #1a2029; --ink: #e6eaf1; --muted: #9aa5b6; --line: #2c3442; --accent: #8db6ff; }
  body { background: var(--bg); color: var(--ink); font: 15px/1.5 -apple-system, system-ui, sans-serif; padding-inline: 16px; padding-block: 28px 60px; }
  main { max-width: 1100px; margin: 0 auto; display: grid; gap: 20px; }
  h1 { margin: 0; font-size: 28px; }
  header p { margin: 4px 0 0; color: var(--muted); max-width: 70ch; }
  ol { margin: 0; padding-left: 20px; display: grid; gap: 4px; color: var(--muted); }
  ol b { color: var(--ink); }
  .scroll { overflow-x: auto; background: var(--panel); border: 1px solid var(--line); border-radius: 10px; }
  table { border-collapse: collapse; }
  th, td { padding: 6px; text-align: center; }
  thead th { font-size: 13px; position: sticky; top: 0; background: var(--panel); }
  tbody th { text-align: right; font-size: 13px; font-weight: 600; white-space: nowrap; padding-right: 10px; }
  td img { width: 96px; height: 96px; display: block; border-radius: 10px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); }
</style>
<main>
  <header>
    <h1>Unseen dog styles</h1>
    <p>Six ways to show a breed you haven't spotted yet, on 12 breeds, with the real photo (what you see once it's spotted) on the right. The dog shapes are cut out of each photo on this Mac by Apple's Vision framework, so the real app could do this for every breed at build time.</p>
  </header>
  <ol>${STYLES.map((s, i) => `<li><b>${i + 1}. ${s.name}:</b> ${s.note}</li>`).join('')}</ol>
  <div class="scroll"><table>
    <thead><tr><th></th>${STYLES.map((s, i) => `<th scope="col">${i + 1}. ${s.name}</th>`).join('')}<th scope="col">Spotted</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table></div>
</main>`
await writeFile(new URL('.cache/design/silhouettes.html', root), html)
console.log(`Wrote .cache/design/silhouettes.html (${Math.round(html.length / 1024)} KB)`)
