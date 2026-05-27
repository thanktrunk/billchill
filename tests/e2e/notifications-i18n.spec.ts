import { test, expect } from '@playwright/test'

test.describe('Notifications', () => {
  test('English page title is "Activity"', async ({ page }) => {
    await page.goto('/en/notifications')
    await expect(page.locator('.bc-wordmark').first()).toHaveText('Activity')
  })

  test('Vietnamese page title is "Nhật ký"', async ({ page }) => {
    await page.goto('/vi/notifications')
    await expect(page.locator('.bc-wordmark').first()).toHaveText('Nhật ký')
  })
})
