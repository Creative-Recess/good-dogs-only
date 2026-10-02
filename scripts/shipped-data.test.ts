import { existsSync, readdirSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import picksFile from '../data/photo-picks.json' with { type: 'json' }
import shipped from '../src/data/breeds.json' with { type: 'json' }
import { TRAITS, type Breed } from '../src/data/types.ts'
import { isAllowedLicence } from './lib/licences.ts'

const breeds = shipped.breeds as Breed[]
const publicPath = (p: string) => new URL(`../public${p}`, import.meta.url)
/** Entries allowed to ship without a photo (none today). */
const NO_PHOTO: string[] = []

describe('src/data/breeds.json', () => {
  it('ships all 239 entries with unique ids', () => {
    expect(breeds).toHaveLength(239)
    expect(new Set(breeds.map((b) => b.id)).size).toBe(239)
  })

  it('has a photo for every entry except the known gaps', () => {
    expect(breeds.filter((b) => !b.image).map((b) => b.id)).toEqual(NO_PHOTO)
  })

  it('uses a different photo for every entry', () => {
    const sources = breeds.flatMap((b) => (b.credit ? [b.credit.sourceUrl] : []))
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('has the grid, detail and mask files on disk for each photo', () => {
    for (const b of breeds.filter((x) => x.image)) {
      expect(existsSync(publicPath(b.image!.grid)), b.id).toBe(true)
      expect(existsSync(publicPath(b.image!.detail)), b.id).toBe(true)
      expect(existsSync(publicPath(b.image!.mask)), b.id).toBe(true)
    }
  })

  it('credits every photo with an allowed licence', () => {
    for (const b of breeds.filter((x) => x.image)) {
      const c = b.credit!
      expect(c.author, b.id).toBeTruthy()
      if (c.restricted) {
        // Justin's call (1 Oct 2026): Dogs Australia's own breed photos wherever they have one, credited to them.
        // Other non-Commons photos only where Justin chose them himself.
        const byJustin = (picksFile.picks as Record<string, { by: string }>)[b.id]?.by === 'justin'
        if (!byJustin) expect(c.sourceUrl, b.id).toMatch(/^https:\/\/dogsaustralia\.org\.au\/BrowseBreed\//)
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
    const used = new Set(breeds.flatMap((b) => (b.image ? [b.image.grid, b.image.detail, b.image.mask] : [])).map((p) => p.replace('/breeds/', '')))
    expect(readdirSync(publicPath('/breeds/')).filter((f) => !used.has(f))).toEqual([])
  })

  it('gives every entry 3 different traits from the fixed list, and a line of text in our own words', () => {
    for (const b of breeds) {
      expect(b.traits, b.id).toHaveLength(3)
      expect(new Set(b.traits).size, b.id).toBe(3)
      for (const t of b.traits) expect(TRAITS, `${b.id}: ${t}`).toContain(t)
      expect(b.text.length, b.id).toBeGreaterThan(20)
      expect(b.text.length, b.id).toBeLessThanOrEqual(160)
      expect(b.text, b.id).not.toMatch(/[\u2013\u2014;!]/)
    }
  })

  it('gives every entry a Park dog description from the fixed lists', () => {
    for (const b of breeds) {
      const s = b.shape
      expect(s, b.id).toBeTruthy()
      expect(['XS', 'S', 'M', 'L', 'XL'], b.id).toContain(s.size)
      expect(['standard', 'long_low', 'tall_lean', 'stocky'], b.id).toContain(s.build)
      expect([1, 2, 3, 4, 5], b.id).toContain(s.snout)
      expect(['floppy', 'long', 'pointy', 'bat', 'rose', 'tipped'], b.id).toContain(s.ears)
      expect(['straight', 'plume', 'curl', 'stub', 'up'], b.id).toContain(s.tail)
      expect(['smooth', 'wiry', 'feathered', 'long', 'fluffy', 'curly', 'corded', 'hairless'], b.id).toContain(s.coat)
      expect(['black', 'chocolate', 'red', 'gold', 'cream', 'white', 'fawn', 'blue', 'silver', 'sable'], b.id).toContain(s.colour)
      expect(['solid', 'white_markings', 'parti', 'tan_points', 'tricolour', 'brindle', 'merle', 'spotted', 'saddle'], b.id).toContain(s.markings)
      expect(typeof s.mask, b.id).toBe('boolean')
    }
  })

  it('gives every photo a crop focus', () => {
    for (const b of breeds.filter((x) => x.image)) expect(b.image!.focus.every((v) => v >= 0 && v <= 1), b.id).toBe(true)
  })
})
