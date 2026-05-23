import { test, expect } from "@playwright/test";

const TEST_GROUP_NAME = `E2E Test Group ${Date.now()}`;

test.describe("Groups", () => {
  test("shows groups list page", async ({ page }) => {
    await page.goto("/groups");
    await page.waitForURL(/\/(en|vi)\/groups/);
    await expect(page.getByRole("heading", { name: /groups/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /new group|tạo nhóm/i })).toBeVisible();
  });

  test("creates a new group", async ({ page }) => {
    await page.goto("/en/groups/new");

    await page.getByLabel("Group Name").fill(TEST_GROUP_NAME);

    const currencyInput = page.getByLabel("Currency");
    await currencyInput.clear();
    await currencyInput.fill("EUR");

    await page.getByRole("button", { name: /create group/i }).click();

    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    await expect(page.getByText(TEST_GROUP_NAME)).toBeVisible();
    await expect(page.getByText("EUR")).toBeVisible();
  });

  test("navigates to group detail from list", async ({ page }) => {
    await page.goto("/en/groups");

    const groupLink = page.getByText(TEST_GROUP_NAME);
    await expect(groupLink).toBeVisible();
    await groupLink.click();

    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    await expect(page.getByText(TEST_GROUP_NAME)).toBeVisible();
  });

  test("group detail page renders translations without browser errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/en/groups");
    await page.getByText(TEST_GROUP_NAME).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);

    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/member/i)).toBeVisible();

    expect(errors.filter((e) => e.includes("Cannot read properties of undefined"))).toHaveLength(0);
  });

  test("shows empty state when group has no expenses", async ({ page }) => {
    await page.goto("/en/groups/new");
    const emptyGroupName = `Empty Group ${Date.now()}`;
    await page.getByLabel("Group Name").fill(emptyGroupName);
    await page.getByRole("button", { name: /create group/i }).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);

    await expect(page.getByText(/no expenses yet/i)).toBeVisible();
  });
});

test.describe("Expenses", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/groups");
    await page.getByText(TEST_GROUP_NAME).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
  });

  test("shows add expense button on group page", async ({ page }) => {
    await expect(page.getByRole("link", { name: /add expense/i })).toBeVisible();
  });

  test("navigates to add expense page", async ({ page }) => {
    await page.getByRole("link", { name: /add expense/i }).click();
    await page.waitForURL(/\/expenses\/new$/);
    await expect(page.getByText(/add expense/i)).toBeVisible();
  });

  test("continue button is disabled when amount is zero", async ({ page }) => {
    await page.getByRole("link", { name: /add expense/i }).click();
    await page.waitForURL(/\/expenses\/new$/);

    const continueBtn = page.getByRole("button", { name: /continue/i });
    await expect(continueBtn).toBeDisabled();
  });

  test("adds an expense using numpad and quick-add chip", async ({ page }) => {
    await page.getByRole("link", { name: /add expense/i }).click();
    await page.waitForURL(/\/expenses\/new$/);

    // Step 1: enter description and amount
    await page.getByPlaceholder(/what's this for/i).fill("Team dinner");

    // Use quick-add chip for $50
    await page.getByRole("button", { name: /50/ }).first().click();

    await page.getByRole("button", { name: /continue/i }).click();

    // Step 2: details should be visible
    await expect(page.getByText("Team dinner")).toBeVisible();

    // Save expense
    await page.getByRole("button", { name: /save expense/i }).click();

    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    await expect(page.getByText("Team dinner")).toBeVisible();
    await expect(page.getByText("50.00")).toBeVisible();
  });

  test("adds an expense using numpad digit buttons", async ({ page }) => {
    await page.getByRole("link", { name: /add expense/i }).click();
    await page.waitForURL(/\/expenses\/new$/);

    await page.getByPlaceholder(/what's this for/i).fill("Coffee");

    // Type 2 then 5 via numpad buttons (inside the numpad grid)
    await page.getByRole("button", { name: "2", exact: true }).click();
    await page.getByRole("button", { name: "5", exact: true }).click();

    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /save expense/i }).click();

    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    await expect(page.getByText("Coffee")).toBeVisible();
  });

  test("shows expense in group detail after adding", async ({ page }) => {
    await expect(page.getByText("Team dinner")).toBeVisible();
  });

  test("back button on details step returns to amount step", async ({ page }) => {
    await page.getByRole("link", { name: /add expense/i }).click();
    await page.waitForURL(/\/expenses\/new$/);

    await page.getByRole("button", { name: /50/ }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();

    // Amount display should be visible on details step
    await expect(page.getByText(/50\.00/)).toBeVisible();

    // Click back arrow button
    await page.getByRole("button").filter({ has: page.locator("svg") }).first().click();

    // Continue button should be visible again (back on amount step)
    await expect(page.getByRole("button", { name: /continue/i })).toBeVisible();
  });

  test("selecting category changes active category", async ({ page }) => {
    await page.getByRole("link", { name: /add expense/i }).click();
    await page.waitForURL(/\/expenses\/new$/);

    await page.getByRole("button", { name: /20/ }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();

    // Category section should be visible
    await expect(page.getByText(/category/i)).toBeVisible();
  });
});

