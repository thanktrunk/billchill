import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const sessionFile = path.join(__dirname, ".auth/session.json");

function isSessionValid(): boolean {
  if (!fs.existsSync(sessionFile)) return false;
  try {
    const data = JSON.parse(fs.readFileSync(sessionFile, "utf-8"));
    const cookies: Array<{ name: string; expires?: number }> = data.cookies ?? [];
    const session = cookies.find((c) => c.name === "__session");
    if (!session || !session.expires) return false;
    // Valid if the session cookie expires more than 5 minutes from now
    return session.expires > Date.now() / 1000 + 300;
  } catch {
    return false;
  }
}

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("E2E_EMAIL and E2E_PASSWORD must be set in .env.local");
  }

  // Reuse existing session if it is still valid — avoids unnecessary Auth0 round-trips
  if (isSessionValid()) {
    return;
  }

  await page.goto("/groups");

  // Auth0 redirects to hosted login page
  await page.waitForURL(/auth0\.com/, { timeout: 60_000 });

  await page.getByLabel("Email address").fill(email);
  await page.locator("input[name='password']").fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // Wait for redirect back to the app
  await page.waitForURL(/localhost:3000/, { timeout: 60_000 });
  await expect(page).toHaveURL(/\/groups/);

  await page.context().storageState({ path: sessionFile });
});
