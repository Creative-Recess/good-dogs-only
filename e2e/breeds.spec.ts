import { expect, test } from '@playwright/test'
import { LAST_DEX, TOTAL, dexNo, inGroup, launch, openBreed, tiles } from './helpers.ts'

test.beforeEach(async ({ page }) => launch(page))

test('shows every breed in dex order', async ({ page }) => {
  await expect(tiles(page)).toHaveCount(TOTAL)
  await expect(tiles(page).first()).toContainText('001')
  await expect(tiles(page).first()).toContainText('Affenpinscher')
  await expect(tiles(page).last()).toContainText(LAST_DEX)
})

test('finds breeds by the names people use at the park', async ({ page }) => {
  for (const [query, breed] of [
    ['staffy', 'Staffordshire Bull Terrier'],
    ['sausage dog', 'Dachshund'],
    ['blue heeler', 'Australian Cattle Dog'],
    ['frenchie', 'French Bulldog'],
    ['alsatian', 'German Shepherd'],
  ]) {
    await page.getByLabel('Find:').fill(query)
    await expect(tiles(page).first(), query).toHaveAccessibleName(new RegExp(`^${breed}`))
  }
})

test('says so when nothing matches, and the X clears the search', async ({ page }) => {
  await page.getByLabel('Find:').fill('zzzz')
  await expect(page.getByText('Good Dogs Only cannot find')).toBeVisible()
  await page.getByRole('button', { name: 'Clear' }).click()
  await expect(page.getByLabel('Find:')).toHaveValue('')
  await expect(tiles(page)).toHaveCount(TOTAL)
})

test('filters by group', async ({ page }) => {
  await page.getByLabel('Group:').selectOption('toys')
  await expect(tiles(page)).toHaveCount(inGroup('toys'))
  await page.getByLabel('Group:').selectOption('bonus')
  await expect(tiles(page)).toHaveCount(inGroup('bonus'))
})

test('shows a breed with its photo, group, temperament and text', async ({ page }) => {
  await openBreed(page, 'Staffordshire Bull Terrier')
  const w = page.getByRole('dialog', { name: 'Staffordshire Bull Terrier' })
  await expect(w.getByRole('img', { name: 'Staffordshire Bull Terrier' })).toBeVisible()
  await expect(w.locator('.photo-strip')).toContainText('Terriers')
  await expect(w.locator('.photo-strip')).toContainText(`#${dexNo('Staffordshire Bull Terrier')}`)
  await expect(w.getByText('Also called Staffy')).toBeVisible()
  await expect(w.getByRole('link', { name: 'Official breed standard' })).toHaveAttribute('href', /dogsaustralia\.org\.au/)
  await expect(w.locator('.chip')).toHaveCount(3)
  await expect(w.locator('.textbox')).not.toBeEmpty()
  await w.getByRole('button', { name: 'Close' }).click()
  await expect(w).toBeHidden()
})

test('never scrolls the page sideways, and long names fit their space', async ({ page }) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  // Every grid label fits across (two lines down is the CSS clamp's job).
  const overflowing = await page.locator('.icon .label').evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent))
  expect(overflowing).toEqual([])
  await openBreed(page, 'Russian Toy (Long Haired)')
  const title = page.getByRole('dialog').locator('.title-bar-text span')
  expect(await title.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
})

test('the tabs work from the keyboard', async ({ page }) => {
  const dogdex = page.getByRole('tab', { name: 'Dogdex' })
  await dogdex.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Park' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: 'Park' })).toBeFocused()
  await page.keyboard.press('End')
  await expect(page.getByRole('tab', { name: 'Progress' })).toHaveAttribute('aria-selected', 'true')
})

test('short nicknames that are part of the name still show', async ({ page }) => {
  await openBreed(page, 'Cavalier King Charles Spaniel')
  await expect(page.getByRole('dialog').getByText('Also called Cavalier, Cav')).toBeVisible()
})
