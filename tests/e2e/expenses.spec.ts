import { test, expect } from '@playwright/test'
import { createGroup } from './helpers'

// All tests in this file share one group created in beforeAll.
// describe.serial ensures ordering within a single worker context.

test.describe
  .serial('Expenses', () => {
    let groupUrl = ''

    test.beforeAll(async ({ browser }) => {
      groupUrl = await createGroup(browser, 'E2E Expenses Group')
    })

    // ── Add expense page ─────────────────────────────────────────────

    test('shows add expense button on group page', async ({ page }) => {
      await page.goto(groupUrl)
      await expect(page.getByRole('link', { name: /add an expense/i })).toBeVisible()
    })

    test('navigates to add expense page', async ({ page }) => {
      await page.goto(groupUrl)
      await page.getByRole('link', { name: /add an expense/i }).click()
      await page.waitForURL(/\/expenses\/new$/)
      await expect(page.getByText(/add expense/i)).toBeVisible()
    })

    test('continue button is disabled when amount is zero', async ({ page }) => {
      await page.goto(groupUrl + '/expenses/new')
      await expect(page.getByRole('button', { name: /continue/i })).toBeDisabled()
    })

    test('back button on details step returns to amount step', async ({ page }) => {
      await page.goto(groupUrl + '/expenses/new')
      await page.getByRole('button', { name: /20/ }).first().click()
      await page.getByRole('button', { name: /continue/i }).click()
      await expect(page.getByText(/paid by/i)).toBeVisible()
      await page
        .locator('button')
        .filter({ has: page.locator('svg') })
        .first()
        .click()
      await expect(page.getByRole('button', { name: /continue/i })).toBeVisible()
    })

    // ── Add expense via quick-add chip ───────────────────────────────

    test('adds expense via quick-add chip and saves', async ({ page }) => {
      await page.goto(groupUrl + '/expenses/new')
      await page.getByPlaceholder(/what.*this for/i).fill('Team dinner')
      await page.getByRole('button', { name: /50/ }).first().click()
      await page.getByRole('button', { name: /continue/i }).click()
      await expect(page.getByText('Team dinner')).toBeVisible()
      await page.getByRole('button', { name: /save it/i }).click()
      await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/)
      await expect(page.getByText('Team dinner')).toBeVisible()
    })

    // ── Add expense via numpad ───────────────────────────────────────

    test('adds expense using numpad digit buttons', async ({ page }) => {
      await page.goto(groupUrl + '/expenses/new')
      await page.getByPlaceholder(/what.*this for/i).fill('Coffee')
      await page.getByRole('button', { name: '2', exact: true }).click()
      await page.getByRole('button', { name: '5', exact: true }).click()
      await page.getByRole('button', { name: /continue/i }).click()
      await page.getByRole('button', { name: /save it/i }).click()
      await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/)
      await expect(page.getByText('Coffee')).toBeVisible()
    })

    // ── Split method tabs ────────────────────────────────────────────

    test('split method buttons are visible on details step', async ({ page }) => {
      await page.goto(groupUrl + '/expenses/new')
      await page.getByRole('button', { name: /50/ }).first().click()
      await page.getByRole('button', { name: /continue/i }).click()
      await expect(page.getByRole('button', { name: 'Equal', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'By amount', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'By shares', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'By %', exact: true })).toBeVisible()
    })

    test('switching to shares split method does not break the page', async ({ page }) => {
      await page.goto(groupUrl + '/expenses/new')
      await page.getByRole('button', { name: /50/ }).first().click()
      await page.getByRole('button', { name: /continue/i }).click()
      await page.getByRole('button', { name: 'By shares', exact: true }).click()
      await expect(page.getByRole('button', { name: /save it/i })).toBeVisible()
    })

    test('switching to percentage split method does not break the page', async ({ page }) => {
      await page.goto(groupUrl + '/expenses/new')
      await page.getByRole('button', { name: /50/ }).first().click()
      await page.getByRole('button', { name: /continue/i }).click()
      await page.getByRole('button', { name: 'By %', exact: true }).click()
      await expect(page.getByRole('button', { name: /save it/i })).toBeVisible()
    })

    // ── Expense edit ─────────────────────────────────────────────────

    test('can edit an expense description', async ({ page }) => {
      // Add a fresh expense to edit
      await page.goto(groupUrl + '/expenses/new')
      await page.getByPlaceholder(/what.*this for/i).fill('Lunch')
      await page.getByRole('button', { name: /20/ }).first().click()
      await page.getByRole('button', { name: /continue/i }).click()
      await page.getByRole('button', { name: /save it/i }).click()
      await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/)

      // Open expense detail
      await page.getByText('Lunch').click()
      await page.waitForURL(/\/expenses\/[a-f0-9-]{36}$/)

      // Enter edit mode
      await page.getByRole('button', { name: /edit/i }).click()

      // Change description
      const descInput = page.locator('input').first()
      await descInput.clear()
      await descInput.fill('Team Lunch')

      // Save
      await page.getByRole('button', { name: /save/i }).last().click()

      // Back in view mode with updated name
      await expect(page.getByText('Team Lunch')).toBeVisible()
    })

    // ── Expense delete ───────────────────────────────────────────────

    test('can delete an expense', async ({ page }) => {
      // Add a fresh expense to delete
      await page.goto(groupUrl + '/expenses/new')
      await page.getByPlaceholder(/what.*this for/i).fill('Delete Me')
      await page.getByRole('button', { name: /10/ }).first().click()
      await page.getByRole('button', { name: /continue/i }).click()
      await page.getByRole('button', { name: /save it/i }).click()
      await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/)

      // Open expense detail
      await page.getByText('Delete Me').first().click()
      await page.waitForURL(/\/expenses\/[a-f0-9-]{36}$/)

      // Click Delete to reveal confirm dialog
      await page.getByRole('button', { name: /delete/i }).click()

      // Confirm deletion
      await page
        .getByRole('button', { name: /delete/i })
        .last()
        .click()

      // Redirected back to group — expense is gone
      await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/)
      await expect(page.getByText('Delete Me')).not.toBeVisible()
    })

    // ── Balances ─────────────────────────────────────────────────────

    test('shows balances tab button on group detail', async ({ page }) => {
      await page.goto(groupUrl)
      await expect(page.getByRole('tab', { name: /balances/i })).toBeVisible()
    })

    test('switches to balances tab and shows member balances', async ({ page }) => {
      await page.goto(groupUrl)
      await page.getByRole('tab', { name: /balances/i }).click()
      await expect(page.getByText(/member balances/i)).toBeVisible()
    })

    test('balances tab shows YOU label for current user', async ({ page }) => {
      await page.goto(groupUrl)
      await page.getByRole('tab', { name: /balances/i }).click()
      await expect(page.getByText('YOU')).toBeVisible()
    })
  })

