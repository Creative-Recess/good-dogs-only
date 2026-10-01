// Backup files: every sighting (including unseen ones, so an old backup can't undo a later Unsee).
// Restoring merges by sighting id and the newest change wins, so restoring the same file twice is harmless.
import { todayIso } from './dates.ts'
import { db, toSpots, type Sighting } from './sightings.ts'

const BACKUP_APP = 'good-dogs-only'
const BACKUP_VERSION = 1
export type BackupFile = { app: typeof BACKUP_APP; version: number; exportedAt: string; sightings: Sighting[] }

const isString = (v: unknown): v is string => typeof v === 'string'
const isDay = (v: unknown) => isString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v)

function isSighting(v: unknown): v is Sighting {
  if (!v || typeof v !== 'object') return false
  const s = v as Record<string, unknown>
  return isString(s.id) && isString(s.breedId) && isDay(s.seenAt) && isString(s.createdAt) && isString(s.updatedAt) &&
    (s.note === undefined || isString(s.note)) && (s.deletedAt === undefined || isString(s.deletedAt))
}

/** Reads a backup file's text; throws an Error with a message fit for the user if it isn't one. */
export function parseBackup(text: string): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("That file isn't a Good Dogs Only backup.")
  }
  const f = data as Partial<BackupFile>
  if (!f || f.app !== BACKUP_APP || !Array.isArray(f.sightings)) throw new Error("That file isn't a Good Dogs Only backup.")
  if (typeof f.version !== 'number' || f.version > BACKUP_VERSION) throw new Error('That backup is from a newer version of Good Dogs Only.')
  if (!f.sightings.every(isSighting)) throw new Error('That backup file is damaged.')
  return f as BackupFile
}

/** Which incoming sightings to write: new ones, and ones changed more recently than ours. */
export function sightingsToMerge(existing: Sighting[], incoming: Sighting[]): Sighting[] {
  const ours = new Map(existing.map((s) => [s.id, s]))
  return incoming.filter((s) => {
    const mine = ours.get(s.id)
    return !mine || s.updatedAt > mine.updatedAt
  })
}

/**
 * The backup file for these sightings, and how many breeds it holds. Synchronous on purpose: iOS only opens the
 * share sheet straight from a tap, so the file has to be ready the moment Save Backup is pressed.
 */
export function backupFile(sightings: Sighting[], now = new Date()): { file: File; count: number } {
  const body: BackupFile = { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), sightings }
  const file = new File([JSON.stringify(body, null, 1)], `good-dogs-only-backup-${todayIso(now)}.json`, { type: 'application/json' })
  return { file, count: toSpots(sightings).size }
}

export async function importBackup(text: string): Promise<number> {
  const { sightings } = parseBackup(text)
  return db.transaction('rw', db.sightings, async () => {
    const changes = sightingsToMerge(await db.sightings.toArray(), sightings)
    await db.sightings.bulkPut(changes)
    return changes.length
  })
}

export const LAST_BACKUP = 'lastBackup'
export async function markBackedUp(): Promise<void> {
  await db.meta.put({ key: LAST_BACKUP, value: todayIso() })
}
