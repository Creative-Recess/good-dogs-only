import { describe, expect, it } from 'vitest'
import wikiMap from '../data/wiki-map.json' with { type: 'json' }
import overrides from '../data/wiki-overrides.json' with { type: 'json' }
import { buildBreedList } from './lib/dataset.ts'

type Entry = { title: string | null; qid?: string | null; note?: string; commonsCategory?: string | null }
const map: Record<string, Entry> = wikiMap
const ids = buildBreedList().map((b) => b.id)

describe('data/wiki-map.json', () => {
  it('covers exactly the dex entries', () => {
    expect(Object.keys(map).sort()).toEqual([...ids].sort())
  })

  it('maps each entry to a Wikipedia article with a Wikidata item, or explains why not', () => {
    for (const id of ids) {
      const e = map[id]
      if (e.title === null) expect(e.note, id).toBeTruthy()
      else {
        expect(e.qid, id).toMatch(/^Q\d+$/)
        expect(e.commonsCategory, id).toBeTruthy()
      }
    }
  })

  it('only overrides entries that exist', () => {
    const known = new Set(ids)
    expect(Object.keys(overrides.breeds).filter((k) => !known.has(k))).toEqual([])
  })
})
