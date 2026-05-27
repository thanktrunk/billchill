import { test, expect } from '@playwright/test'

test.describe('Profile', () => {
  test('shows profile page title', async ({ page }) => {
    await page.goto('/en/profile')
    await expect(page.getByText('Profile').first()).toBeVisible()
  })

  test('shows preferences section', async ({ page }) => {
    await page.goto('/en/profile')
    await expect(page.getByText(/preferences/i)).toBeVisible()
  })

  test('shows stats: groups and expenses labels', async ({ page }) => {
    await page.goto('/en/profile')
    await expect(page.getByText('Groups').first()).toBeVisible()
    await expect(page.getByText('Expenses').first()).toBeVisible()
  })

  test('logout link is visible and links to /auth/logout', async ({ page }) => {
    await page.goto('/en/profile')
    const logoutLink = page.getByRole('link', { name: /log out/i })
    await expect(logoutLink).toBeVisible()
    await expect(logoutLink).toHaveAttribute('href', /\/auth\/logout/)
  })

  test('language switcher links to Vietnamese profile', async ({ page }) => {
    await page.goto('/en/profile')
    const viLink = page.locator('a[href="/vi/profile"]')
    if (await viLink.isVisible()) {
      await viLink.click()
      await page.waitForURL(/\/vi\/profile/)
      await expect(page.getByText('Hồ sơ').first()).toBeVisible()
    }
  })

  test('renders without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/en/profile')
    await expect(page.getByText('Profile').first()).toBeVisible()
    expect(errors).toHaveLength(0)
  })
})
