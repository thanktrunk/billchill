import { test, expect } from "@playwright/test";
import path from "path";

const SESSION_FILE = path.join(__dirname, ".auth/session.json");

// ── Groups list ─────────────────────────────────────────────────

test.describe("Groups list", () => {
  test("shows groups page with balance hero", async ({ page }) => {
    await page.goto("/groups");
    await page.waitForURL(/\/(en|vi)\/groups/);
    await expect(page.getByText(/your balance/i)).toBeVisible();
  });

  test("creates a new group and redirects to detail", async ({ page }) => {
    const name = `Solo Group ${Date.now()}`;
    await page.goto("/en/groups/new");
    await page.getByLabel("Group Name").fill(name);
    const currencyInput = page.getByLabel("Currency");
    await currencyInput.clear();
    await currencyInput.fill("EUR");
    await page.getByRole("button", { name: /create group/i }).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByText("EUR")).toBeVisible();
  });

  test("shows empty expense state for a new group", async ({ page }) => {
    await page.goto("/en/groups/new");
    await page.getByLabel("Group Name").fill(`Empty ${Date.now()}`);
    await page.getByRole("button", { name: /create group/i }).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    await expect(page.getByText(/no expenses yet/i)).toBeVisible();
  });

  test("navigates to group detail from list", async ({ page }) => {
    await page.goto("/en/groups/new");
    const name = `Nav Group ${Date.now()}`;
    await page.getByLabel("Group Name").fill(name);
    await page.getByRole("button", { name: /create group/i }).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);

    await page.goto("/en/groups");
    await page.getByText(name).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    await expect(page.getByText(name)).toBeVisible();
  });
});

// ── Group flows (expenses, balances, settle) ────────────────────
//
// All these tests share ONE group created in beforeAll.
// describe.serial ensures they run in order in one worker context;
// beforeAll recreates the group if the worker restarts, so groupUrl
// is always valid before any test in this block executes.

