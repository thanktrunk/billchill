import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('bottom nav has groups, activity and profile links', async ({ page }) => {
    await page.goto('/en/groups')
    await expect(page.locator('a[href*="/en/groups"]').first()).toBeVisible()
    await expect(page.locator('a[href*="/en/notifications"]')).toBeVisible()
    await expect(page.locator('a[href*="/en/profile"]')).toBeVisible()
  })

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

test.describe('Notifications page', () => {
  test("shows activity page with title 'Activity'", async ({ page }) => {
    await page.goto('/en/notifications')
    await expect(page.getByText('Activity').first()).toBeVisible()
  })

  test('shows empty state or notification items', async ({ page }) => {
    await page.goto('/en/notifications')
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    const hasEmpty = await page
      .getByText(/no activity yet/i)
      .isVisible()
      .catch(() => false)
    const hasItems = (await page.locator('a[href*="/en/groups/"]').count()) > 0 || (await page.locator('main form button').count()) > 0
    expect(hasEmpty || hasItems).toBeTruthy()
  })

  test('mark all read button clears itself after click', async ({ page }) => {
    await page.goto('/en/notifications')
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    const markAllBtn = page.locator('button[title]').filter({ hasText: '' })
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click()
      await expect(markAllBtn).not.toBeVisible()
    }
  })
})
