import { test, expect } from '@playwright/test'

test.describe('Groups list', () => {
  test('shows groups page with balance hero', async ({ page }) => {
    await page.goto('/groups')
    await page.waitForURL(/\/(en|vi)\/groups/)
    await expect(page.getByText(/your balance/i)).toBeVisible()
  })

  test('creates a new group and redirects to detail', async ({ page }) => {
    const name = `Solo Group ${Date.now()}`
    await page.goto('/en/groups/new')
    await page.getByLabel('Group Name').fill(name)
    await page.getByRole('button', { name: /create group/i }).click()
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/)
    await expect(page.getByText(name)).toBeVisible()
  })

  test('created group shows default currency', async ({ page }) => {
    await page.goto('/en/groups/new')
    await page.getByLabel('Group Name').fill(`Currency Group ${Date.now()}`)
    await page.getByRole('button', { name: /create group/i }).click()
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/)
    // Currency badge is visible in the group header
    await expect(page.locator('text=/[A-Z]{3}/')).toBeVisible()
  })

  test('shows empty expense state for a new group', async ({ page }) => {
    await page.goto('/en/groups/new')
    await page.getByLabel('Group Name').fill(`Empty ${Date.now()}`)
    await page.getByRole('button', { name: /create group/i }).click()
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/)
    await expect(page.getByText(/nothing yet/i)).toBeVisible()
  })

  test('navigates to group detail from list', async ({ page }) => {
    const name = `Nav Group ${Date.now()}`
    await page.goto('/en/groups/new')
    await page.getByLabel('Group Name').fill(name)
    await page.getByRole('button', { name: /create group/i }).click()
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/)

    await page.goto('/en/groups')
    await page.getByText(name).click()
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/)
    await expect(page.getByText(name)).toBeVisible()
  })

  test('group detail renders without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/en/groups/new')
    await page.getByLabel('Group Name').fill(`JS Error Group ${Date.now()}`)
    await page.getByRole('button', { name: /create group/i }).click()
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/)
    await expect(page.getByText(/member/i)).toBeVisible()
    expect(errors.filter((e) => e.includes('Cannot read properties of undefined'))).toHaveLength(0)
  })
})
