// Relative import (not @/) because the Node-side data tests share this module.
import type { Breed } from '../data/types.ts'

/** Lowercase, strip accents and punctuation: "Löwchen (Little Lion Dog)" -> "lowchen little lion dog". */
export function normalise(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '') // drop accents left over by NFKD
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * How well a query matches one name: 0 exact, 1 starts with it, 2 a word starts with it,
 * 3 contains it, null no match. "Staffy" is exact on an alias; "heeler" starts a word.
 */
function matchRank(name: string, query: string): number | null {
  if (name === query) return 0
  if (name.startsWith(query)) return 1
  if (` ${name}`.includes(` ${query}`)) return 2
  if (name.includes(query)) return 3
  return null
}

/** Breeds matching a query on name, nickname or variety, best matches first, ties in dex order. */
export function searchBreeds(breeds: Breed[], query: string): Breed[] {
  const q = normalise(query)
  if (!q) return breeds
  const ranked: { breed: Breed; rank: number; index: number }[] = []
  breeds.forEach((breed, index) => {
    const names = [breed.name, breed.officialName ?? '', ...breed.aliases, ...breed.forms].filter(Boolean)
    let best: number | null = null
    for (const n of names) {
      const r = matchRank(normalise(n), q)
      if (r !== null && (best === null || r < best)) best = r
    }
    if (best !== null) ranked.push({ breed, rank: best, index })
  })
  return ranked.sort((a, b) => a.rank - b.rank || a.index - b.index).map((r) => r.breed)
}
