import { describe, expect, it } from 'vitest'
import { newId, toSpots, type Sighting } from './sightings.ts'

const s = (over: Partial<Sighting>): Sighting => ({ id: 'x', breedId: 'pug', seenAt: '2026-09-01', createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z', ...over })

describe('toSpots', () => {
  it('uses the earliest live sighting of each breed', () => {
    const spots = toSpots([s({ id: 'b', seenAt: '2026-09-20', note: 'later' }), s({ id: 'a', seenAt: '2026-09-02', note: 'first' })])
    expect(spots.get('pug')).toEqual({ breedId: 'pug', firstSeen: '2026-09-02', note: 'first', sightingId: 'a' })
  })
  it('ignores deleted sightings', () => {
    expect(toSpots([s({ deletedAt: '2026-09-03T00:00:00Z' })]).size).toBe(0)
  })
})

describe('newId', () => {
  it('makes v4 UUIDs, with or without crypto.randomUUID', () => {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    expect(newId()).toMatch(uuid)
    const original = crypto.randomUUID
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })
    try {
      expect(newId()).toMatch(uuid)
    } finally {
      Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true })
    }
  })
})
