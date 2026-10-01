import { existsSync, readdirSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import shipped from '../src/data/breeds.json' with { type: 'json' }
import type { Breed } from '../src/data/types.ts'
import { isAllowedLicence } from './lib/licences.ts'

const breeds = shipped.breeds as Breed[]
const publicPath = (p: string) => new URL(`../public${p}`, import.meta.url)
/** Entries with no free photo anywhere; the app shows a "no photo yet" placeholder. */
const NO_PHOTO: string[] = []

describe('src/data/breeds.json', () => {
  it('ships all 247 entries with unique ids', () => {
    expect(breeds).toHaveLength(247)
    expect(new Set(breeds.map((b) => b.id)).size).toBe(247)
  })

  it('has a photo for every entry except the known gaps', () => {
    expect(breeds.filter((b) => !b.image).map((b) => b.id)).toEqual(NO_PHOTO)
  })

  it('uses a different photo for every entry', () => {
    const sources = breeds.flatMap((b) => (b.credit ? [b.credit.sourceUrl] : []))
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('has both image files on disk for each photo', () => {
    for (const b of breeds.filter((x) => x.image)) {
      expect(existsSync(publicPath(b.image!.grid)), b.id).toBe(true)
      expect(existsSync(publicPath(b.image!.detail)), b.id).toBe(true)
    }
  })

  it('credits every photo with an allowed licence', () => {
    for (const b of breeds.filter((x) => x.image)) {
      const c = b.credit!
      expect(c.author, b.id).toBeTruthy()
      if (c.restricted) {
        // Justin's call (1 Oct 2026): Dogs Australia photos for the weakest Commons picks, credited to them.
        expect(c.sourceUrl, b.id).toMatch(/^https:\/\/dogsaustralia\.org\.au\/BrowseBreed\//)
      } else {
        expect(isAllowedLicence(c.licence), `${b.id}: ${c.licence}`).toBe(true)
        expect(c.sourceUrl, b.id).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
      }
      expect(c.changes, b.id).toBeTruthy()
    }
  })

  it('keeps the grid images small enough to load quickly on mobile data', () => {
    const gridBytes = breeds.reduce((sum, b) => sum + (b.image ? statSync(publicPath(b.image.grid)).size : 0), 0)
    expect(gridBytes).toBeLessThan(8 * 1024 * 1024)
  })

  it('has no stray files in public/breeds', () => {
    const used = new Set(breeds.flatMap((b) => (b.image ? [b.image.grid, b.image.detail] : [])).map((p) => p.replace('/breeds/', '')))
    expect(readdirSync(publicPath('/breeds/')).filter((f) => !used.has(f))).toEqual([])
  })
})
