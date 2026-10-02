// The breed review page: for every breed, its photos, its silhouette in each theme and its Park dog, plus
// automatic checks that point out what might need a better photo or shape. Uses the app's own data and drawing code.
import { breeds, GROUP_COLOUR, groupById, groups } from '../src/data/catalogue.ts'
import type { Breed } from '../src/data/types.ts'
import { bodyOf, drawDog, type Dog, type DogState } from '../src/park/dog.ts'
import { THEMES } from '../src/theme/themes.ts'
import reviewed from './reviewed.json' with { type: 'json' }
import factsFile from '../data/breed-facts.json' with { type: 'json' }
import { countryName } from '../src/data/countries.ts'
import { range, weightClass } from '../src/data/facts.ts'

const factSources = factsFile.breeds as Record<string, { src?: string }>

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!

/** What the dog's shape (mask) says about the photo. */
type MaskReport = { coverage: number; edge: number; dogs: number }

/** Reads a mask's alpha at 64x64: how much of the square is dog, how much of the border it touches, and how many separate dogs. */
async function readMask(url: string): Promise<MaskReport> {
  const img = new Image()
  img.src = url
  await img.decode()
  const S = 64
  const c = document.createElement('canvas')
  c.width = c.height = S
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.drawImage(img, 0, 0, S, S)
  const a = x.getImageData(0, 0, S, S).data
  const on = (i: number) => a[i * 4 + 3] > 128
  let count = 0
  let border = 0
  for (let i = 0; i < S * S; i++) {
    if (!on(i)) continue
    count++
    const px = i % S
    const py = Math.floor(i / S)
    if (px === 0 || py === 0 || px === S - 1 || py === S - 1) border++
  }
  // Separate dogs: connected blobs bigger than 4% of the square.
  const seen = new Uint8Array(S * S)
  let dogs = 0
  for (let i = 0; i < S * S; i++) {
    if (!on(i) || seen[i]) continue
    let size = 0
    const stack = [i]
    seen[i] = 1
    while (stack.length) {
      const j = stack.pop()!
      size++
      const jx = j % S
      for (const k of [j - S, j + S, jx > 0 ? j - 1 : -1, jx < S - 1 ? j + 1 : -1])
        if (k >= 0 && k < S * S && !seen[k] && on(k)) {
          seen[k] = 1
          stack.push(k)
        }
    }
    if (size > S * S * 0.04) dogs++
  }
  return { coverage: count / (S * S), edge: border / (S * 4 - 4), dogs }
}

function checks(b: Breed, m: MaskReport): string[] {
  const out: string[] = []
  const inPhoto = b.image?.dogs ?? 0
  if (inPhoto >= 2) out.push(`${inPhoto} dogs in the photo`)
  else if (b.image?.dogs === 0) out.push("Vision couldn't find a dog in the photo (a close-up or busy background?)")
  else if (m.dogs > 1) out.push(`${m.dogs} dogs in the silhouette, so it's a blob`)
  if (m.coverage > 0.6) out.push('silhouette fills most of the square (background may be included)')
  if (m.edge > 0.45) out.push('dog runs off the edges of the grid crop')
  if (m.coverage < 0.05) out.push('dog is tiny in the grid crop')
  if (b.image && b.image.width < 640) out.push(`small photo (${b.image.width}px wide)`)
  if (!b.facts) out.push('no breed facts')
  return out
}

/** Draws the breed's Park dog standing and sitting, at the Park's middle distance, twice the size for review. */
function drawParkDog(canvas: HTMLCanvasElement, b: Breed) {
  const W = 230
  const H = 120
  const dpr = Math.min(2, devicePixelRatio || 1)
  canvas.width = W * dpr
  canvas.height = H * dpr
  const x = canvas.getContext('2d')!
  x.scale(dpr, dpr)
  x.fillStyle = '#86c35f'
  x.fillRect(0, 0, W, H)
  const dog = (state: DogState): Dog => ({
    breed: b, shape: b.shape,
    seed: 2, x: 0, y: 0, dir: 1, state, timer: 0, hop: 0, happy: state === 'idle' ? 1 : 0, scale: 1, tx: 0, ty: 0, toSpot: false, friend: null, leaving: false,
  })
  for (const [cx, state] of [[W * 0.28, 'idle'], [W * 0.74, 'sit']] as const) {
    x.save()
    x.translate(cx - bodyOf(b.shape).len * 0.4, H - 16)
    x.scale(2, 2)
    drawDog(x, dog(state), 0)
    x.restore()
  }
}

