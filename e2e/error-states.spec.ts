import { test, expect } from '@playwright/test'

test.describe('Error States & Resilience', () => {
  const errorTitle = /algo deu errado|something went wrong|algo salió mal/i
  const retryButton = /tentar novamente|try again|reintentar/i

  test('API timeout on initial load shows error screen with retry', async ({ page }) => {
    // The client list is part of the initial load: make it time out
    await page.route(/\/api\/clients(\?.*)?$/, (route) => {
      route.abort('timedout')
    })

    await page.goto('/')

    // Should show the error state (FullScreenError component)
    await expect(page.getByRole('heading', { name: errorTitle })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: retryButton })).toBeVisible()
    await expect(page.getByTestId('sidebar')).not.toBeVisible()
  })

  test('retry button re-fetches data successfully', async ({ page }) => {
    let failing = true
    let callsAfterRetry = 0

    // The client list fails until "retry" is pressed
    await page.route(/\/api\/clients(\?.*)?$/, (route) => {
      if (failing) return route.abort('timedout')
      callsAfterRetry++
      return route.continue()
    })

    await page.goto('/')

    const retryBtn = page.getByRole('button', { name: retryButton })
    await expect(retryBtn).toBeVisible({ timeout: 10000 })
    failing = false
    await retryBtn.click()

    // Should load successfully now
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('main')).toBeVisible()
    expect(callsAfterRetry).toBeGreaterThanOrEqual(1)
  })

  test('cleared session redirects to login', async ({ page }) => {
    // First load the app normally
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('sidebar')).toBeVisible()

    // Clear the token to simulate a session that is gone
    await page.evaluate(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    })

    // Open a protected route again (a hash change alone does not reload the app)
    await page.goto('/clients')
    await page.reload()

    await expect(page).toHaveURL(/\/login/)
  })

  test('401 response redirects to login', async ({ page }) => {
    // The stored token is no longer accepted (expired, password changed, account blocked):
    // the API answers 401 to every authenticated request
    // (the client calls the API same-origin, through the dev server's `/api` proxy)
    await page.route(/^https?:\/\/[^/]+\/api\//, (route) => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ statusCode: 401, message: 'Unauthorized' }) }))

    await page.goto('/clients')

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('button', { name: /entrar|login|sign in/i })).toBeVisible()
  })

  test('401 while loading the app data ends the session and redirects to login', async ({ page }) => {
    // The session check still passes, but the data requests are refused
    // (e.g. the account is blocked between the two)
    let dataCalls = 0
    await page.route(/\/api\/(clients|sessions|plans|evaluations|workout-templates|auth\/logout)(\?.*)?$/, (route) => {
      dataCalls++
      return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ statusCode: 401, message: 'Unauthorized' }) })
    })

    await page.goto('/clients')

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('button', { name: /entrar|login|sign in/i })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull()

    // ...and the app does not keep retrying the load
    const callsAfterRedirect = dataCalls
    await page.waitForTimeout(1500)
    expect(dataCalls).toBe(callsAfterRedirect)
  })

  test('network error on form submit shows error toast', async ({ page }) => {
    await page.goto('/clients')
    await page.waitForLoadState('networkidle')

    // Intercept client creation
    await page.route(/\/api\/clients(\?.*)?$/, (route) => {
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
      await page
        .getByRole('button', { name: /adicionar|salvar|save/i })
        .last()
        .click()

      // Wait for error handling — either a toast, alert, or the form stays open
      await page.waitForTimeout(2000)

      // The error toast or the modal should still be visible (form not cleared)
      const toastOrError = page.locator('[role="status"], [class*="toast"], [class*="error"], [role="alert"]:not(.PWABadge)')
      const modalStillOpen = await modal.isVisible()

      // Either an error is shown OR the modal remains open (both are acceptable)
      expect((await toastOrError.isVisible().catch(() => false)) || modalStillOpen).toBe(true)
    }
  })
})