test.describe.serial("Group flows", () => {
  let groupUrl = "";

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: SESSION_FILE });
    const page = await context.newPage();
    await page.goto("/en/groups/new");
    await page.getByLabel("Group Name").fill("E2E Flows Group");
    await page.getByRole("button", { name: /create group/i }).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    groupUrl = page.url();
    await context.close();
  });

  test("group detail renders without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(groupUrl);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/member/i)).toBeVisible();
    expect(errors.filter((e) => e.includes("Cannot read properties of undefined"))).toHaveLength(0);
  });

  // ── Expenses ────────────────────────────────────────────────

  test("shows add expense button on group page", async ({ page }) => {
    await page.goto(groupUrl);
    await expect(page.getByRole("link", { name: /add expense/i })).toBeVisible();
  });

  test("navigates to add expense page", async ({ page }) => {
    await page.goto(groupUrl);
    await page.getByRole("link", { name: /add expense/i }).click();
    await page.waitForURL(/\/expenses\/new$/);
    await expect(page.getByText(/add expense/i)).toBeVisible();
  });

  test("continue button is disabled when amount is zero", async ({ page }) => {
    await page.goto(groupUrl + "/expenses/new");
    await expect(page.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  test("adds expense via quick-add chip and saves", async ({ page }) => {
    await page.goto(groupUrl + "/expenses/new");
    await page.getByPlaceholder(/what's this for/i).fill("Team dinner");
    // Quick-add chips: $10, $20, $50, $100 — click the $50 chip
    await page.getByRole("button", { name: /50/ }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();
    // Step 2: description and save button visible
    await expect(page.getByText("Team dinner")).toBeVisible();
    await page.getByRole("button", { name: /save expense/i }).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    await expect(page.getByText("Team dinner")).toBeVisible();
  });

  test("shows expense in group detail after adding", async ({ page }) => {
    await page.goto(groupUrl);
    await expect(page.getByText("Team dinner")).toBeVisible();
  });

  test("adds expense using numpad digit buttons", async ({ page }) => {
    await page.goto(groupUrl + "/expenses/new");
    await page.getByPlaceholder(/what's this for/i).fill("Coffee");
    await page.getByRole("button", { name: "2", exact: true }).click();
    await page.getByRole("button", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /save expense/i }).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    await expect(page.getByText("Coffee")).toBeVisible();
  });

  test("back button on details step returns to amount step", async ({ page }) => {
    await page.goto(groupUrl + "/expenses/new");
    await page.getByRole("button", { name: /20/ }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();
    // Details step is visible — back button (first SVG button in top bar)
    await expect(page.getByText(/paid by/i)).toBeVisible();
    await page.locator("button").filter({ has: page.locator("svg") }).first().click();
    // Back on amount step — continue button visible again
    await expect(page.getByRole("button", { name: /continue/i })).toBeVisible();
  });

  // ── Balances ─────────────────────────────────────────────────

  test("shows balances tab button on group detail", async ({ page }) => {
    await page.goto(groupUrl);
    await expect(page.getByRole("button", { name: /balances/i })).toBeVisible();
  });

  test("switches to balances tab and shows member balances", async ({ page }) => {
    await page.goto(groupUrl);
    await page.getByRole("button", { name: /balances/i }).click();
    await expect(page.getByText(/member balances/i)).toBeVisible();
  });

  test("balances tab shows YOU label for current user", async ({ page }) => {
    await page.goto(groupUrl);
    await page.getByRole("button", { name: /balances/i }).click();
    await expect(page.getByText("YOU")).toBeVisible();
  });

  test("settle up link navigates to settle page", async ({ page }) => {
    await page.goto(groupUrl);
    await page.getByRole("link", { name: /settle up/i }).click();
    await page.waitForURL(/\/settle$/);
    await expect(page.getByText(/settle up/i)).toBeVisible();
  });

  // ── Settle Up ────────────────────────────────────────────────

  test("settle page renders from/to member selectors", async ({ page }) => {
    await page.goto(groupUrl + "/settle");
    await expect(page.getByText("From", { exact: true })).toBeVisible();
    await expect(page.getByText("To", { exact: true })).toBeVisible();
  });

  test("record button is disabled when amount is zero", async ({ page }) => {
    await page.goto(groupUrl + "/settle");
    await expect(page.getByRole("button", { name: /record settlement/i })).toBeDisabled();
  });

  test("entering amount via numpad enables record button", async ({ page }) => {
    await page.goto(groupUrl + "/settle");
    await page.getByRole("button", { name: "1", exact: true }).click();
    await page.getByRole("button", { name: "0", exact: true }).click();
    await expect(page.getByRole("button", { name: /record settlement/i })).toBeEnabled();
  });

  // Recording a settlement requires 2 group members; the test group has only
  // the creator, so the full settle flow is covered via manual/integration tests.
});

// ── Navigation ─────────────────────────────────────────────────

test.describe("Navigation", () => {
  test("bottom nav has groups, activity and profile links", async ({ page }) => {
    await page.goto("/en/groups");
    await expect(page.locator('a[href*="/en/groups"]').first()).toBeVisible();
    await expect(page.locator('a[href*="/en/notifications"]')).toBeVisible();
    await expect(page.locator('a[href*="/en/profile"]')).toBeVisible();
  });

  test("activity nav link navigates to notifications page", async ({ page }) => {
    await page.goto("/en/groups");
    await page.locator('a[href*="/en/notifications"]').click();
    await page.waitForURL(/\/en\/notifications/);
    await expect(page.getByText("Activity").first()).toBeVisible();
  });

  test("profile nav link navigates to profile page", async ({ page }) => {
    await page.goto("/en/groups");
    await page.locator('a[href*="/en/profile"]').click();
    await page.waitForURL(/\/en\/profile/);
    await expect(page.getByText("Profile").first()).toBeVisible();
  });

  test("logout link on profile page links to /auth/logout", async ({ page }) => {
    await page.goto("/en/profile");
    const logoutLink = page.getByRole("link", { name: /log out/i });
    await expect(logoutLink).toBeVisible();
    await expect(logoutLink).toHaveAttribute("href", /\/auth\/logout/);
  });

});

// ── Notifications ───────────────────────────────────────────────

test.describe("Notifications", () => {
  test("shows activity page with title 'Activity'", async ({ page }) => {
    await page.goto("/en/notifications");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Activity").first()).toBeVisible();
  });

  test("shows empty state or notification items", async ({ page }) => {
    await page.goto("/en/notifications");
    await page.waitForLoadState("networkidle");
    const hasEmpty = await page.getByText(/no activity yet/i).isVisible().catch(() => false);
    const hasItems = (await page.locator('a[href*="/en/groups/"]').count()) > 0;
    expect(hasEmpty || hasItems).toBeTruthy();
  });

  test("mark all read button clears itself after click", async ({ page }) => {
    await page.goto("/en/notifications");
    await page.waitForLoadState("networkidle");
    const markAllBtn = page.locator('button[title]').filter({ hasText: "" });
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
      await expect(markAllBtn).not.toBeVisible();
    }
  });
});

// ── Profile ────────────────────────────────────────────────────

test.describe("Profile", () => {
  test("shows profile page title", async ({ page }) => {
    await page.goto("/en/profile");
    await expect(page.getByText("Profile").first()).toBeVisible();
  });

  test("shows preferences section", async ({ page }) => {
    await page.goto("/en/profile");
    await expect(page.getByText(/preferences/i)).toBeVisible();
  });

  test("shows stats: groups and expenses labels", async ({ page }) => {
    await page.goto("/en/profile");
    await expect(page.getByText("Groups").first()).toBeVisible();
    await expect(page.getByText("Expenses").first()).toBeVisible();
  });

  test("logout link is visible and links to /auth/logout", async ({ page }) => {
    await page.goto("/en/profile");
    const logoutLink = page.getByRole("link", { name: /log out/i });
    await expect(logoutLink).toBeVisible();
    await expect(logoutLink).toHaveAttribute("href", /\/auth\/logout/);
  });

  test("language switcher links to Vietnamese profile", async ({ page }) => {
    await page.goto("/en/profile");
    const viLink = page.locator('a[href="/vi/profile"]');
    if (await viLink.isVisible()) {
      await viLink.click();
      await page.waitForURL(/\/vi\/profile/);
      await expect(page.getByText("Hồ sơ").first()).toBeVisible();
    }
  });
});

// ── i18n ────────────────────────────────────────────────────────

test.describe("i18n", () => {
  test("redirects bare /groups path to locale-prefixed URL", async ({ page }) => {
    await page.goto("/groups");
    await page.waitForURL(/\/(en|vi)\/groups/);
    await expect(page).toHaveURL(/\/(en|vi)\/groups/);
  });

  test("English groups page shows 'Your balance'", async ({ page }) => {
    await page.goto("/en/groups");
    await expect(page.getByText(/your balance/i)).toBeVisible();
  });

  test("Vietnamese groups page has Vietnamese nav and URLs", async ({ page }) => {
    await page.goto("/vi/groups");
    // Active nav tab label is rendered client-side and shows "Nhóm" in Vietnamese
    await expect(page.getByText("Nhóm").first()).toBeVisible();
    // All nav links use the /vi/ prefix
    await expect(page.locator('a[href*="/vi/"]').first()).toBeVisible();
  });

  test("switching locale via URL prefix changes nav language", async ({ page }) => {
    await page.goto("/vi/groups");
    await expect(page.getByText("Nhóm").first()).toBeVisible();
    await page.goto("/en/groups");
    await expect(page.getByText(/your balance/i)).toBeVisible();
    // Active nav tab in English
    await expect(page.getByText("Groups").first()).toBeVisible();
  });

  test("English notifications page shows 'Activity'", async ({ page }) => {
    await page.goto("/en/notifications");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Activity").first()).toBeVisible();
  });

  test("Vietnamese notifications page shows 'Hoạt động'", async ({ page }) => {
    await page.goto("/vi/notifications");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Hoạt động")).toBeVisible();
  });

  test("English add expense page shows 'What's this for?' placeholder", async ({ page }) => {
    await page.goto("/en/groups/new");
    await page.getByLabel("Group Name").fill(`i18n Group ${Date.now()}`);
    await page.getByRole("button", { name: /create group/i }).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    await page.getByRole("link", { name: /add expense/i }).click();
    await page.waitForURL(/\/expenses\/new$/);
    await expect(page.getByPlaceholder(/what's this for/i)).toBeVisible();
  });

  test("Vietnamese settle page shows 'Từ' label", async ({ page }) => {
    await page.goto("/vi/groups/new");
    await page.getByLabel(/tên nhóm|group name/i).fill(`vi Group ${Date.now()}`);
    await page.getByRole("button", { name: /tạo nhóm|create group/i }).click();
    await page.waitForURL(/\/vi\/groups\/[a-f0-9-]{36}$/);
    const settleUrl = page.url() + "/settle";
    await page.goto(settleUrl);
    await expect(page.getByText(/từ/i).first()).toBeVisible();
  });
});