/** The breed's facts as the breed window shows them, with the weight class spelled out and the source to check against. */
function factsLine(b: Breed): string {
  const f = b.facts
  if (!f) return '<p class="facts missing">No breed facts yet</p>'
  const src = factSources[b.id]?.src
  return `<p class="facts"><b>${range(f.kg)} kg</b> (${weightClass(f.kg).name}) · <b>${range(f.life)} yrs</b> · <b>${esc(countryName(f.origin))}</b> <code>${f.origin}</code> · ${esc(f.job)}${src ? ` · <a href="${esc(src)}" target="_blank" rel="noopener">source</a>` : ''}</p>`
}

function card(b: Breed): string {
  const g = groupById.get(b.groupId)!
  const [fx, fy] = b.image?.focus ?? [0.5, 0.5]
  const fromDA = b.credit?.author === 'Dogs Australia'
  const s = b.shape
  const sils = THEMES.map(
    (t) => `<figure><span class="tile"><span class="sil" data-tint="${t.id}"><span class="sil-glow"><span class="sil-dog" style="--mask:url(${b.image?.mask})"></span></span></span></span><figcaption>${t.label}</figcaption></figure>`,
  ).join('')
  return `<article class="breed" id="${b.id}" data-group="${b.groupId}" data-source="${fromDA ? 'da' : 'other'}" data-name="${esc(`${b.name} ${b.aliases.join(' ')} ${b.dexNo}`.toLowerCase())}">
    <header>
      <span class="dex" style="background:${GROUP_COLOUR[b.groupId]}">${b.dexNo}</span>
      <h2>${esc(b.name)}</h2>
      <span class="meta">${esc(g.name)}</span>
      <span class="flags"></span>
    </header>
    <div class="row">
      <figure><span class="tile"><img src="${b.image?.grid}" alt="" loading="lazy"></span><figcaption>Grid</figcaption></figure>
      <figure class="wide"><span class="tile wide"><img src="${b.image?.detail}" alt="" loading="lazy" style="object-position:${fx * 100}% ${fy * 100}%"></span><figcaption>Breed page</figcaption></figure>
      ${sils}
      <figure class="park"><canvas width="230" height="120" aria-label="Park dog"></canvas><figcaption>Park: ${s.size} · ${s.build.replace('_', ' ')} · snout ${s.snout} · ${s.ears} ears · ${s.tail} tail · ${s.coat} coat · ${s.colour}${s.markings === 'solid' ? '' : ` ${s.markings.replace('_', ' ')}`}${s.mask ? ' · mask' : ''}</figcaption></figure>
    </div>
    <p class="about"><b>${b.traits.map(esc).join(' · ')}</b> ${esc(b.text)}</p>
    ${factsLine(b)}
    <p class="source">Photo: ${fromDA ? 'Dogs Australia' : esc(b.credit?.author ?? 'none')}${b.credit?.sourceUrl ? ` · <a href="${esc(b.credit.sourceUrl)}" target="_blank" rel="noopener">source</a>` : ''} · <code>${b.id}</code></p>
  </article>`
}

const list = $('#list')
list.innerHTML = breeds.map(card).join('')
$<HTMLSelectElement>('#group').innerHTML = `<option value="all">All groups</option>` + groups.map((g) => `<option value="${g.id}">${esc(g.name)}</option>`).join('')

// Park dogs: draw each one as it scrolls into view (239 canvases at once is slow).
const seen = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue
    const el = e.target as HTMLElement
    seen.unobserve(el)
    drawParkDog(el.querySelector('canvas')!, breeds.find((b) => b.id === el.id)!)
  }
}, { rootMargin: '400px' })
list.querySelectorAll('.breed').forEach((el) => seen.observe(el))

