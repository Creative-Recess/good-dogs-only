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
  await expect(help.getByText('Open it from the new icon.', { exact: false })).toBeVisible()
})

test("opened in a phone's browser, it shows how to add it to the Home Screen until Don't Show Again", async ({ page }, info) => {
  await page.addInitScript(() => {
    // Turn the prompt back on for this test's first visit only (the reload below must see Don't Show Again).
    if (!sessionStorage.getItem('tested')) localStorage.removeItem('good-dogs-only.home-screen-prompt')
    sessionStorage.setItem('tested', '1')
  })
  await page.goto('/')
  await page.getByRole('button', { name: /Tap to launch/ }).click()
  const prompt = page.getByRole('alertdialog', { name: 'Add to Home Screen' })
  await expect(prompt).toBeVisible()
  await expect(prompt.getByText(info.project.name === 'android' ? 'Install app' : 'View More')).toBeVisible()
  // Only an iPhone keeps the Home Screen app's spots apart from the browser's.
  await expect(prompt.getByText("don't move across to the app")).toHaveCount(info.project.name === 'android' ? 0 : 1)
  await prompt.getByRole('button', { name: "Don't Show Again" }).click()
  await expect(prompt).toBeHidden()
  await page.reload()
  await page.getByRole('button', { name: /Tap to launch/ }).click()
  await expect(page.getByRole('tab', { name: 'Dogdex' })).toBeVisible()
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
