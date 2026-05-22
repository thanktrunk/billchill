import { test, expect } from "@playwright/test";

const TEST_GROUP_NAME = `E2E Test Group ${Date.now()}`;

test.describe("Groups", () => {
  test("shows groups list page", async ({ page }) => {
    await page.goto("/groups");
    // Middleware redirects to locale-prefixed URL
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

  test("adds an expense with equal split", async ({ page }) => {
    await page.getByRole("link", { name: /add expense/i }).click();
    await page.waitForURL(/\/expenses\/new$/);

    await page.getByLabel("Description").fill("Team dinner");
    await page.getByLabel("Amount").fill("120");

    const paidBySelect = page.getByLabel("Paid by");
    await expect(paidBySelect).toBeEnabled();
    await paidBySelect.selectOption({ index: 1 });

    await page.getByLabel("Date").fill(new Date().toISOString().split("T")[0]);

    await page.getByRole("button", { name: /add expense/i }).click();

    await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/);
    await expect(page.getByText("Team dinner")).toBeVisible();
    await expect(page.getByText("120")).toBeVisible();
  });

  test("shows expense in group detail after adding", async ({ page }) => {
    await expect(page.getByText("Team dinner")).toBeVisible();
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

  test("logout link is visible", async ({ page }) => {
    await page.goto("/en/groups");
    await expect(page.getByRole("link", { name: /logout|đăng xuất/i })).toBeVisible();
  });

  test("logout link points to /auth/logout", async ({ page }) => {
    await page.goto("/en/groups");
    const logoutLink = page.getByRole("link", { name: /logout|đăng xuất/i });
    await expect(logoutLink).toHaveAttribute("href", "/auth/logout");
  });

  test("logout redirects to login page", async ({ page }) => {
    await page.goto("/en/groups");
    await page.getByRole("link", { name: /logout|đăng xuất/i }).click();
    await page.waitForURL(/auth0\.com|\/auth\/login/);
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
});
