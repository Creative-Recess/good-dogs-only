import { describe, expect, it } from 'vitest'
import { toSpots, type Sighting } from './sightings.ts'

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
