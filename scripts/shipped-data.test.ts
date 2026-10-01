import { existsSync, readdirSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import shipped from '../src/data/breeds.json' with { type: 'json' }
import { TRAITS, type Breed } from '../src/data/types.ts'
import { isAllowedLicence } from './lib/licences.ts'

const breeds = shipped.breeds as Breed[]
const publicPath = (p: string) => new URL(`../public${p}`, import.meta.url)
/** Entries with no free photo anywhere; the app shows a "no photo yet" placeholder. */
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

  it('gives every entry a Park shape within the drawable ranges', () => {
    const inRange = (v: number, lo: number, hi: number) => Number.isInteger(v) && v >= lo && v <= hi
    for (const b of breeds) {
      const s = b.shape
      expect(s, b.id).toBeTruthy()
      expect(inRange(s.len, 14, 42) && inRange(s.h, 6, 17) && inRange(s.leg, 3, 17) && inRange(s.head, 5, 13) && inRange(s.snout, 1, 11), b.id).toBe(true)
      expect(['floppy', 'long', 'pointy', 'bat', 'rose', 'tipped'], b.id).toContain(s.ears)
      expect(['straight', 'plume', 'curl', 'stub', 'up'], b.id).toContain(s.tail)
      expect(s.fluff ?? 0, b.id).toBeGreaterThanOrEqual(0)
      expect(s.fluff ?? 0, b.id).toBeLessThanOrEqual(1)
    }
  })

  it('gives every photo a crop focus and Park colours', () => {
    const rgb = (c: number[]) => c.length === 3 && c.every((v) => Number.isInteger(v) && v >= 0 && v <= 255)
    for (const b of breeds.filter((x) => x.image)) {
      const { focus, colours } = b.image!
      expect(focus.every((v) => v >= 0 && v <= 1), b.id).toBe(true)
      expect(rgb(colours.body) && rgb(colours.patch), b.id).toBe(true)
    }
  })
})
