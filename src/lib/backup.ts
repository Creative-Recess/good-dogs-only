// Backup files: every sighting (including unseen ones, so an old backup can't undo a later Unsee).
// Restoring merges by sighting id and the newest change wins, so restoring the same file twice is harmless.
import { todayIso } from './dates.ts'
import { db, toSpots, type Sighting } from './sightings.ts'

const BACKUP_APP = 'good-dogs-only'
const BACKUP_VERSION = 1
export type BackupFile = { app: typeof BACKUP_APP; version: number; exportedAt: string; sightings: Sighting[] }

/** Bigger than any real backup (a full dex with notes is well under 1 MB), small enough not to freeze the phone. */
export const MAX_BACKUP_BYTES = 5_000_000

const isString = (v: unknown): v is string => typeof v === 'string'
/** A real calendar day, "2026-10-01". */
const isDay = (v: unknown) => {
  if (!isString(v) || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const [y, m, d] = v.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}
/**
 * A timestamp the app itself would write (toISOString), and not in the future: the newest change wins a merge,
 * so one dated years ahead would out-vote every later change.
 */
const isStamp = (v: unknown, now: number) =>
  isString(v) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(v) && !isNaN(Date.parse(v)) && Date.parse(v) <= now + 86_400_000

function isSighting(v: unknown, now: number): v is Sighting {
  if (!v || typeof v !== 'object') return false
  const s = v as Record<string, unknown>
  return isString(s.id) && isString(s.breedId) && isDay(s.seenAt) && isStamp(s.createdAt, now) && isStamp(s.updatedAt, now) &&
    (s.note === undefined || isString(s.note)) && (s.deletedAt === undefined || isStamp(s.deletedAt, now))
}

/** Just the fields a sighting has, so nothing else in a file gets stored. */
const clean = ({ id, breedId, seenAt, note, createdAt, updatedAt, deletedAt }: Sighting): Sighting => ({
  id, breedId, seenAt, createdAt, updatedAt,
  ...(note !== undefined && { note }),
  ...(deletedAt !== undefined && { deletedAt }),
})

/** Reads a backup file's text; throws an Error with a message fit for the user if it isn't one. */
export function parseBackup(text: string, now = Date.now()): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("That file isn't a Good Dogs Only backup.")
  }
  const f = data as Partial<BackupFile>
  if (!f || f.app !== BACKUP_APP || !Array.isArray(f.sightings)) throw new Error("That file isn't a Good Dogs Only backup.")
  if (typeof f.version !== 'number' || f.version > BACKUP_VERSION) throw new Error('That backup is from a newer version of Good Dogs Only.')
  if (!f.sightings.every((s) => isSighting(s, now))) throw new Error('That backup file is damaged.')
  return { ...(f as BackupFile), sightings: f.sightings.map(clean) }
}

/** Which incoming sightings to write: new ones, and ones changed more recently than ours. */
export function sightingsToMerge(existing: Sighting[], incoming: Sighting[]): Sighting[] {
  const ours = new Map(existing.map((s) => [s.id, s]))
  // If a file lists one sighting twice, only its newest version counts.
  const newest = new Map<string, Sighting>()
  for (const s of incoming) if (!newest.has(s.id) || s.updatedAt > newest.get(s.id)!.updatedAt) newest.set(s.id, s)
  return [...newest.values()].filter((s) => {
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