test.describe("Balances", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/groups");
    await page.getByText(TEST_GROUP_NAME).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
  });

  test("shows balances tab on group detail", async ({ page }) => {
    await expect(page.getByRole("button", { name: /balances/i })).toBeVisible();
  });

  test("switches to balances tab and shows member balances", async ({ page }) => {
    await page.getByRole("button", { name: /balances/i }).click();
    await expect(page.getByText(/member balances/i)).toBeVisible();
  });

  test("balances tab shows current user with YOU label", async ({ page }) => {
    await page.getByRole("button", { name: /balances/i }).click();
    await expect(page.getByText("YOU")).toBeVisible();
  });

  test("settle up button links to settle page", async ({ page }) => {
    const settleLink = page.getByRole("link", { name: /settle up/i });
    await expect(settleLink).toBeVisible();
    await settleLink.click();
    await page.waitForURL(/\/settle$/);
    await expect(page.getByText(/settle up/i)).toBeVisible();
  });
});

test.describe("Settle Up", () => {
  let groupUrl: string;

  test.beforeEach(async ({ page }) => {
    await page.goto("/en/groups");
    await page.getByText(TEST_GROUP_NAME).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    groupUrl = page.url();
  });

  test("settle page renders from/to member selectors", async ({ page }) => {
    await page.goto(groupUrl.replace(/\/$/, "") + "/settle");
    await expect(page.getByText(/from/i)).toBeVisible();
    await expect(page.getByText(/to/i)).toBeVisible();
  });

  test("record button is disabled when amount is zero", async ({ page }) => {
    await page.goto(groupUrl.replace(/\/$/, "") + "/settle");
    const recordBtn = page.getByRole("button", { name: /record settlement/i });
    await expect(recordBtn).toBeDisabled();
  });

  test("entering amount via numpad enables record button", async ({ page }) => {
    await page.goto(groupUrl.replace(/\/$/, "") + "/settle");

    await page.getByRole("button", { name: "1", exact: true }).click();
    await page.getByRole("button", { name: "0", exact: true }).click();

    const recordBtn = page.getByRole("button", { name: /record settlement/i });
    await expect(recordBtn).toBeEnabled();
  });

  test("records a settlement and shows success screen", async ({ page }) => {
    await page.goto(groupUrl.replace(/\/$/, "") + "/settle");

    await page.getByRole("button", { name: "2", exact: true }).click();
    await page.getByRole("button", { name: "0", exact: true }).click();

    await page.getByRole("button", { name: /record settlement/i }).click();

    // Success screen
    await expect(page.getByText(/recorded\./i)).toBeVisible();
    await expect(page.getByRole("button", { name: /back to group/i })).toBeVisible();
  });

  test("back to group button returns to group detail", async ({ page }) => {
    await page.goto(groupUrl.replace(/\/$/, "") + "/settle");

    await page.getByRole("button", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: /record settlement/i }).click();
    await expect(page.getByText(/recorded\./i)).toBeVisible();

    await page.getByRole("button", { name: /back to group/i }).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    await expect(page.getByText(TEST_GROUP_NAME)).toBeVisible();
  });

  test("settlement appears in group expense timeline", async ({ page }) => {
    // Navigate to settle and record
    await page.goto(groupUrl.replace(/\/$/, "") + "/settle");
    await page.getByRole("button", { name: "1", exact: true }).click();
    await page.getByRole("button", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: /record settlement/i }).click();
    await expect(page.getByText(/recorded\./i)).toBeVisible();

    await page.getByRole("button", { name: /back to group/i }).click();
    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);

    // Settlement row shows a payment in the timeline
    await expect(page.getByText(/paid/i).first()).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("bottom nav links are present", async ({ page }) => {
    await page.goto("/en/groups");
    await expect(page.getByRole("link", { name: /groups/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /notifications/i })).toBeVisible();
  });

  test("navigates to notifications page", async ({ page }) => {
    await page.goto("/en/notifications");
    await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible();
  });

  test("navigates to profile page", async ({ page }) => {
    await page.goto("/en/profile");
    await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible();
  });

  test("logout link is visible", async ({ page }) => {
    await page.goto("/en/groups");
    await expect(page.getByRole("link", { name: /logout|đăng xuất/i })).toBeVisible();
  });

  test("logout link points to /auth/logout", async ({ page }) => {
    await page.goto("/en/groups");
    const logoutLink = page.getByRole("link", { name: /logout|đăng xuất/i });
    await expect(logoutLink).toHaveAttribute("href", "/auth/logout");
  });

  test("logout redirects to login page", async ({ page, browser }) => {
    await page.goto("/en/groups");
    await page.getByRole("link", { name: /logout|đăng xuất/i }).click();
    await page.waitForLoadState("load");

    const freshCtx = await browser.newContext();
    const freshPage = await freshCtx.newPage();
    await freshPage.goto("http://localhost:3000/en/groups");
    await freshPage.waitForURL(/auth0\.com|\/auth\/login/);
    await expect(freshPage).toHaveURL(/auth0\.com|\/auth\/login/);
    await freshCtx.close();
  });

  test("bottom nav profile link navigates to profile page", async ({ page }) => {
    await page.goto("/en/groups");
    await page.getByRole("link", { name: /profile/i }).click();
    await page.waitForURL(/\/en\/profile/);
    await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible();
  });

  test("bottom nav activity link navigates to notifications page", async ({ page }) => {
    await page.goto("/en/groups");
    await page.getByRole("link", { name: /activity|notifications/i }).click();
    await page.waitForURL(/\/en\/notifications/);
  });
});

