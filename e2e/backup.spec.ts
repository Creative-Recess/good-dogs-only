import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { launch, leaveHelp, openHelp, spotBreed } from './helpers.ts'

test('a backup restores every spot after the phone is wiped', async ({ page }, testInfo) => {
  // Stand in for the iPhone share sheet: keep the file it was given.
  await page.addInitScript(() => {
    navigator.share = async (data?: ShareData) => {
      ;(window as unknown as { shared: string }).shared = await data!.files![0].text()
    }
  })
  await launch(page)
  await spotBreed(page, 'Border Collie')
  await spotBreed(page, 'Groodle')
  await openHelp(page)
  await expect(page.getByText('Last backup: never')).toBeVisible()

  await page.getByRole('button', { name: 'Save Backup...' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('Backup saved with 2 spots.')
  await page.getByRole('alertdialog').getByRole('button', { name: 'OK' }).click()
  await expect(page.getByText(/Last backup: \d/)).toBeVisible()
  const shared = await page.evaluate(() => (window as unknown as { shared: string }).shared)
  const file = testInfo.outputPath('backup.json')
  await writeFile(file, shared)
  const backup = JSON.parse(shared)
  expect(backup.app).toBe('good-dogs-only')
  expect(backup.sightings).toHaveLength(2)

  // Wipe the phone's data, then restore.
  await page.evaluate(
    () =>
      new Promise((done) => {
        const r = indexedDB.deleteDatabase('good-dogs-only')
        r.onsuccess = r.onerror = r.onblocked = () => done(null)
      }),
  )
  await page.reload()
  await launch(page)
  await page.getByRole('tab', { name: 'Progress' }).click()
  await expect(page.getByText('0 of 239 breeds')).toBeVisible()
  await openHelp(page)
  await page.getByTestId('restore-file').setInputFiles(file)
  await expect(page.getByRole('alertdialog')).toContainText('Backup restored.')
  await page.getByRole('alertdialog').getByRole('button', { name: 'OK' }).click()

  // Restoring the same file again changes nothing.
  await page.getByTestId('restore-file').setInputFiles(file)
  await expect(page.getByRole('alertdialog')).toContainText('already here')
  await page.getByRole('alertdialog').getByRole('button', { name: 'OK' }).click()
  await leaveHelp(page)
  await page.getByRole('tab', { name: 'Progress' }).click()
  await expect(page.getByText('2 of 239 breeds')).toBeVisible()
})

test('restoring a file that is not a backup says so', async ({ page }) => {
  await launch(page)
  await openHelp(page)
  await page.getByTestId('restore-file').setInputFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') })
  await expect(page.getByRole('alertdialog')).toContainText("isn't a Good Dogs Only backup")
})
