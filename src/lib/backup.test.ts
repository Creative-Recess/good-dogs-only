import { describe, expect, it } from 'vitest'
import { parseBackup, sightingsToMerge } from './backup.ts'
import type { Sighting } from './sightings.ts'

const s = (id: string, updatedAt: string, over: Partial<Sighting> = {}): Sighting => ({ id, breedId: 'pug', seenAt: '2026-09-01', createdAt: '2026-09-01T00:00:00Z', updatedAt, ...over })

describe('sightingsToMerge', () => {
  it('adds new sightings and keeps the newest version of each', () => {
    const ours = [s('a', '2026-09-05T00:00:00Z'), s('b', '2026-09-01T00:00:00Z')]
    const theirs = [s('a', '2026-09-02T00:00:00Z'), s('b', '2026-09-09T00:00:00Z', { deletedAt: '2026-09-09T00:00:00Z' }), s('c', '2026-09-03T00:00:00Z')]
    expect(sightingsToMerge(ours, theirs).map((x) => x.id)).toEqual(['b', 'c'])
  })
  it('changes nothing when the same backup is restored twice', () => {
    const backup = [s('a', '2026-09-05T00:00:00Z')]
    expect(sightingsToMerge(backup, backup)).toEqual([])
  })
})

describe('parseBackup', () => {
  const ok = { app: 'good-dogs-only', version: 1, exportedAt: '2026-10-01T00:00:00Z', sightings: [s('a', '2026-09-05T00:00:00Z')] }
  it('accepts a backup file', () => {
    expect(parseBackup(JSON.stringify(ok)).sightings).toHaveLength(1)
  })
  it('rejects other files with a plain message', () => {
    expect(() => parseBackup('not json')).toThrow("isn't a Good Dogs Only backup")
    expect(() => parseBackup(JSON.stringify({ app: 'other' }))).toThrow("isn't a Good Dogs Only backup")
    expect(() => parseBackup(JSON.stringify({ ...ok, version: 2 }))).toThrow('newer version')
    expect(() => parseBackup(JSON.stringify({ ...ok, sightings: [{ id: 1 }] }))).toThrow('damaged')
  })
})