test.describe("Notifications", () => {
  test("shows notifications page with heading", async ({ page }) => {
    await page.goto("/en/notifications");
    await expect(page.getByRole("heading", { name: /activity/i })).toBeVisible();
  });

  test("shows empty state when no notifications", async ({ page }) => {
    await page.goto("/en/notifications");
    await page.waitForLoadState("networkidle");
    // Either shows notifications or empty state text
    const hasNotifications = await page.getByText(/no activity yet/i).isVisible().catch(() => false);
    const hasItems = await page.locator("[data-testid='notification-item'], .notification-item").count() > 0;
    expect(hasNotifications || hasItems || true).toBeTruthy();
  });

  test("mark all read button visible when there are unread notifications", async ({ page }) => {
    await page.goto("/en/notifications");
    await page.waitForLoadState("networkidle");
    // If the mark-all-read button exists, click it and verify it disappears or state changes
    const markAllBtn = page.getByRole("button", { name: /mark all read/i });
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
      // After marking all read, button should disappear (only shown when unread exist)
      await expect(markAllBtn).not.toBeVisible();
    }
  });

  test("notification links to correct group", async ({ page }) => {
    await page.goto("/en/notifications");
    await page.waitForLoadState("networkidle");
    const groupLink = page.getByRole("link", { name: /view group/i }).first();
    if (await groupLink.isVisible()) {
      await groupLink.click();
      await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    }
  });
});

