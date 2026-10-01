// Reads the "Characteristics" and "Temperament" lines from every Dogs Australia breed standard, for analysis only.
// The text is copyrighted, so it goes to .cache/ankc-temperament.json (not committed) and is used to derive our
// own trait list; the app ships only our tags and our own wording.
// Usage: node scripts/fetch-ankc-temperament.ts
import { mkdir, writeFile } from 'node:fs/promises'
import { parse } from 'node-html-parser'
import ankc from '../data/ankc-breeds.json' with { type: 'json' }
import { politeFetchText } from './lib/http.ts'

const out: Record<string, { characteristics: string | null; temperament: string | null }> = {}
for (const [i, b] of ankc.breeds.entries()) {
  const text = parse(await politeFetchText(b.ankcUrl))
    .text.split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  // Each heading is on its own line, followed by its text (sometimes on the same line after the colon).
  const section = (heading: string) => {
    const at = text.findIndex((l) => l.toLowerCase().startsWith(heading))
    if (at === -1) return null
    const inline = text[at].slice(heading.length).replace(/^[:\s]+/, '')
    return inline || text[at + 1] || null
  }
  out[b.ankcName] = { characteristics: section('characteristics'), temperament: section('temperament') }
  console.log(`[${i + 1}/${ankc.breeds.length}] ${b.ankcName}: ${out[b.ankcName].temperament ?? '(no temperament line)'}`)
}
await mkdir(new URL('../.cache/', import.meta.url), { recursive: true })
await writeFile(new URL('../.cache/ankc-temperament.json', import.meta.url), JSON.stringify(out, null, 1) + '\n')
