import { test as setup, expect } from "@playwright/test";
import path from "path";

const sessionFile = path.join(__dirname, ".auth/session.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("E2E_EMAIL and E2E_PASSWORD must be set in .env.local");
  }

  await page.goto("/groups");

  // Auth0 redirects to hosted login page
  await page.waitForURL(/auth0\.com/);

  await page.getByLabel("Email address").fill(email);
  await page.locator("input[name='password']").fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // Wait for redirect back to the app
  await page.waitForURL(/localhost:3000/);
  await expect(page).toHaveURL(/\/groups/);

  await page.context().storageState({ path: sessionFile });
});
