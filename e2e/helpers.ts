import { expect, type Page, type TestInfo } from '@playwright/test'
import data from '../src/data/breeds.json' with { type: 'json' }

/** Counts from the shipped data, so the tests don't need changing when the breed list does. */
export const TOTAL = data.breeds.length
export const inGroup = (groupId: string) => data.breeds.filter((b) => b.groupId === groupId).length
export const dexNo = (name: string) => data.breeds.find((b) => b.name === name)!.dexNo
export const LAST_DEX = data.breeds.at(-1)!.dexNo

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

/** Opens Help, from the ? in the title bar (a window of its own, in every theme). */
export async function openHelp(page: Page) {
  await page.getByRole('button', { name: 'Help', exact: true }).click()
  await expect(page.getByRole('group', { name: 'Add to Home Screen' })).toBeVisible()
}

/** Closes the Help window so the other screens can be reached. */
export async function leaveHelp(page: Page) {
  const window = page.getByRole('dialog', { name: 'Help' })
  if (await window.isVisible()) await window.getByRole('button', { name: 'Close' }).click()
}

/** The theme a test run starts in: each iPhone project is named after its theme; Android uses the default. */
export const startTheme = (info: TestInfo) => (info.project.name === 'android' ? 'glass' : info.project.name) as 'glass' | 'aqua' | 'win98'
