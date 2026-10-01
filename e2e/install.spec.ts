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

test('Help shows how to add it to the Home Screen when opened in Safari', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Tap to launch/ }).click()
  await openHelp(page)
  await expect(page.getByText('Open it from the new icon.', { exact: false })).toBeVisible()
})
