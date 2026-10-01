import { describe, expect, it } from 'vitest'
import { searchBreeds } from '../src/lib/search.ts'
import shortNames from '../data/short-names.json' with { type: 'json' }
import { buildBreedList, groups, orphanDetailKeys } from './lib/dataset.ts'

const breeds = buildBreedList()
const top = (query: string) => searchBreeds(breeds, query)[0]?.name

describe('buildBreedList', () => {
  it('has the 227 official breeds then the 12 bonus entries', () => {
    expect(breeds.filter((b) => b.tier === 'ankc')).toHaveLength(227)
    expect(breeds.filter((b) => b.tier === 'unofficial')).toHaveLength(12)
  })

  it('gives every entry a unique, URL-safe id and dex number', () => {
    expect(new Set(breeds.map((b) => b.id)).size).toBe(breeds.length)
    expect(new Set(breeds.map((b) => b.dexNo)).size).toBe(breeds.length)
    for (const b of breeds) expect(b.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('numbers official breeds in group blocks, A-Z within each group', () => {
    const official = breeds.filter((b) => b.tier === 'ankc')
    expect(official[0]).toMatchObject({ dexNo: '001', name: 'Affenpinscher', groupId: 'toys' })
    expect(official.at(-1)?.dexNo).toBe('227')
    const groupOrder = groups.map((g) => g.id)
    for (let i = 1; i < official.length; i++) {
      const [a, b] = [official[i - 1], official[i]]
      const groupStep = groupOrder.indexOf(b.groupId) - groupOrder.indexOf(a.groupId)
      expect(groupStep === 1 || (groupStep === 0 && a.name.localeCompare(b.name, 'en') < 0)).toBe(true)
    }
  })

  it('numbers the bonus section B01-B12', () => {
    const bonus = breeds.filter((b) => b.tier === 'unofficial')
    expect(bonus[0]).toMatchObject({ dexNo: 'B01', name: 'Cavoodle', groupId: 'bonus', kind: 'cross' })
    expect(bonus.at(-1)?.dexNo).toBe('B12')
  })

  it('tidies variety-list names and keeps the official one', () => {
    const dachshund = breeds.find((b) => b.id === 'dachshund')
    expect(dachshund?.forms).toHaveLength(6)
    expect(dachshund?.officialName).toMatch(/^Dachshund - Standard Long/)
    expect(breeds.find((b) => b.id === 'belgian-shepherd-dog')?.forms).toEqual([
      'Groenendael',
      'Tervueren',
      'Laekenois',
      'Malinois',
    ])
  })

  it('has short names only for breeds that exist, and only shorter ones', () => {
    for (const b of breeds.filter((x) => x.shortName)) expect(b.shortName!.length, b.id).toBeLessThan(b.name.length)
    expect(breeds.filter((b) => b.shortName)).toHaveLength(Object.keys(shortNames.names).length)
  })

  it('has curated details only for breeds that exist', () => {
    expect(orphanDetailKeys()).toEqual([])
  })

  it('describes every group', () => {
    expect(groups.map((g) => g.id)).toEqual([
      'toys',
      'terriers',
      'gundogs',
      'hounds',
      'working-dogs',
      'utility',
      'non-sporting',
      'bonus',
    ])
    for (const g of groups) expect(g.description.length).toBeGreaterThan(20)
  })
})

describe('searchBreeds', () => {
  it.each([
    ['staffy', 'Staffordshire Bull Terrier'],
    ['sausage dog', 'Dachshund'],
    ['blue heeler', 'Australian Cattle Dog'],
    ['heeler', 'Australian Cattle Dog'],
    ['frenchie', 'French Bulldog'],
    ['alsatian', 'German Shepherd Dog'],
    ['westie', 'West Highland White Terrier'],
    ['sheltie', 'Shetland Sheepdog'],
    ['lab', 'Labrador Retriever'],
    ['golden', 'Golden Retriever'],
    ['malinois', 'Belgian Shepherd Dog'],
    ['cavapoo', 'Cavoodle'],
    ['mini foxie', 'Miniature Fox Terrier'],
    ['LÖWCHEN', 'Lowchen (Little Lion Dog)'],
  ])('"%s" finds %s first', (query, name) => {
    expect(top(query)).toBe(name)
  })

  it('returns every match for a broad query', () => {
    const names = searchBreeds(breeds, 'poodle').map((b) => b.name)
    expect(names.slice(0, 3)).toEqual(['Poodle (Miniature)', 'Poodle (Standard)', 'Poodle (Toy)'])
  })

  it('returns everything for an empty query and nothing for nonsense', () => {
    expect(searchBreeds(breeds, '  ')).toHaveLength(breeds.length)
    expect(searchBreeds(breeds, 'zzzz')).toEqual([])
  })
})
