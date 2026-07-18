/**
 * E2E tests for i18n language switching.
 *
 * Pre-requisites:
 *   - App running on http://localhost:5173 (npm run dev)
 *   - API running on http://localhost:9090
 *   - Auth storageState pre-loaded via global-setup
 *
 * Run with:
 *   npx playwright test e2e/i18n.spec.ts
 */

import { test, expect } from '@playwright/test'

// Uses shared auth from storageState (no manual login needed)

async function selectLanguage(page: import('@playwright/test').Page, value: string) {
  const switcher = page.getByRole('combobox', { name: /language|idioma|lingua/i })
  await switcher.selectOption(value)
}

test.describe('i18n — Language Switcher', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/')
    await page.waitForLoadState('networkidle')
  })

  test('default language is Portuguese after login (no stored preference)', async ({ page }) => {
    // Reset to default (pt-BR) via direct API call
    await page.evaluate(() => {
      return fetch('http://localhost:9090/api/settings/language', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ language: 'pt-BR' }),
      })
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Navigation sidebar should show Portuguese labels
    await expect(page.getByRole('link', { name: 'Painel' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible()
  })

  test('switching to English updates UI immediately without reload', async ({ page }) => {
    await selectLanguage(page, 'en')

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('link', { name: 'Clients' })).toBeVisible()

    // Reset
    await selectLanguage(page, 'pt-BR')
  })

  test('switching to Español updates navigation labels to Spanish', async ({ page }) => {
    await selectLanguage(page, 'es')

    await expect(page.getByRole('link', { name: 'Panel' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible()

    // Reset
    await selectLanguage(page, 'pt-BR')
  })

  test('language switch triggers PATCH /api/settings/language with correct body', async ({ page }) => {
    const patchPromise = page.waitForRequest(
      (req) => req.url().includes('/api/settings/language') && req.method() === 'PATCH',
    )

    await selectLanguage(page, 'pt-BR')

    const req = await patchPromise
    const body = req.postDataJSON()
    expect(body).toEqual({ language: 'pt-BR' })
  })

  test('language persists across logout and login (DB round-trip)', async ({ page }) => {
    // Switch to English
    await selectLanguage(page, 'en')
    await page.waitForResponse(
      (res) => res.url().includes('/api/settings/language') && res.request().method() === 'PATCH',
    )

    // Logout
    await page.getByTestId('user-menu-toggle').click()
    await page.getByTestId('user-menu-logout').click()
    await expect(page).toHaveURL(/\/#\/login/, { timeout: 5000 })

    // Login again
    const { TEST_EMAIL, TEST_PASSWORD } = await import('./helpers/constants')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/senha|password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click()
    await expect(page).toHaveURL(/\/#\/$/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    // UI should render in English (restored from DB)
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 5000 })

    // Cleanup: reset to pt-BR
    await selectLanguage(page, 'pt-BR')
  })

  test('PATCH failure (500 intercept) does not revert UI language', async ({ page }) => {
    await page.route('**/api/settings/language', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({ status: 500, body: 'Internal Server Error' })
      } else {
        route.continue()
      }
    })

    const consoleSpy: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleSpy.push(msg.text())
    })

    await selectLanguage(page, 'es')

    // UI should still show Spanish despite the API failure
    await expect(page.getByRole('link', { name: 'Panel' })).toBeVisible({ timeout: 3000 })

    await page.waitForFunction(() => true) // yield to let console.error fire
    expect(consoleSpy.some((m) => /persist|language|error|fail/i.test(m))).toBe(true)

    // Reset
    await page.unrouteAll()
    await selectLanguage(page, 'pt-BR')
  })
})