// ── Settle Up ─────────────────────────────────────────────────────────────────

test.describe
  .serial('Settle Up', () => {
    let groupUrl = ''

    test.beforeAll(async ({ browser }) => {
      groupUrl = await createGroup(browser, 'E2E Settle Group')
    })

    test('settle up link navigates to settle page', async ({ page }) => {
      await page.goto(groupUrl)
      await page.getByRole('link', { name: /settle up/i }).click()
      await page.waitForURL(/\/settle$/)
      await expect(page.getByText(/settle up/i)).toBeVisible()
    })

    test('settle page renders from/to member selectors', async ({ page }) => {
      await page.goto(groupUrl + '/settle')
      await expect(page.getByText('From', { exact: true })).toBeVisible()
      await expect(page.getByText('To', { exact: true })).toBeVisible()
    })

    test('record button is disabled when amount is zero', async ({ page }) => {
      await page.goto(groupUrl + '/settle')
      await expect(page.getByRole('button', { name: /record payment/i })).toBeDisabled()
    })

    test('entering amount via numpad enables record button', async ({ page }) => {
      await page.goto(groupUrl + '/settle')
      await page.getByRole('button', { name: '1', exact: true }).click()
      await page.getByRole('button', { name: '0', exact: true }).click()
      await expect(page.getByRole('button', { name: /record payment/i })).toBeEnabled()
    })
  })
