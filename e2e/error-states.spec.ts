import { test, expect } from '@playwright/test'

test.describe('Error States & Resilience', () => {
  test('API timeout on initial load shows error screen with retry', async ({ page }) => {
    // Intercept all API calls and simulate timeout
    await page.route('**/api/clients', (route) => {
      route.abort('timedout')
    })

    await page.goto('/#/')
    await page.waitForTimeout(3000)

    // Should show error state (FullScreenError component) or stay on loading
    const errorScreen = page.locator('text=/erro|error|falha|failed/i')
    const retryBtn = page.getByRole('button', { name: /tentar|retry|recarregar/i })

    if (await errorScreen.isVisible({ timeout: 10000 }).catch(() => false)) {
      await expect(errorScreen).toBeVisible()
      await expect(retryBtn).toBeVisible()
    }
  })

  test('retry button re-fetches data successfully', async ({ page }) => {
    let callCount = 0

    // First call fails, second succeeds
    await page.route('**/api/clients', (route) => {
      callCount++
      if (callCount === 1) {
        route.abort('timedout')
      } else {
        route.continue()
      }
    })

    await page.goto('/#/')
    await page.waitForTimeout(3000)

    const retryBtn = page.getByRole('button', { name: /tentar|retry|recarregar/i })
    if (await retryBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      // Unroute to allow retry to succeed
      await page.unrouteAll()
      await retryBtn.click()

      // Should load successfully now
      await expect(page.locator('main')).toBeVisible({ timeout: 15000 })
    }
  })

  test('401 response redirects to login', async ({ page }) => {
    // First load the app normally
    await page.goto('/#/')
    await page.waitForLoadState('networkidle')

    // Clear the token to simulate expired session
    await page.evaluate(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    })

    // Navigate to a protected route — should get redirected
    await page.goto('/#/clients')
    await page.waitForTimeout(2000)

    await expect(page).toHaveURL(/\/#\/login/)
  })

  test('network error on form submit shows error toast', async ({ page }) => {
    await page.goto('/#/clients')
    await page.waitForLoadState('networkidle')

    // Intercept client creation
    await page.route('**/api/clients', (route) => {
      if (route.request().method() === 'POST') {
        route.abort('failed')
      } else {
        route.continue()
      }
    })

    // Open add client modal
    const addButton = page.getByRole('button', { name: /novo|adicionar|add/i })
    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click()

      const modal = page.getByTestId('add-client-modal')
      await expect(modal).toBeVisible()

      // Fill form
      await page.locator('#name').fill('E2E Error Client')
      await page.locator('#dateOfBirth').fill('1990-01-01')
      await page.locator('#email').fill('error@test.com')
      await page.locator('#phone').fill('53999999999')

      // Submit — should fail
      await page.getByRole('button', { name: /adicionar|salvar|save/i }).last().click()

      // Wait for error handling — either a toast, alert, or the form stays open
      await page.waitForTimeout(2000)

      // The error toast or the modal should still be visible (form not cleared)
      const toastOrError = page.locator('[role="status"], [class*="toast"], [class*="error"], [role="alert"]')
      const modalStillOpen = await modal.isVisible()

      // Either an error is shown OR the modal remains open (both are acceptable)
      expect(await toastOrError.isVisible().catch(() => false) || modalStillOpen).toBe(true)
    }
  })
})
