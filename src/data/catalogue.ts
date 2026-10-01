// The breed catalogue the app ships with, plus lookups derived from it.
import data from './breeds.json'
import type { Breed, Group, GroupId } from './types.ts'

export const breeds = data.breeds as Breed[]
export const groups = (data.groups as Group[]).map((g) => ({ ...g, total: breeds.filter((b) => b.groupId === g.id).length }))
export const TOTAL = breeds.length
export const breedById = new Map(breeds.map((b) => [b.id, b]))
export const groupById = new Map(groups.map((g) => [g.id, g]))

/** Group colours in the Windows 16-colour spirit. */
export const GROUP_COLOUR: Record<GroupId, string> = {
  toys: '#c00080',
  terriers: '#a04000',
  gundogs: '#008000',
  hounds: '#804000',
  'working-dogs': '#000080',
  utility: '#800080',
  'non-sporting': '#008080',
  bonus: '#c08000',
}
