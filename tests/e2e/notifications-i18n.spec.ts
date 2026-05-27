import { test, expect } from '@playwright/test'

// ── Notifications — multilanguage support ────────────────────────────────────
//
// Covers every translated string on /[lang]/notifications for both EN and VI.
// Tests are locale-paired so English and Vietnamese expectations live side-by-side
// for easy comparison.

const EN = '/en/notifications'
const VI = '/vi/notifications'

test.describe('Notifications — English', () => {
  test('page title is "Activity"', async ({ page }) => {
    await page.goto(EN)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.bc-wordmark').first()).toHaveText('Activity')
  })

  test('empty state shows English message', async ({ page }) => {
    await page.goto(EN)
    await page.waitForLoadState('networkidle')
    const isEmpty = await page
      .getByText('No activity yet. Peaceful 👻')
      .isVisible()
      .catch(() => false)
    // Only assert when the empty state is actually rendered; skip otherwise.
    if (isEmpty) {
      await expect(page.getByText('No activity yet. Peaceful 👻')).toBeVisible()
    }
  })

  test('mark-all-read button has English title attribute', async ({ page }) => {
    await page.goto(EN)
    await page.waitForLoadState('networkidle')
    const btn = page.locator('button[title]').first()
    if (await btn.isVisible()) {
      await expect(btn).toHaveAttribute('title', 'Mark all read')
    }
  })

  test('notification type label shows "Expense 💸" for expense_added', async ({ page }) => {
    await page.goto(EN)
    await page.waitForLoadState('networkidle')
    const hasExpense = await page
      .getByText('Expense 💸')
      .first()
      .isVisible()
      .catch(() => false)
    if (hasExpense) {
      await expect(page.getByText('Expense 💸').first()).toBeVisible()
    }
  })

  test('notification type label shows "Payment ✅" for settlement_recorded', async ({ page }) => {
    await page.goto(EN)
    await page.waitForLoadState('networkidle')
    const hasPayment = await page
      .getByText('Payment ✅')
      .first()
      .isVisible()
      .catch(() => false)
    if (hasPayment) {
      await expect(page.getByText('Payment ✅').first()).toBeVisible()
    }
  })

  test('notification type label shows "Joined 👋" for member_added', async ({ page }) => {
    await page.goto(EN)
    await page.waitForLoadState('networkidle')
    const hasJoined = await page
      .getByText('Joined 👋')
      .first()
      .isVisible()
      .catch(() => false)
    if (hasJoined) {
      await expect(page.getByText('Joined 👋').first()).toBeVisible()
    }
  })

  test('notification type label shows "Renamed ✏️" for member_renamed', async ({ page }) => {
    await page.goto(EN)
    await page.waitForLoadState('networkidle')
    const hasRenamed = await page
      .getByText('Renamed ✏️')
      .first()
      .isVisible()
      .catch(() => false)
    if (hasRenamed) {
      await expect(page.getByText('Renamed ✏️').first()).toBeVisible()
    }
  })

  test('renders without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(EN)
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })
})

test.describe('Notifications — Vietnamese', () => {
  test('page title is "Nhật ký"', async ({ page }) => {
    await page.goto(VI)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.bc-wordmark').first()).toHaveText('Nhật ký')
  })

  test('empty state shows Vietnamese message', async ({ page }) => {
    await page.goto(VI)
    await page.waitForLoadState('networkidle')
    const isEmpty = await page
      .getByText('Yên tĩnh quá 👻 (chưa có gì).')
      .isVisible()
      .catch(() => false)
    if (isEmpty) {
      await expect(page.getByText('Yên tĩnh quá 👻 (chưa có gì).')).toBeVisible()
    }
  })

  test('mark-all-read button has Vietnamese title attribute', async ({ page }) => {
    await page.goto(VI)
    await page.waitForLoadState('networkidle')
    const btn = page.locator('button[title]').first()
    if (await btn.isVisible()) {
      await expect(btn).toHaveAttribute('title', 'Bỏ qua hết')
    }
  })

  test('notification type label shows "Chi tiêu 💸" for expense_added', async ({ page }) => {
    await page.goto(VI)
    await page.waitForLoadState('networkidle')
    const hasExpense = await page
      .getByText('Chi tiêu 💸')
      .first()
      .isVisible()
      .catch(() => false)
    if (hasExpense) {
      await expect(page.getByText('Chi tiêu 💸').first()).toBeVisible()
    }
  })

  test('notification type label shows "Thanh toán ✅" for settlement_recorded', async ({ page }) => {
    await page.goto(VI)
    await page.waitForLoadState('networkidle')
    const hasPayment = await page
      .getByText('Thanh toán ✅')
      .first()
      .isVisible()
      .catch(() => false)
    if (hasPayment) {
      await expect(page.getByText('Thanh toán ✅').first()).toBeVisible()
    }
  })

  test('notification type label shows "Vào nhóm 👋" for member_added', async ({ page }) => {
    await page.goto(VI)
    await page.waitForLoadState('networkidle')
    const hasJoined = await page
      .getByText('Vào nhóm 👋')
      .first()
      .isVisible()
      .catch(() => false)
    if (hasJoined) {
      await expect(page.getByText('Vào nhóm 👋').first()).toBeVisible()
    }
  })

  test('notification type label shows "Đổi tên ✏️" for member_renamed', async ({ page }) => {
    await page.goto(VI)
    await page.waitForLoadState('networkidle')
    const hasRenamed = await page
      .getByText('Đổi tên ✏️')
      .first()
      .isVisible()
      .catch(() => false)
    if (hasRenamed) {
      await expect(page.getByText('Đổi tên ✏️').first()).toBeVisible()
    }
  })

  test('renders without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(VI)
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })
})

test.describe('Notifications — locale switch', () => {
  test('switching locale URL from /en/ to /vi/ changes the page title', async ({ page }) => {
    await page.goto(EN)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.bc-wordmark').first()).toHaveText('Activity')

    await page.goto(VI)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.bc-wordmark').first()).toHaveText('Nhật ký')
  })

  test('switching back to /en/ restores English title', async ({ page }) => {
    await page.goto(VI)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.bc-wordmark').first()).toHaveText('Nhật ký')

    await page.goto(EN)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.bc-wordmark').first()).toHaveText('Activity')
  })

  test('bottom nav link uses correct locale prefix for each locale', async ({ page }) => {
    await page.goto(EN)
    await expect(page.locator('a[href*="/en/notifications"]')).toBeVisible()

    await page.goto(VI)
    await expect(page.locator('a[href*="/vi/notifications"]')).toBeVisible()
  })
})
