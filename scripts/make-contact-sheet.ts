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
        const tier = !b.image || pick?.confidence === 'low' ? 'review' : pick?.confidence === 'medium' ? 'dodgy' : 'good'
        return `<article id="${b.id}" data-tier="${tier}"><header><b>${b.dexNo}</b> ${esc(b.name)}</header><div class="row">${chosen}<div class="alts">${altHtml}</div></div>${pick?.note ? `<p class="note">${esc(pick.note)}</p>` : ''}<input class="url" type="url" data-id="${b.id}" placeholder="Or paste a photo link (Wikimedia Commons works best)"></article>`
      })
      .join('')
    return `<section class="group"><h2>${esc(g.name)}</h2><div class="grid">${cards}</div></section>`
  })
  .join('')

const html = `<!doctype html><meta charset="utf-8"><title>Good Dogs Only photo review</title>
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
  .tabs { display: flex; gap: 6px; margin: 16px 0 6px; position: sticky; top: 0; background: #f6f5f2; padding: 8px 0; z-index: 2 }
  .tabs button { font: 600 14px -apple-system, system-ui, sans-serif; padding: 8px 14px; border-radius: 999px; border: 1px solid #1a3d2b; background: #fff; color: #1a3d2b; cursor: pointer }
  .tabs button[aria-selected="true"] { background: #1a3d2b; color: #fff }
  .tabs span { opacity: 0.7; font-weight: 400 }
  .tab-help { margin: 0 0 4px; color: #555 }
  [data-tier="review"] .note, [data-tier="dodgy"] .note { color: #8a4b00 }
  .url { width: 100%; margin-top: 8px; font: 13px -apple-system, system-ui, sans-serif; padding: 7px 9px; border: 1px solid #ccc; border-radius: 6px }
  .url:not(:placeholder-shown) { border-color: #e2672b; background: #fff8f3 }
  #changes { position: fixed; left: 0; right: 0; bottom: 0; background: #1a3d2b; color: #fff; padding: 12px 24px; display: flex; gap: 12px; align-items: center }
  #changes textarea { flex: 1; height: 64px; font: 12px ui-monospace, monospace }
</style>
<h1>Good Dogs Only photo review</h1>
<nav class="tabs" role="tablist">
  <button type="button" data-tab="review" aria-selected="true">Please review <span></span></button>
  <button type="button" data-tab="dodgy" aria-selected="false">A bit dodgy <span></span></button>
  <button type="button" data-tab="all" aria-selected="false">All <span></span></button>
</nav>
<p class="tab-help" data-for="review">My weakest picks, plus the one breed with no free photo at all. These most need your eye.</p>
<p class="tab-help" data-for="dodgy" hidden>Usable, but each has a flaw (lying down, handler in shot, low resolution). The note on each card says what.</p>
<p class="tab-help" data-for="all" hidden>Every breed, in dex order.</p>
<p class="intro">The big image on each card is the square crop the app will show. If you prefer one of the alternatives, click it (click again to undo). When you're done, copy the text at the bottom and paste it back to Claude. For a crop that cuts off the dog, just say which breed.</p>
${sections}
<div id="changes"><b>Swaps</b><textarea id="out" readonly placeholder="Click an alternative photo, or paste a link on a card"></textarea><button id="copy">Copy</button></div>
<script>
  const tiers = { review: '[data-tier="review"]', dodgy: '[data-tier="dodgy"]', all: 'article' }
  document.querySelectorAll('.tabs button').forEach((b) => (b.querySelector('span').textContent = document.querySelectorAll(tiers[b.dataset.tab]).length))
  function showTab(tab) {
    document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)))
    document.querySelectorAll('.tab-help').forEach((p) => (p.hidden = p.dataset.for !== tab))
    document.querySelectorAll('article').forEach((a) => (a.hidden = !a.matches(tiers[tab])))
    document.querySelectorAll('section.group').forEach((sec) => (sec.hidden = !sec.querySelector('article:not([hidden])')))
  }
  document.querySelector('.tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) showTab(b.dataset.tab) })
  showTab('review')
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
    render()
  })
  const urls = new Map()
  document.addEventListener('input', (e) => {
    if (!e.target.matches('.url')) return
    const v = e.target.value.trim()
    if (v) urls.set(e.target.dataset.id, v)
    else urls.delete(e.target.dataset.id)
    render()
  })
  function render() {
    out.value = [...[...swaps].map(([id, file]) => id + ': ' + file), ...[...urls].map(([id, url]) => id + ': fetch ' + url)].join('\\n')
  }
  document.getElementById('copy').onclick = () => { out.select(); navigator.clipboard?.writeText(out.value) }
</script>`

await writeFile(new URL('../.cache/review/photos.html', import.meta.url), html)
console.log('Wrote .cache/review/photos.html')
