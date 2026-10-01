import { expect, test, type Page } from '@playwright/test'
import { launch, openBreed, spotBreed } from './helpers.ts'

// Screenshots of every screen, per theme, so a style change anywhere shows up as a diff.
// Update them on purpose with: pnpm test:e2e --update-snapshots
const shot = (page: Page, name: string) => expect(page).toHaveScreenshot(`${name}.png`, { animations: 'disabled', mask: [page.getByTestId('park')], maxDiffPixelRatio: 0.002 })

test.beforeEach(async ({ page }) => {
  // A fixed start, but the clock keeps running so each spot gets its own time.
  await page.clock.install({ time: new Date('2026-10-02T10:00:00') })
  await page.clock.resume()
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('launch screen', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /Tap to launch/ })).toBeVisible()
  await shot(page, 'launch')
})

test('every screen', async ({ page }) => {
  await launch(page)
  await shot(page, 'dogdex')
  await spotBreed(page, 'Labrador Retriever')
  await spotBreed(page, 'Cavoodle')
  await openBreed(page, 'Staffordshire Bull Terrier')
  await shot(page, 'breed')
  await page.getByRole('button', { name: 'Spotted', exact: true }).click()
  await shot(page, 'spotted-dialog')
  await page.getByRole('alertdialog').getByRole('button', { name: 'OK' }).click()
  await shot(page, 'breed-spotted')
  await page.getByRole('button', { name: 'Unsee' }).click()
  await shot(page, 'unsee-dialog')
  await page.getByRole('alertdialog').getByRole('button', { name: 'No' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
  await page.getByLabel('Find:').fill('')
  await page.getByText('Spotted', { exact: true }).click()
  await shot(page, 'dogdex-spotted')
  await page.getByRole('tab', { name: 'Progress' }).click()
  await shot(page, 'progress')
  await page.getByRole('tab', { name: 'Park' }).click()
  await shot(page, 'park')
})

test('help', async ({ page }) => {
  await launch(page)
  await page.getByRole('tab', { name: 'Help' }).click()
  await shot(page, 'help')
})
