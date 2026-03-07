/**
 * E2E tests for i18n language switching.
 *
 * Pre-requisites:
 *   - App running on http://localhost:5173 (npm run dev)
 *   - API running on http://localhost:9090
 *   - A test user seeded in the DB (configure TEST_EMAIL/TEST_PASSWORD env vars)
 *
 * Run with:
 *   npx playwright test e2e/i18n.spec.ts
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const API_URL = 'http://localhost:9090/api'

const TEST_EMAIL = process.env.TEST_EMAIL ?? 'trainer@test.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'Test123456!'

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/#/login`)
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  // Wait for dashboard to load
  await page.waitForURL(`${BASE_URL}/#/`)
  await page.waitForLoadState('networkidle')
}

async function selectLanguage(page: import('@playwright/test').Page, value: string) {
  const switcher = page.getByRole('combobox', { name: 'Select language' })
  await switcher.selectOption(value)
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

test.describe('i18n — Language Switcher', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('default language is Portuguese after login (no stored preference)', async ({ page }) => {
    // Reset to default (pt-BR) via direct API call using the logged-in session
    await page.evaluate(() => {
      return fetch('/api/settings/language', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ language: 'pt-BR' }),
      })
    })

    // Reload to re-hydrate
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Navigation sidebar should show Portuguese labels
    await expect(page.getByRole('link', { name: 'Painel' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible()
  })

  test('switching to English updates UI immediately without reload', async ({ page }) => {
    await selectLanguage(page, 'en')

    // Wait for UI to update — no page reload needed
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('link', { name: 'Clients' })).toBeVisible()

    // Reset after test
    await selectLanguage(page, 'pt-BR')
  })

  test('switching to Español updates navigation labels to Spanish', async ({ page }) => {
    await selectLanguage(page, 'es')

    await expect(page.getByRole('link', { name: 'Panel' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible()

    // Reset after test
    await selectLanguage(page, 'pt-BR')
  })

  test('language switch triggers PATCH /api/settings/language with correct body', async ({ page }) => {
    // Set up request interceptor before triggering the action
    const patchPromise = page.waitForRequest(
      (req) => req.url().includes('/api/settings/language') && req.method() === 'PATCH'
    )

    await selectLanguage(page, 'pt-BR')

    const req = await patchPromise
    const body = req.postDataJSON()
    expect(body).toEqual({ language: 'pt-BR' })

    // Reset
    await selectLanguage(page, 'pt-BR')
  })

  test('language persists across logout and login (DB round-trip)', async ({ page }) => {
    // Switch to en and wait for API call
    await selectLanguage(page, 'en')
    await page.waitForResponse(
      (res) => res.url().includes('/api/settings/language') && res.request().method() === 'PATCH'
    )

    // Logout
    await page.click('img[alt="Profile"]')
    await page.getByRole('button', { name: 'Logout' }).click()
    await page.waitForURL(`${BASE_URL}/#/login`)

    // Login again
    await login(page)

    // UI should render in English restored from DB
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 5000 })

    // Cleanup
    await selectLanguage(page, 'pt-BR')
  })

  test('PATCH failure (500 intercept) does not revert UI language', async ({ page }) => {
    // Intercept the PATCH and return 500
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

    // An error should have been logged to console
    await page.waitForFunction(() => true) // yield to let console.error fire
    expect(consoleSpy.some((m) => m.includes('persist') || m.includes('language') || m.includes('error'))).toBe(true)

    // Reset
    await page.unrouteAll()
    await selectLanguage(page, 'pt-BR')
  })

  test('rapid double-click on language switch — changeLanguage called only once (disabled during switch)', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/api/settings/language') && req.method() === 'PATCH') {
        requests.push(req.postDataJSON()?.language)
      }
    })

    const switcher = page.getByRole('combobox', { name: 'Select language' })

    // Quickly change twice
    await switcher.selectOption('es')
    // The switcher is disabled while switching — second change should be ignored
    await switcher.selectOption('pt-BR').catch(() => {}) // may be ignored if disabled

    // Wait for any API calls to complete
    await page.waitForTimeout(500)

    // At most 1 PATCH for the first selection, not 2 concurrent
    expect(requests.filter((r) => r === 'pt-BR')).toHaveLength(0)

    // Reset
    await page.unrouteAll()
    await selectLanguage(page, 'pt-BR')
  })
})
