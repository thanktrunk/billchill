import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('activity nav link navigates to notifications page', async ({ page }) => {
    await page.goto('/en/groups')
    await page.locator('a[href*="/en/notifications"]').click()
    await page.waitForURL(/\/en\/notifications/)
    await expect(page.getByText('Activity').first()).toBeVisible()
  })

  test('profile nav link navigates to profile page', async ({ page }) => {
    await page.goto('/en/groups')
    await page.locator('a[href*="/en/profile"]').click()
    await page.waitForURL(/\/en\/profile/)
    await expect(page.getByText('Profile').first()).toBeVisible()
  })

  test('logout link on profile page links to /auth/logout', async ({ page }) => {
    await page.goto('/en/profile')
    const logoutLink = page.getByRole('link', { name: /log out/i })
    await expect(logoutLink).toBeVisible()
    await expect(logoutLink).toHaveAttribute('href', /\/auth\/logout/)
  })
})
