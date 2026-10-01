// Sightings: what's been spotted, stored on this phone only (IndexedDB via Dexie).
// A breed counts as spotted while it has a sighting that isn't deleted. Unsee soft-deletes, so a restored
// backup can't bring back a dog you unsaw later (the newest change to each sighting wins).
import Dexie, { type EntityTable } from 'dexie'
import { todayIso } from './dates.ts'

export type Sighting = {
  id: string
  breedId: string
  /** The day it was seen, "2026-10-01". */
  seenAt: string
  note?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

type Meta = { key: string; value: string }

export const db = new Dexie('good-dogs-only') as Dexie & {
  sightings: EntityTable<Sighting, 'id'>
  meta: EntityTable<Meta, 'key'>
}
db.version(1).stores({ sightings: 'id, breedId, updatedAt', meta: 'key' })

/** One spotted breed, as the screens show it. */
export type Spot = { breedId: string; firstSeen: string; note: string; sightingId: string }

/** Spotted breeds by id, from the earliest live sighting of each. */
export function toSpots(sightings: Sighting[]): Map<string, Spot> {
  const spots = new Map<string, Spot>()
  const live = sightings.filter((s) => !s.deletedAt).sort((a, b) => a.seenAt.localeCompare(b.seenAt) || a.createdAt.localeCompare(b.createdAt))
  for (const s of live) if (!spots.has(s.breedId)) spots.set(s.breedId, { breedId: s.breedId, firstSeen: s.seenAt, note: s.note ?? '', sightingId: s.id })
  return spots
}

const now = () => new Date().toISOString()

/** A random v4 UUID. crypto.randomUUID only exists over HTTPS, and the dev server on the Wi-Fi is plain HTTP. */
export function newId(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export async function spot(breedId: string): Promise<void> {
  const t = now()
  await db.sightings.add({ id: newId(), breedId, seenAt: todayIso(), createdAt: t, updatedAt: t })
  // Ask iOS not to clear this app's storage when the phone is low on space (not guaranteed, hence Backup).
  void navigator.storage?.persist?.().catch(() => {})
}

export async function unsee(breedId: string): Promise<void> {
  const t = now()
  await db.sightings.where('breedId').equals(breedId).modify((s) => {
    if (!s.deletedAt) {
      s.deletedAt = t
      s.updatedAt = t
    }
  })
}

export async function setNote(sightingId: string, note: string): Promise<void> {
  await db.sightings.update(sightingId, { note, updatedAt: now() })
}
