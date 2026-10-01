// Generates .cache/review/photos.html: every dex entry's chosen photo (the real square crop from public/breeds/)
// next to the other candidates. Clicking a candidate marks it as a swap; the page lists the swaps as text to copy.
// Open it straight from disk in a browser. Run after scripts/build-data.ts.
// Usage: node scripts/make-contact-sheet.ts
import { readFile, writeFile } from 'node:fs/promises'
import type { Breed, Group } from '../src/data/types.ts'
import type { Candidate, PhotoPick } from './lib/photos.ts'

const read = async <T>(p: string): Promise<T> => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8')) as T
const { groups, breeds } = await read<{ groups: Group[]; breeds: Breed[] }>('../src/data/breeds.json')
const picks = (await read<{ picks: Record<string, PhotoPick> }>('../data/photo-picks.json')).picks
const candidates = await read<Record<string, Candidate[]>>('../.cache/photo-candidates.json')

const esc = (s: string) => s.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`)

const sections = groups
  .map((g) => {
    const cards = breeds
      .filter((b) => b.groupId === g.id)
      .map((b) => {
        const pick = picks[b.id]
        const alts = (candidates[b.id] ?? []).filter((c) => c.file !== pick?.file).slice(0, 7)
        const chosen = b.image
          ? `<img class="chosen" src="../../public${esc(b.image.grid)}" alt="">`
          : `<div class="chosen none">No photo</div>`
        const altHtml = alts
          .map(
            (c, i) =>
              `<button class="alt" data-id="${b.id}" data-file="${esc(c.file)}" title="${esc(c.file)} (${c.width}x${c.height}, ${esc(c.licence)})"><img src="${esc(c.thumb330)}" loading="lazy" alt=""><span>${i + 1}</span></button>`,
          )
          .join('')
        return `<article id="${b.id}"><header><b>${b.dexNo}</b> ${esc(b.name)}</header><div class="row">${chosen}<div class="alts">${altHtml}</div></div>${pick?.note ? `<p class="note">${esc(pick.note)}</p>` : ''}</article>`
      })
      .join('')
    return `<h2>${esc(g.name)}</h2><div class="grid">${cards}</div>`
  })
  .join('')

const html = `<!doctype html><meta charset="utf-8"><title>Dogdex photo review</title>
<style>
  body { font: 14px/1.4 -apple-system, system-ui, sans-serif; margin: 0 24px 160px; background: #f6f5f2; color: #222 }
  h1 { margin: 24px 0 4px } h2 { margin: 32px 0 8px; border-bottom: 2px solid #1a3d2b }
  .intro { max-width: 70ch; color: #555 }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(430px, 1fr)); gap: 12px }
  article { background: #fff; border-radius: 10px; padding: 10px; box-shadow: 0 1px 2px #0002 }
  header { margin-bottom: 6px } .row { display: flex; gap: 8px }
  .chosen { width: 160px; height: 160px; border-radius: 8px; object-fit: cover; flex: none; outline: 3px solid #1a3d2b }
  .none { display: grid; place-items: center; background: #eee; color: #888 }
  .alts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; align-content: start }
  .alt { position: relative; padding: 0; border: 2px solid transparent; border-radius: 6px; background: none; cursor: pointer; aspect-ratio: 1; overflow: hidden }
  .alt img { width: 100%; height: 100%; object-fit: cover; display: block }
  .alt span { position: absolute; top: 2px; left: 4px; color: #fff; text-shadow: 0 0 3px #000; font-weight: 600 }
  .alt.on { border-color: #e2672b } .note { margin: 6px 0 0; color: #777; font-size: 12px }
  #changes { position: fixed; left: 0; right: 0; bottom: 0; background: #1a3d2b; color: #fff; padding: 12px 24px; display: flex; gap: 12px; align-items: center }
  #changes textarea { flex: 1; height: 64px; font: 12px ui-monospace, monospace }
</style>
<h1>Dogdex photo review</h1>
<p class="intro">The big image on each card is the square crop the app will show. If you prefer one of the alternatives, click it (click again to undo). When you're done, copy the text at the bottom and paste it back to Claude. For a crop that cuts off the dog, just say which breed.</p>
${sections}
<div id="changes"><b>Swaps</b><textarea id="out" readonly placeholder="Click an alternative photo to swap it in"></textarea><button id="copy">Copy</button></div>
<script>
  const swaps = new Map()
  const out = document.getElementById('out')
  document.addEventListener('click', (e) => {
    const alt = e.target.closest('.alt')
    if (!alt) return
    const { id, file } = alt.dataset
    const already = swaps.get(id) === file
    document.querySelectorAll('.alt[data-id="' + id + '"]').forEach((el) => el.classList.remove('on'))
    if (already) swaps.delete(id)
    else { swaps.set(id, file); alt.classList.add('on') }
    out.value = [...swaps].map(([id, file]) => id + ': ' + file).join('\\n')
  })
  document.getElementById('copy').onclick = () => { out.select(); navigator.clipboard?.writeText(out.value) }
</script>`

await writeFile(new URL('../.cache/review/photos.html', import.meta.url), html)
console.log('Wrote .cache/review/photos.html')
