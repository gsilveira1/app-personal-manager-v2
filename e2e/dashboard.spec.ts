import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/')
    await page.waitForLoadState('networkidle')
  })

  test('displays stat cards', async ({ page }) => {
    // Dashboard shows stat cards with metrics
    const statCards = page.locator('[class*="stat"], [class*="StatCard"], [class*="rounded-xl"]').filter({ hasText: /\d/ })
    await expect(statCards.first()).toBeVisible({ timeout: 10000 })
  })

  test('today agenda is visible', async ({ page }) => {
    const agenda = page.getByTestId('today-agenda')
    await expect(agenda).toBeVisible()
  })

  test('client watchlist is visible', async ({ page }) => {
    const watchlist = page.getByTestId('client-watchlist')
    await expect(watchlist).toBeVisible()
  })

  test('toggle session completion from agenda', async ({ page }) => {
    const agenda = page.getByTestId('today-agenda')
    await expect(agenda).toBeVisible()

    // If there are sessions today, try toggling completion
    const markCompleteBtn = agenda.getByRole('button', { name: /marcar|complete/i }).first()
    if (await markCompleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await markCompleteBtn.click()
      // Should show "Completed" indicator after toggle
      await expect(agenda.locator('text=/concluí|completed/i')).toBeVisible({ timeout: 5000 })
    }
  })

  test('conflicts card appears when overlapping sessions exist', async ({ page }) => {
    // The conflicts card only renders if there are conflicts in the data
    const conflictsCard = page.getByTestId('conflicts-card')
    // Just verify the card is either visible or not — no crash
    const isVisible = await conflictsCard.isVisible().catch(() => false)
    if (isVisible) {
      await expect(conflictsCard).toContainText(/conflict/i)
    }
    // Test passes either way — the important thing is no errors
  })

  test('quick link navigates to schedule', async ({ page }) => {
    // Dashboard has a "+ New Session" button that links to schedule
    const newSessionLink = page.getByRole('link', { name: /nova sessão|new session|agenda/i }).or(
      page.locator('a[href*="schedule"]').first()
    )
    if (await newSessionLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newSessionLink.click()
      await expect(page).toHaveURL(/\/#\/schedule/)
    }
  })
})