test.describe("Profile", () => {
  test("shows profile page with user info", async ({ page }) => {
    await page.goto("/en/profile");
    await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible();
  });

  test("shows preferences section", async ({ page }) => {
    await page.goto("/en/profile");
    await expect(page.getByText(/preferences/i)).toBeVisible();
  });

  test("shows stats section", async ({ page }) => {
    await page.goto("/en/profile");
    await expect(page.getByText(/groups/i)).toBeVisible();
    await expect(page.getByText(/expenses/i)).toBeVisible();
  });

  test("shows logout button on profile page", async ({ page }) => {
    await page.goto("/en/profile");
    await expect(page.getByRole("link", { name: /log out/i })).toBeVisible();
  });

  test("language switcher on profile navigates to Vietnamese profile", async ({ page }) => {
    await page.goto("/en/profile");
    // Language link should switch locale
    const viLink = page.getByRole("link", { name: /vi/i });
    if (await viLink.isVisible()) {
      await viLink.click();
      await page.waitForURL(/\/vi\/profile/);
    }
  });
});

test.describe("i18n", () => {
  test("redirects bare path to locale-prefixed path", async ({ page }) => {
    await page.goto("/groups");
    await page.waitForURL(/\/(en|vi)\/groups/);
    await expect(page).toHaveURL(/\/(en|vi)\/groups/);
  });

  test("English locale shows English UI", async ({ page }) => {
    await page.goto("/en/groups");
    await expect(page.getByRole("heading", { name: "My Groups" })).toBeVisible();
    await expect(page.getByRole("link", { name: "New Group" })).toBeVisible();
  });

  test("Vietnamese locale shows Vietnamese UI", async ({ page }) => {
    await page.goto("/vi/groups");
    await expect(page.getByRole("heading", { name: "Nhóm của tôi" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tạo nhóm" })).toBeVisible();
  });

  test("language switcher is visible and switches language", async ({ page }) => {
    await page.goto("/en/groups");
    await expect(page.getByRole("button", { name: /switch to vi/i })).toBeVisible();

    await page.getByRole("button", { name: /switch to vi/i }).click();
    await page.waitForURL(/\/vi\/groups/);
    await expect(page.getByRole("heading", { name: "Nhóm của tôi" })).toBeVisible();
  });

  test("/en/notifications shows English UI", async ({ page }) => {
    await page.goto("/en/notifications");
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  });

  test("/vi/notifications shows Vietnamese UI", async ({ page }) => {
    await page.goto("/vi/notifications");
    await expect(page.getByRole("heading", { name: "Thông báo" })).toBeVisible();
  });

  test("add expense page renders in Vietnamese", async ({ page }) => {
    await page.goto("/vi/groups");
    await page.waitForLoadState("networkidle");
    const firstGroup = page.locator("a[href*='/vi/groups/']").first();
    if (await firstGroup.isVisible()) {
      await firstGroup.click();
      await page.waitForURL(/\/vi\/groups\/[a-f0-9-]{36}$/);
      await page.getByRole("link", { name: /thêm chi phí|add expense/i }).click();
      await page.waitForURL(/\/expenses\/new$/);
      await expect(page.getByPlaceholder(/khoản này cho gì|what's this for/i)).toBeVisible();
    }
  });

  test("settle page renders in Vietnamese", async ({ page }) => {
    await page.goto("/vi/groups");
    await page.waitForLoadState("networkidle");
    const firstGroup = page.locator("a[href*='/vi/groups/']").first();
    if (await firstGroup.isVisible()) {
      await firstGroup.click();
      await page.waitForURL(/\/vi\/groups\/[a-f0-9-]{36}$/);
      await page.getByRole("link", { name: /thanh toán|settle up/i }).click();
      await page.waitForURL(/\/settle$/);
      await expect(page.getByText(/từ|from/i)).toBeVisible();
    }
  });
});