// Checks, from each mask.
const flagged = new Set<string>()
await Promise.all(
  breeds.map(async (b) => {
    if (!b.image) return
    const found = checks(b, await readMask(b.image.mask))
    if (!found.length) return
    // Already looked at (review/reviewed.json): show what was decided instead of asking again.
    const decided = (reviewed.breeds as Record<string, string>)[b.id]
    if (decided) {
      $(`#${CSS.escape(b.id)} .flags`).innerHTML = `<span class="flag done" title="${esc(found.join('; '))}">Checked</span><span class="why done">${esc(decided)}</span>`
      return
    }
    flagged.add(b.id)
    $(`#${CSS.escape(b.id)} .flags`).innerHTML = `<span class="flag" title="${esc(found.join('; '))}">Check</span><span class="why">${esc(found.join('; '))}</span>`
  }),
)

function filter() {
  const q = $<HTMLInputElement>('#q').value.trim().toLowerCase()
  const group = $<HTMLSelectElement>('#group').value
  const onlyFlagged = $<HTMLInputElement>('#flagged').checked
  const source = $<HTMLSelectElement>('#source').value
  let shown = 0
  for (const el of list.querySelectorAll<HTMLElement>('.breed')) {
    const show = (!q || el.dataset.name!.includes(q)) && (group === 'all' || el.dataset.group === group) && (!onlyFlagged || flagged.has(el.id)) && (source === 'all' || el.dataset.source === source)
    el.hidden = !show
    if (show) shown++
  }
  $('#count').textContent = `${shown} of ${breeds.length} breeds · ${flagged.size} to check`
}
for (const id of ['#q', '#group', '#source', '#flagged']) $(id).addEventListener('input', filter)
filter()
document.body.dataset.ready = '1'

// ---------- Photo options: candidates to choose between, when there are any ----------
// Written by a photo search into .cache/photo-options/ (not committed): options.json plus <id>-<label>.jpg per option.
type PhotoOption = { label: string; file: string; focus: [number, number]; licence: string; author: string; note: string }
const OPTIONS_DIR = '/.cache/photo-options'

async function showOptions() {
  const res = await fetch(`${OPTIONS_DIR}/options.json`).catch(() => null)
  // No options yet: the dev server answers with the app's page instead, so check it's really JSON.
  if (!res?.ok || !res.headers.get('content-type')?.includes('json')) return
  const options: Record<string, PhotoOption[]> = await res.json()
  const chosen = new Map<string, string>()
  const crops = (src: string, [fx, fy]: [number, number]) =>
    `<span class="tile"><img src="${src}" alt="" style="object-position:${fx * 100}% ${fy * 100}%"></span><span class="tile wide"><img src="${src}" alt="" style="object-position:${fx * 100}% ${fy * 100}%"></span>`
  $('#option-list').innerHTML = Object.entries(options)
    .map(([id, opts]) => {
      const b = breeds.find((x) => x.id === id)
      if (!b) return ''
      const current = `<label class="option"><input type="radio" name="opt-${id}" value="keep"><span class="crops">${crops(b.image!.detail, b.image!.focus)}</span><b>Keep current</b></label>`
      const rest = opts
        .map((o) => `<label class="option"><input type="radio" name="opt-${id}" value="${o.label}"><span class="crops">${crops(`${OPTIONS_DIR}/${id}-${o.label}.jpg`, o.focus)}</span><b>${o.label}</b><small>${esc(o.note)}</small><small>${esc(o.author)} · ${esc(o.licence)}</small></label>`)
        .join('')
      return `<article class="breed"><header><span class="dex" style="background:${GROUP_COLOUR[b.groupId]}">${b.dexNo}</span><h2>${esc(b.name)}</h2></header><div class="row">${current}${rest}</div></article>`
    })
    .join('')
  $('#options').hidden = false
  const update = () => {
    $<HTMLTextAreaElement>('#picks').value = [...chosen].map(([id, label]) => `${breeds.find((b) => b.id === id)!.dexNo} ${label}`).join(', ')
  }
  $('#option-list').addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement
    const id = input.name.replace('opt-', '')
    chosen.set(id, input.value)
    update()
  })
  $('#copy-picks').addEventListener('click', () => {
    const box = $<HTMLTextAreaElement>('#picks')
    navigator.clipboard?.writeText(box.value).catch(() => box.select())
  })
}
void showOptions()
