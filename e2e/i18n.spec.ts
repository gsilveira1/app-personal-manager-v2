/**
 * E2E tests for i18n language switching.
 *
 * The language is stored on the account, so this spec signs in with its own account
 * (SETTINGS_TEST_EMAIL) and runs serially: it must not change the language under the
 * specs that share the default account, nor under its own tests.
 *
 * Run with:
 *   npx playwright test e2e/i18n.spec.ts
 */

import { test, expect, type Page } from '@playwright/test'
import { API_URL, SETTINGS_TEST_EMAIL, SETTINGS_TEST_PASSWORD } from './helpers/constants'

type Language = 'en' | 'es' | 'pt-BR'

async function apiLogin(): Promise<{ access_token: string; user: unknown }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SETTINGS_TEST_EMAIL, password: SETTINGS_TEST_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Login of ${SETTINGS_TEST_EMAIL} failed: ${res.status}`)
  return res.json()
}

async function apiLanguage(token: string, language?: Language): Promise<string> {
  const res = await fetch(`${API_URL}/settings/language`, {
    method: language ? 'PATCH' : 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: language ? JSON.stringify({ language }) : undefined,
  })
  if (!res.ok) throw new Error(`${language ? 'PATCH' : 'GET'} /settings/language failed: ${res.status}`)
  return (await res.json()).language
}

async function selectLanguage(page: Page, value: Language) {
  const switcher = page.getByRole('combobox', { name: /language|idioma|lingua/i })
  await switcher.selectOption(value)
}

function waitForLanguagePatch(page: Page) {
  return page.waitForResponse((res) => res.url().includes('/api/settings/language') && res.request().method() === 'PATCH')
}

test.describe('i18n — Language Switcher', () => {
  test.describe.configure({ mode: 'serial' })
  // Own session: see the note at the top of the file
  test.use({ storageState: { cookies: [], origins: [] } })

  let token: string

  test.beforeEach(async ({ page }) => {
    const session = await apiLogin()
    token = session.access_token
    // Known starting point for every test: the default language
    await apiLanguage(token, 'pt-BR')

    // Seed the session before the app boots, once per page: a later reload must not
    // sign the user back in after the test logged out
    await page.addInitScript(
      ({ accessToken, user }) => {
        if (sessionStorage.getItem('e2e-session-seeded')) return
        sessionStorage.setItem('e2e-session-seeded', 'true')
        localStorage.setItem('token', accessToken)
        localStorage.setItem('user', JSON.stringify(user))
      },
      { accessToken: session.access_token, user: session.user }
    )
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('nav-dashboard')).toBeVisible()
  })

  test.afterAll(async () => {
    if (token) await apiLanguage(token, 'pt-BR')
  })

  test('default language is Portuguese after login (no stored preference)', async ({ page }) => {
    // Navigation sidebar should show Portuguese labels
    await expect(page.getByRole('link', { name: 'Painel' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible()
  })

  test('switching to English updates UI immediately without reload', async ({ page }) => {
    await selectLanguage(page, 'en')

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('link', { name: 'Clients' })).toBeVisible()
  })

  test('switching to Español updates navigation labels to Spanish', async ({ page }) => {
    await selectLanguage(page, 'es')

    await expect(page.getByRole('link', { name: 'Panel' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible()
  })

  test('language switch triggers PATCH /api/settings/language with correct body', async ({ page }) => {
    const patched = waitForLanguagePatch(page)

    await selectLanguage(page, 'en')

    const response = await patched
    expect(response.request().postDataJSON()).toEqual({ language: 'en' })
    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ language: 'en' })
    expect(await apiLanguage(token)).toBe('en')
  })

  test('language persists across logout and login (DB round-trip)', async ({ page }) => {
    // Switch to English
    const patched = waitForLanguagePatch(page)
    await selectLanguage(page, 'en')
    expect((await patched).status()).toBe(200)

    // Logout
    await page.getByTestId('user-menu-toggle').click()
    await page.getByTestId('user-menu-logout').click()
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })

    // Login again
    await page.getByLabel(/email/i).fill(SETTINGS_TEST_EMAIL)
    await page.getByLabel(/^(senha|password|contraseña)$/i).fill(SETTINGS_TEST_PASSWORD)
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    // UI should render in English (restored from DB)
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 5000 })
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

    const failed = waitForLanguagePatch(page)
    await selectLanguage(page, 'es')
    expect((await failed).status()).toBe(500)

    // UI should still show Spanish despite the API failure
    await expect(page.getByRole('link', { name: 'Panel' })).toBeVisible({ timeout: 3000 })

    // ...and the failure is reported, not swallowed
    await expect.poll(() => consoleSpy.some((m) => /failed to persist language/i.test(m))).toBe(true)
  })
})
