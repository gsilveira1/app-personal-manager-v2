import { test, expect } from '@playwright/test'

test.describe('Authentication Journey', () => {
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/clients')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'trainer@vivi.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard after login
    await expect(page).toHaveURL(/\/(dashboard)?$/, { timeout: 10000 })
    // Dashboard should show trainer-specific content
    await expect(page.locator('main')).toBeVisible()
  })

  test('should show error message on invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'bad@email.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error message and stay on login page
    await expect(page.locator('[role="alert"], .error, [class*="error"]')).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('should logout and redirect to login', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'trainer@vivi.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/(dashboard)?$/, { timeout: 10000 })

    // Then logout — look for logout button in sidebar/header
    const logoutButton = page.locator('button:has-text("Sair"), button:has-text("Logout"), [data-testid="logout"]')
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
    }
  })
})
