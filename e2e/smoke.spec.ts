import { expect, test } from '@playwright/test'

test('home page renders the app name', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Good Dogs Only')
  await expect(page.getByRole('heading', { name: 'Good Dogs Only' })).toBeVisible()
})
