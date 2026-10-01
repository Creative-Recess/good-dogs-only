import { expect, test } from '@playwright/test'
import { launch, openHelp } from './helpers.ts'

const THEMES = { glass: 'Aqua Glass', aqua: 'Aqua', win98: 'Windows 98' } as const

test('the Theme setting switches the look straight away, keeps you in Help, and is remembered', async ({ page }, info) => {
  const start = info.project.name as keyof typeof THEMES
  const next = start === 'win98' ? 'aqua' : 'win98'
  await launch(page)
  await openHelp(page)
  await expect(page.getByRole('radio', { name: THEMES[start], exact: true })).toBeChecked()
  await page.getByText(THEMES[next], { exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', next)
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', next === 'win98' ? '#008080' : '#dcdcdc') // next is win98 or aqua
  // Still in Help, now in the other theme's form of it.
  await expect(page.getByRole('radio', { name: THEMES[next], exact: true })).toBeChecked()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', next)
})

test('the saved theme is on the page before anything draws', async ({ page }, info) => {
  let atFirstPaint: string | null = null
  page.on('domcontentloaded', async () => {
    atFirstPaint = await page.evaluate(() => document.documentElement.dataset.theme ?? null)
  })
  await page.goto('/')
  await expect.poll(() => atFirstPaint).toBe(info.project.name)
})

test('Windows 98 styles never reach the Aqua themes', async ({ page }, info) => {
  test.skip(info.project.name === 'win98', 'Aqua themes only')
  await launch(page)
  const fieldsetBorder = await page.locator('fieldset.show').evaluate((e) => getComputedStyle(e).borderImageSource)
  expect(fieldsetBorder).toBe('none')
  // The Clear button only shows once there's text in Aqua's search field.
  await page.getByLabel('Find:').fill('pug')
  const fontFamily = await page.getByRole('button', { name: 'Clear' }).evaluate((e) => getComputedStyle(e).fontFamily)
  expect(fontFamily).not.toMatch(/Pixelated MS Sans Serif|Verdana/)
  const titleBar = await page.locator('.main .title-bar').evaluate((e) => getComputedStyle(e).backgroundImage)
  expect(titleBar).not.toMatch(/rgb\(0, 0, 128\)/) // 98.css's navy title bar
})
