import { test as base, expect } from '@playwright/test'

export { expect }

/**
 * Extended test fixture that provides a page pre-loaded with auth storageState.
 * All tests importing from this file automatically have a logged-in session.
 */
export const test = base.extend<{ authedPage: import('@playwright/test').Page }>({
  authedPage: async ({ page }, use) => {
    // storageState is already loaded via playwright.config.ts project config
    await use(page)
  },
})

/**
 * Navigate to a hash route and wait for the app to finish loading initial data.
 * Usage: await navigateTo(page, '/clients')
 */
export async function navigateTo(page: import('@playwright/test').Page, path: string) {
  await page.goto(`/#${path}`)
  // Wait for the app to finish loading (ProtectedRoute fetches initial data)
  await page.waitForLoadState('networkidle')
}

/**
 * Wait for a toast notification to appear with specific text.
 */
export async function waitForToast(page: import('@playwright/test').Page, text: string | RegExp) {
  const toast = page.locator('[role="status"], [class*="toast"], [class*="Toaster"]')
  if (typeof text === 'string') {
    await expect(toast.filter({ hasText: text })).toBeVisible({ timeout: 5000 })
  } else {
    await expect(toast.filter({ hasText: text })).toBeVisible({ timeout: 5000 })
  }
}
