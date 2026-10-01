import { expect, test } from '@playwright/test'
import { TOTAL, inGroup, launch, openBreed, spotBreed } from './helpers.ts'

test.beforeEach(async ({ page }) => launch(page))

test('spotting a breed sticks after closing the app and reopening it', async ({ page }) => {
  await openBreed(page, 'Labrador Retriever')
  await page.getByRole('button', { name: 'Spotted', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toContainText(`That's 1 of ${TOTAL} breeds.`)
  await page.getByRole('alertdialog').getByRole('button', { name: 'OK' }).click()
  const w = page.getByRole('dialog', { name: 'Labrador Retriever' })
  await expect(w.getByText('Spotted!')).toBeVisible()
  await expect(w.getByText(/First spotted \d{1,2} [A-Z][a-z]{2} \d{4}/)).toBeVisible()
  await w.getByLabel('Note:').fill('Chocolate, called Bear')
  await w.getByRole('button', { name: 'Close' }).click()
  await page.getByLabel('Find:').fill('')
  await expect(page.getByRole('button', { name: 'Labrador Retriever, spotted' })).toBeVisible()

  await page.reload()
  await launch(page)
  await page.getByText('Spotted', { exact: true }).click()
  await expect(page.locator('.icons .icon')).toHaveCount(1)
  await openBreed(page, 'Labrador Retriever')
  await expect(page.getByLabel('Note:')).toHaveValue('Chocolate, called Bear')
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
  await page.getByRole('tab', { name: 'Progress' }).click()
  await expect(page.getByText(`1 of ${TOTAL} breeds`)).toBeVisible()
  await expect(page.getByRole('button', { name: new RegExp(`Gundogs\\s*1/${inGroup('gundogs')}`) })).toBeVisible()
  await expect(page.getByRole('row', { name: /Labrador Retriever/ })).toBeVisible()
})

test('Unsee asks first, and only Yes removes the spot', async ({ page }) => {
  await spotBreed(page, 'Pug')
  await openBreed(page, 'Pug')
  await page.getByRole('button', { name: 'Unsee' }).click()
  const ask = page.getByRole('alertdialog')
  await expect(ask).toContainText('Remove Pug from your spotted breeds?')
  await expect(ask.getByRole('button', { name: 'No' })).toBeFocused()
  await ask.getByRole('button', { name: 'No' }).click()
  await expect(page.getByText('Spotted!')).toBeVisible()
  await page.getByRole('button', { name: 'Unsee' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Yes' }).click()
  await expect(page.getByRole('button', { name: 'Spotted', exact: true })).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('button', { name: 'Pug', exact: true })).toBeVisible()
})

test('Show: Spotted and Unseen split the grid', async ({ page }) => {
  await spotBreed(page, 'Cavoodle')
  await page.getByText('Spotted', { exact: true }).click()
  await expect(page.locator('.icons .icon')).toHaveCount(1)
  await page.getByText('Unseen', { exact: true }).click()
  await expect(page.locator('.icons .icon')).toHaveCount(TOTAL - 1)
})

test('the breed photo keeps its full shape once the breed is spotted', async ({ page }) => {
  await openBreed(page, 'Australian Silky Terrier')
  // The visible frame around the photo, which is what gets squashed (the image inside keeps its shape but is cut off).
  const frame = page.getByRole('dialog').locator('.photo-frame')
  const ratio = async () => {
    const box = (await frame.boundingBox())!
    return box.width / box.height
  }
  expect(await ratio()).toBeLessThan(1.6)
  await page.getByRole('button', { name: 'Spotted', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'OK' }).click()
  await expect(page.getByText('Spotted!')).toBeVisible()
  expect(await ratio()).toBeLessThan(1.6)
})

test('Escape closes the top window first: the sheet, then the breed window', async ({ page }) => {
  await openBreed(page, 'Beagle')
  await page.getByRole('button', { name: 'Spotted', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('alertdialog')).toBeHidden()
  await expect(page.getByRole('dialog', { name: 'Beagle' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Beagle' })).toBeHidden()
})

test('a note is saved after typing stops, and is kept when the window closes straight away', async ({ page }) => {
  await spotBreed(page, 'Whippet')
  await openBreed(page, 'Whippet')
  await page.getByLabel('Note:').fill('Grey, very fast')
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
  await openBreed(page, 'Whippet')
  await expect(page.getByLabel('Note:')).toHaveValue('Grey, very fast')
})
