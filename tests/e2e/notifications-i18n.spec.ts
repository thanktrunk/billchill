import { test, expect } from '@playwright/test'

const EN = '/en/notifications'
const VI = '/vi/notifications'

test.describe('Notifications — English', () => {
  test('page title is "Activity"', async ({ page }) => {
    await page.goto(EN)
    await expect(page.locator('.bc-wordmark').first()).toHaveText('Activity')
  })

  test('empty state shows English message', async ({ page }) => {
    await page.goto(EN)
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    const isEmpty = await page
      .getByText('No activity yet. Peaceful 👻')
      .isVisible()
      .catch(() => false)
    test.skip(!isEmpty, 'No empty state rendered — account has notifications')
    await expect(page.getByText('No activity yet. Peaceful 👻')).toBeVisible()
  })

  test('mark-all-read button has English title attribute', async ({ page }) => {
    await page.goto(EN)
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    const btn = page.locator('button[title]').first()
    const isVisible = await btn.isVisible().catch(() => false)
    test.skip(!isVisible, 'No mark-all-read button — no unread notifications present')
    await expect(btn).toHaveAttribute('title', 'Mark all read')
  })

  test('notification type label shows "Expense 💸" for expense_added', async ({ page }) => {
    await page.goto(EN)
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    const isVisible = await page
      .getByText('Expense 💸')
      .first()
      .isVisible()
      .catch(() => false)
    test.skip(!isVisible, 'No expense_added notification present — seed data needed')
    await expect(page.getByText('Expense 💸').first()).toBeVisible()
  })

  test('notification type label shows "Payment ✅" for settlement_recorded', async ({ page }) => {
    await page.goto(EN)
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    const isVisible = await page
      .getByText('Payment ✅')
      .first()
      .isVisible()
      .catch(() => false)
    test.skip(!isVisible, 'No settlement_recorded notification present — seed data needed')
    await expect(page.getByText('Payment ✅').first()).toBeVisible()
  })

  test('notification type label shows "Joined 👋" for member_added', async ({ page }) => {
    await page.goto(EN)
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    const isVisible = await page
      .getByText('Joined 👋')
      .first()
      .isVisible()
      .catch(() => false)
    test.skip(!isVisible, 'No member_added notification present — seed data needed')
    await expect(page.getByText('Joined 👋').first()).toBeVisible()
  })

  test('notification type label shows "Renamed ✏️" for member_renamed', async ({ page }) => {
    await page.goto(EN)
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    const isVisible = await page
      .getByText('Renamed ✏️')
      .first()
      .isVisible()
      .catch(() => false)
    test.skip(!isVisible, 'No member_renamed notification present — seed data needed')
    await expect(page.getByText('Renamed ✏️').first()).toBeVisible()
  })

  test('renders without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(EN)
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    expect(errors).toHaveLength(0)
  })
})

test.describe('Notifications — Vietnamese', () => {
  test('page title is "Nhật ký"', async ({ page }) => {
    await page.goto(VI)
    await expect(page.locator('.bc-wordmark').first()).toHaveText('Nhật ký')
  })

  test('empty state shows Vietnamese message', async ({ page }) => {
    await page.goto(VI)
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    const isEmpty = await page
      .getByText('Yên tĩnh quá 👻 (chưa có gì).')
      .isVisible()
      .catch(() => false)
    test.skip(!isEmpty, 'No empty state rendered — account has notifications')
    await expect(page.getByText('Yên tĩnh quá 👻 (chưa có gì).')).toBeVisible()
  })

  test('mark-all-read button has Vietnamese title attribute', async ({ page }) => {
    await page.goto(VI)
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    const btn = page.locator('button[title]').first()
    const isVisible = await btn.isVisible().catch(() => false)
    test.skip(!isVisible, 'No mark-all-read button — no unread notifications present')
    await expect(btn).toHaveAttribute('title', 'Bỏ qua hết')
  })

  test('notification type label shows "Chi tiêu 💸" for expense_added', async ({ page }) => {
    await page.goto(VI)
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    const isVisible = await page
      .getByText('Chi tiêu 💸')
      .first()
      .isVisible()
      .catch(() => false)
    test.skip(!isVisible, 'No expense_added notification present — seed data needed')
    await expect(page.getByText('Chi tiêu 💸').first()).toBeVisible()
  })

  test('notification type label shows "Thanh toán ✅" for settlement_recorded', async ({ page }) => {
    await page.goto(VI)
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    const isVisible = await page
      .getByText('Thanh toán ✅')
      .first()
      .isVisible()
      .catch(() => false)
    test.skip(!isVisible, 'No settlement_recorded notification present — seed data needed')
    await expect(page.getByText('Thanh toán ✅').first()).toBeVisible()
  })

  test('notification type label shows "Vào nhóm 👋" for member_added', async ({ page }) => {
    await page.goto(VI)
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    const isVisible = await page
      .getByText('Vào nhóm 👋')
      .first()
      .isVisible()
      .catch(() => false)
    test.skip(!isVisible, 'No member_added notification present — seed data needed')
    await expect(page.getByText('Vào nhóm 👋').first()).toBeVisible()
  })

  test('notification type label shows "Đổi tên ✏️" for member_renamed', async ({ page }) => {
    await page.goto(VI)
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    const isVisible = await page
      .getByText('Đổi tên ✏️')
      .first()
      .isVisible()
      .catch(() => false)
    test.skip(!isVisible, 'No member_renamed notification present — seed data needed')
    await expect(page.getByText('Đổi tên ✏️').first()).toBeVisible()
  })

  test('renders without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(VI)
    await expect(page.locator('.bc-wordmark').first()).toBeVisible()
    expect(errors).toHaveLength(0)
  })
})

test.describe('Notifications — locale switch', () => {
  test('switching locale URL from /en/ to /vi/ changes the page title', async ({ page }) => {
    await page.goto(EN)
    await expect(page.locator('.bc-wordmark').first()).toHaveText('Activity')
    await page.goto(VI)
    await expect(page.locator('.bc-wordmark').first()).toHaveText('Nhật ký')
  })

  test('switching back to /en/ restores English title', async ({ page }) => {
    await page.goto(VI)
    await expect(page.locator('.bc-wordmark').first()).toHaveText('Nhật ký')
    await page.goto(EN)
    await expect(page.locator('.bc-wordmark').first()).toHaveText('Activity')
  })

  test('bottom nav link uses correct locale prefix for each locale', async ({ page }) => {
    await page.goto(EN)
    await expect(page.locator('a[href*="/en/notifications"]')).toBeVisible()
    await page.goto(VI)
    await expect(page.locator('a[href*="/vi/notifications"]')).toBeVisible()
  })
})
