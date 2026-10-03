// Merges the official list, the curated details and the bonus list into one ordered breed list.
import ankc from '../../data/ankc-breeds.json' with { type: 'json' }
import details from '../../data/breed-details.json' with { type: 'json' }
import factsFile from '../../data/breed-facts.json' with { type: 'json' }
import groupsFile from '../../data/groups.json' with { type: 'json' }
import shapes from '../../data/dog-shapes.json' with { type: 'json' }
import shortNames from '../../data/short-names.json' with { type: 'json' }
import traitsFile from '../../data/traits.json' with { type: 'json' }
import unofficial from '../../data/unofficial-breeds.json' with { type: 'json' }
import type { Breed, BreedFacts, DogShape, Group, GroupId, Trait } from '../../src/data/types.ts'
import { slugify } from './ankc.ts'

type Details = { name?: string; forms?: string[]; aliases?: string[] }
const detailsByName: Record<string, Details> = details.breeds

export const groups: Group[] = groupsFile.groups.map(({ id, name, description }) => ({
  id: id as GroupId,
  name,
  description,
}))

/** An entry before traits, text and Park shape are added. */
type BaseBreed = Omit<Breed, 'traits' | 'text' | 'shape'>

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'en')

/** All breeds without images: official ones numbered by group then A-Z, then the bonus section in file order. */
export function buildBreedList(): Breed[] {
  const official: BaseBreed[] = []
  for (const group of groupsFile.groups) {
    if (group.ankcGroupId === null) continue
    const inGroup = ankc.breeds
      .filter((b) => b.groupId === group.ankcGroupId)
      .map((b) => {
        const extra = detailsByName[b.ankcName] ?? {}
        const name = extra.name ?? b.ankcName
        return {
          id: slugify(name),
          dexNo: '',
          name,
          groupId: group.id as GroupId,
          tier: 'ankc' as const,
          ...(name !== b.ankcName && { officialName: b.ankcName }),
          forms: extra.forms ?? [],
          aliases: extra.aliases ?? [],
          ankcUrl: b.ankcUrl,
        }
      })
      .sort(byName)
    official.push(...inGroup)
  }
  official.forEach((b, i) => (b.dexNo = String(i + 1).padStart(3, '0')))

  const bonus: BaseBreed[] = unofficial.breeds.map((b, i) => ({
    id: slugify(b.name),
    dexNo: `B${String(i + 1).padStart(2, '0')}`,
    name: b.name,
    groupId: 'bonus',
    tier: 'unofficial',
    forms: [],
    aliases: b.aliases,
    kind: b.kind as 'cross' | 'breed',
    ...('parents' in b && { parents: b.parents }),
  }))

  const short: Record<string, string> = shortNames.names
  const traits: Record<string, { traits: string[]; text?: string }> = traitsFile.breeds
  const shapeById = shapes.breeds as Record<string, DogShape>
  // JSON gives plain arrays, not pairs; scripts/shipped-data.test.ts checks every entry's shape.
  const factsById = factsFile.breeds as unknown as Record<string, BreedFacts & { src?: string }>
  return [...official, ...bonus].map((b) => {
    const t = traits[b.officialName ?? b.name]
    return {
      ...b,
      ...(short[b.id] && { shortName: short[b.id] }),
      traits: (t?.traits ?? []) as Trait[],
      text: t?.text ?? '',
      shape: shapeById[b.id],
      ...(factsById[b.id] && { facts: shipFacts(factsById[b.id]) }),
    }
  })
}

/** The facts the app shows: the source link stays in data/breed-facts.json for checking. */
const shipFacts = ({ kg, life, origin, job }: BreedFacts): BreedFacts => ({ kg, life, origin, job })

/** Keys in breed-details.json that don't match an official breed name (e.g. after Dogs Australia renames one). */
export function orphanDetailKeys(): string[] {
  const names = new Set(ankc.breeds.map((b) => b.ankcName))
  return Object.keys(detailsByName).filter((k) => !names.has(k))
}
