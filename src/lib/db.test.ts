// Spotting, unseeing and backups against a real (in-memory) IndexedDB.
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { backupFile, importBackup } from './backup.ts'
import { db, setNote, spot, toSpots, unsee } from './sightings.ts'

beforeEach(async () => {
  await db.sightings.clear()
})

const spots = async () => toSpots(await db.sightings.toArray())

describe('spotting and unseeing', () => {
  it('spots a breed, keeps its note, and unseeing it clears both', async () => {
    await spot('pug')
    const [pug] = (await spots()).values()
    await setNote(pug.sightingId, 'Fawn, called Frank')
    expect((await spots()).get('pug')?.note).toBe('Fawn, called Frank')
    await unsee('pug')
    expect((await spots()).size).toBe(0)
    const [stored] = await db.sightings.toArray()
    expect(stored.deletedAt).toBeTruthy()
    expect(stored.note).toBeUndefined()
  })
})

describe('backups', () => {
  it('restores everything into an empty phone, and restoring twice changes nothing', async () => {
    await spot('pug')
    await spot('beagle')
    await spot('beagle')
    const { file, count } = backupFile(await db.sightings.toArray())
    expect(count).toBe(2) // breeds, not sightings
    const text = await file.text()
    await db.sightings.clear()
    expect(await importBackup(text)).toBe(3)
    expect([...(await spots()).keys()].sort()).toEqual(['beagle', 'pug'])
    expect(await importBackup(text)).toBe(0)
  })

  it("doesn't bring back a dog you unsaw after the backup", async () => {
    await spot('pug')
    const text = await backupFile(await db.sightings.toArray()).file.text()
    await new Promise((r) => setTimeout(r, 5))
    await unsee('pug')
    await importBackup(text)
    expect((await spots()).size).toBe(0)
  })
})
