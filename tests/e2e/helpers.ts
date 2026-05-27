import path from 'path'
import type { Browser } from '@playwright/test'

export const SESSION_FILE = path.join(__dirname, '.auth/session.json')

export async function createGroup(browser: Browser, name: string): Promise<string> {
  const context = await browser.newContext({ storageState: SESSION_FILE })
  const page = await context.newPage()
  await page.goto('/en/groups/new')
  await page.getByLabel('Group Name').fill(name)
  await page.getByRole('button', { name: /create group/i }).click()
  await page.waitForURL(/\/en\/groups\/[a-f0-9-]{36}$/)
  const url = page.url()
  await context.close()
  return url
}
