import { expect, test } from '@playwright/test'
import { openHelp } from './helpers.ts'

test('serves a valid manifest and icons for the Home Screen', async ({ page, request }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifest = await (await request.get(href!)).json()
  expect(manifest).toMatchObject({ name: 'Good Dogs Only', short_name: 'Good Dogs', display: 'standalone', start_url: '/' })
  for (const icon of manifest.icons) {
    const res = await request.get(icon.src)
    expect(res.ok(), icon.src).toBe(true)
    expect(res.headers()['content-type'], icon.src).toContain('image/png')
  }
  const touch = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')
  expect((await request.get(touch!)).ok()).toBe(true)
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes')
})

test('Help shows how to add it to the Home Screen on this phone', async ({ page }, info) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Tap to launch/ }).click()
  await openHelp(page)
  const help = page.getByRole('group', { name: 'Add to Home Screen' })
  await expect(help.getByText(info.project.name === 'android' ? 'Install app' : 'View More')).toBeVisible()
})

test("opened in a phone's browser, it shows how to add it to the Home Screen straight away, blocking the app, every visit", async ({ page }, info) => {
  await page.addInitScript(() => localStorage.removeItem('good-dogs-only.home-screen-prompt')) // the tests turn it off
  await page.goto('/')
  const prompt = page.getByRole('alertdialog', { name: 'Add to Home Screen' })
  await expect(prompt).toBeVisible()
  await expect(prompt.getByText(info.project.name === 'android' ? 'Install app' : 'View More')).toBeVisible()
  await expect(prompt.getByText('save data and work like a normal app store app')).toBeVisible()
  // In the middle of the screen, with OK the only way on.
  const box = (await prompt.boundingBox())!
  const screen = page.viewportSize()!
  expect(Math.abs(box.y + box.height / 2 - screen.height / 2)).toBeLessThan(40)
  await expect(prompt.locator('.btns button')).toHaveCount(1)
  // It's over the launch screen, and a tap outside it doesn't launch the app.
  await page.mouse.click(screen.width / 2, screen.height - 20)
  await expect(prompt).toBeVisible()
  await expect(page.getByText('Tap to launch')).toBeVisible()
  await prompt.getByRole('button', { name: 'OK' }).click()
  await expect(prompt).toBeHidden()
  await page.getByRole('button', { name: /Tap to launch/ }).click()
  await expect(page.getByRole('tab', { name: 'Dogdex' })).toBeVisible()
  // Next visit, it asks again.
  await page.reload()
  await expect(prompt).toBeVisible()
})

test('when the app is already installed, it offers to open it, or Close to stay in the browser', async ({ page }) => {
  await page.goto('/?homescreen=android-installed')
  const prompt = page.getByRole('alertdialog', { name: 'Open the App' })
  await expect(prompt.getByRole('button', { name: 'Open App' })).toBeFocused()
  await expect(prompt.getByText('View More')).toHaveCount(0)
  await prompt.locator('.btns').getByRole('button', { name: 'Close' }).click() // not Windows 98's title bar X
  await expect(prompt).toBeHidden()
  await page.getByRole('button', { name: /Tap to launch/ }).click()
  await page.getByRole('tab', { name: 'Progress' }).click()
  await expect(page.getByRole('tab', { name: 'Progress' })).toHaveAttribute('aria-selected', 'true')
})

test("on an iPhone outside Safari, it sends you to Safari with the link copied", async ({ page, context, browserName }) => {
  test.skip(browserName !== 'webkit', 'clipboard permissions differ by engine')
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
  await page.goto('/?homescreen=ios-other')
  const prompt = page.getByRole('alertdialog', { name: 'Open in Safari' })
  await expect(prompt.getByText('To add Good Dogs Only to your Home Screen, open it in Safari.')).toBeVisible()
  await prompt.getByRole('button', { name: 'Copy Link' }).click()
  await expect(prompt.getByRole('button', { name: 'Copied' })).toBeVisible()
  await prompt.locator('.btns').getByRole('button', { name: 'Close' }).click()
  await expect(prompt).toBeHidden()
})

test('the prompt stays out of the way on a computer', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto('/')
  await page.getByRole('button', { name: /Tap to launch/ }).click()
  await expect(page.getByRole('tab', { name: 'Dogdex' })).toBeVisible()
  await expect(page.getByRole('alertdialog')).toBeHidden()
  await page.close()
})
