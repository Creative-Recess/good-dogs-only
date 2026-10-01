import { expect, type Page } from '@playwright/test'

/** Opens the app past the launch screen, ready on the Breeds tab. */
export async function launch(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Tap to launch/ }).click()
  await expect(page.getByRole('tab', { name: 'Breeds' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Tap to launch/ })).toBeHidden()
}

/** Opens a breed from the Breeds grid by searching for it. */
export async function openBreed(page: Page, name: string) {
  await page.getByLabel('Find:').fill(name)
  await page.getByRole('button', { name: new RegExp(`^${name.replace(/[()]/g, '\\$&')}(, spotted)?$`) }).first().click()
  await expect(page.getByRole('dialog', { name })).toBeVisible()
}

export async function spotBreed(page: Page, name: string) {
  await openBreed(page, name)
  await page.getByRole('button', { name: 'Spotted', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'OK' }).click()
  await page.getByRole('dialog', { name }).getByRole('button', { name: 'Close' }).click()
  await page.getByLabel('Find:').fill('')
}

/** Breed tiles currently in the grid. */
export const tiles = (page: Page) => page.locator('.icons .icon')
