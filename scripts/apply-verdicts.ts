// Turns reviewers' tile choices into file picks in data/photo-picks.json, using the round's sheet index.
// Never overwrites a pick Justin made. Reports any photo picked for two entries.
// Usage: node scripts/apply-verdicts.ts <round> <verdicts.json> [more.json ...]
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import type { PhotoPick, Verdict } from './lib/photos.ts'

const [round, ...verdictFiles] = process.argv.slice(2)
if (!round || verdictFiles.length === 0) throw new Error('Usage: node scripts/apply-verdicts.ts <round> <verdicts.json> ...')
const readJson = async <T>(path: string | URL): Promise<T> => JSON.parse(await readFile(path, 'utf8')) as T

const index = await readJson<Record<string, { tiles: { n: number; file: string }[] }>>(new URL(`../.cache/review/${round}/index.json`, import.meta.url))
const picksPath = new URL('../data/photo-picks.json', import.meta.url)
const doc = existsSync(picksPath)
  ? await readJson<{ about: string; picks: Record<string, PhotoPick> }>(picksPath)
  : { about: 'Chosen photo per dex entry: a Wikimedia Commons file, or an external photo (Dogs Australia breed pages). focus = [x, y] fractions of the photo to centre the crops on. by: who chose it.', picks: {} }

let applied = 0
for (const f of verdictFiles) {
  const verdicts = await readJson<Record<string, Verdict>>(f)
  for (const [id, v] of Object.entries(verdicts)) {
    if (!index[id]) throw new Error(`${f}: ${id} is not in the ${round} index`)
    if (doc.picks[id]?.by === 'justin') continue
    const file = v.tile === null ? null : index[id].tiles.find((t) => t.n === v.tile)?.file
    if (file === undefined) throw new Error(`${f}: ${id} picked tile ${v.tile}, which is not on its sheet`)
    doc.picks[id] = { file, ...(v.focus && { focus: v.focus }), by: 'claude-review', confidence: v.confidence, note: v.note }
    applied++
  }
}

doc.picks = Object.fromEntries(Object.entries(doc.picks).sort(([a], [b]) => a.localeCompare(b)))
await writeFile(picksPath, JSON.stringify(doc, null, 2) + '\n')
const byFile = new Map<string, string[]>()
for (const [id, p] of Object.entries(doc.picks)) if (p.file) byFile.set(p.file, [...(byFile.get(p.file) ?? []), id])
const dupes = [...byFile].filter(([, ids]) => ids.length > 1)
const weak = Object.entries(doc.picks).filter(([, p]) => p.by !== 'justin' && (p.file === null || p.confidence !== 'high')).map(([id]) => id)
console.log(`Applied ${applied} verdicts; ${Object.keys(doc.picks).length} entries have a pick record.`)
console.log(`Not high confidence or no photo (${weak.length}): ${weak.join(' ')}`)
for (const [file, ids] of dupes) console.log(`  ! same photo for ${ids.join(' and ')}: ${file}`)
if (dupes.length) process.exitCode = 1
