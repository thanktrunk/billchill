import { test, expect } from '@playwright/test'

test.describe('i18n', () => {
  test('redirects bare /groups path to locale-prefixed URL', async ({ page }) => {
    await page.goto('/groups')
    await page.waitForURL(/\/(en|vi)\/groups/)
    await expect(page).toHaveURL(/\/(en|vi)\/groups/)
  })

  test('switching locale via URL prefix changes nav language', async ({ page }) => {
    await page.goto('/vi/groups')
    await expect(page.getByText('Nhóm').first()).toBeVisible()
    await page.goto('/en/groups')
    await expect(page.getByText(/your balance/i)).toBeVisible()
    await expect(page.getByText('Groups').first()).toBeVisible()
  })
})
