import { test, expect } from '@playwright/test'
import { TEST_EMAIL, TEST_PASSWORD } from './helpers/constants'

test.describe('Authentication', () => {
  // Auth tests don't use storageState — they test the login flow itself
  test.use({ storageState: { cookies: [], origins: [] } })

  test('redirects to /#/login when accessing protected route unauthenticated', async ({ page }) => {
    await page.goto('/#/clients')
    await expect(page).toHaveURL(/\/#\/login/)
  })

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/#/login')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/senha|password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click()

    await expect(page).toHaveURL(/\/#\/$/, { timeout: 15000 })
    await expect(page.locator('main')).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/#/login')
    await page.getByLabel(/email/i).fill('bad@email.com')
    await page.getByLabel(/senha|password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click()

    await expect(page.locator('[role="alert"], [class*="error"], [class*="text-red"]')).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/\/#\/login/)
  })

  test('shows validation errors for empty fields', async ({ page }) => {
    await page.goto('/#/login')
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click()

    // HTML5 validation should prevent submission — email field should be invalid
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeVisible()
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(isValid).toBe(false)
  })

  test('logout clears state and redirects to login', async ({ page }) => {
    // First login
    await page.goto('/#/login')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/senha|password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click()
    await expect(page).toHaveURL(/\/#\/$/, { timeout: 15000 })

    // Open user menu and logout
    await page.getByTestId('user-menu-toggle').click()
    await page.getByTestId('user-menu-logout').click()

    await expect(page).toHaveURL(/\/#\/login/, { timeout: 5000 })
  })

  test('session persists on page refresh', async ({ page }) => {
    // Login
    await page.goto('/#/login')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/senha|password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /entrar|login|sign in/i }).click()
    await expect(page).toHaveURL(/\/#\/$/, { timeout: 15000 })

    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/\/#\/$/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('signup flow creates account and redirects to login', async ({ page }) => {
    await page.goto('/#/signup')

    const uniqueEmail = `e2e-signup-${Date.now()}@test.com`
    await page.getByLabel(/nome|name/i).fill('E2E Test User')
    await page.getByLabel(/email/i).fill(uniqueEmail)
    await page.getByLabel(/senha|password/i).fill('Test123456!')
    await page.getByRole('button', { name: /cadastrar|sign up|criar/i }).click()

    // Should redirect to login after successful signup
    await expect(page).toHaveURL(/\/#\/login/, { timeout: 10000 })
  })
})
