import { expect, test } from '@playwright/test'
import { launch, spotBreed } from './helpers.ts'

type ParkHandle = { stop: () => void; whereIs: (id: string) => { x: number; y: number } | null }

test('each spotted breed appears in the Park, and tapping it opens the breed', async ({ page }) => {
  await launch(page)
  await page.getByRole('tab', { name: 'Park' }).click()
  await expect(page.locator('.park-hint')).toHaveText(/^No dogs yet · /)
  await page.getByRole('tab', { name: 'Dogdex' }).click()
  await spotBreed(page, 'Dalmatian')
  await page.getByRole('tab', { name: 'Park' }).click()
  await expect(page.locator('.park-hint')).toHaveText(/^1 dog · (Daytime|Dawn|Golden hour|Night)$/)

  // Hold the dog still while we tap it.
  const box = (await page.getByTestId('park').boundingBox())!
  const at = await page.evaluate(() => {
    const park = (window as unknown as { goodDogsPark: ParkHandle }).goodDogsPark
    park.stop()
    return park.whereIs('dalmatian')
  })
  expect(at).not.toBeNull()
  await page.mouse.click(box.x + at!.x * box.width, box.y + at!.y * box.height)
  await expect(page.getByRole('dialog', { name: 'Dalmatian' })).toBeVisible()
})

test('Minimise shows the Park as a screensaver until you tap', async ({ page }) => {
  await launch(page)
  await page.getByRole('button', { name: 'Screensaver', exact: true }).click()
  const saver = page.getByRole('button', { name: 'Screensaver. Tap to return.' })
  await expect(saver).toBeVisible()
  await saver.click()
  await expect(saver).toBeHidden()
  await expect(page.getByRole('tab', { name: 'Dogdex' })).toBeVisible()
})

test('Close goes back to the launch screen', async ({ page }) => {
  await launch(page)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('button', { name: /Tap to launch/ })).toBeVisible()
})
