import { test, expect } from '@playwright/test'

test.describe('i18n', () => {
  test('redirects bare /groups path to locale-prefixed URL', async ({ page }) => {
    await page.goto('/groups')
    await page.waitForURL(/\/(en|vi)\/groups/)
    await expect(page).toHaveURL(/\/(en|vi)\/groups/)
  })

  test("English groups page shows 'Your balance'", async ({ page }) => {
    await page.goto('/en/groups')
    await expect(page.getByText(/your balance/i)).toBeVisible()
  })

  test('Vietnamese groups page has Vietnamese nav and URLs', async ({ page }) => {
    await page.goto('/vi/groups')
    await expect(page.getByText('Nhóm').first()).toBeVisible()
    await expect(page.locator('a[href*="/vi/"]').first()).toBeVisible()
  })

  test('switching locale via URL prefix changes nav language', async ({ page }) => {
    await page.goto('/vi/groups')
    await expect(page.getByText('Nhóm').first()).toBeVisible()
    await page.goto('/en/groups')
    await expect(page.getByText(/your balance/i)).toBeVisible()
    await expect(page.getByText('Groups').first()).toBeVisible()
  })

  test("English notifications page shows 'Activity'", async ({ page }) => {
    await page.goto('/en/notifications')
    await expect(page.getByText('Activity').first()).toBeVisible()
  })

  test("Vietnamese notifications page shows 'Hoạt động'", async ({ page }) => {
    await page.goto('/vi/notifications')
    await expect(page.getByText('Hoạt động')).toBeVisible()
  })

  test("English add expense page shows 'What's this for?' placeholder", async ({ page }) => {
    await page.goto('/en/groups/new')
    await page.getByLabel('Group Name').fill(`i18n Group ${Date.now()}`)
    await page.getByRole('button', { name: /create group/i }).click()
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/)
    await page.getByRole('link', { name: /add an expense/i }).click()
    await page.waitForURL(/\/expenses\/new$/)
    await expect(page.getByPlaceholder(/what.*this for/i)).toBeVisible()
  })

  test("Vietnamese settle page shows 'Người trả' label", async ({ page }) => {
    await page.goto('/vi/groups/new')
    await page.getByLabel(/tên nhóm|group name/i).fill(`vi Group ${Date.now()}`)
    await page.getByRole('button', { name: /tạo nhóm|tạo|create group/i }).click()
    await page.waitForURL(/\/vi\/groups\/[a-f0-9-]{36}$/)
    await page.goto(page.url() + '/settle')
    await expect(page.getByText(/người trả/i).first()).toBeVisible()
  })
})
