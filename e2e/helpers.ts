import { expect, type Page } from '@playwright/test'

/** Opens the app past the launch screen, ready on the Dogdex tab. */
export async function launch(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Tap to launch/ }).click()
  await expect(page.getByRole('tab', { name: 'Dogdex' })).toBeVisible()
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

/** Opens Help: a tab in Windows 98, the round ? in the title bar (a window of its own) in the Aqua themes. */
export async function openHelp(page: Page) {
  // (In Windows 98 the tab also contains a button named Help, so take the first match.)
  await page.getByRole('tab', { name: 'Help' }).or(page.getByRole('button', { name: 'Help', exact: true })).first().click()
  await expect(page.getByRole('group', { name: 'Add to Home Screen' })).toBeVisible()
}

/** Leaves Help so the other screens can be reached (closes the Aqua Help window; nothing to do in Windows 98). */
export async function leaveHelp(page: Page) {
  const window = page.getByRole('dialog', { name: 'Help' })
  if (await window.isVisible()) await window.getByRole('button', { name: 'Close' }).click()
}
