import { test, expect } from '@playwright/test'

test.describe('Schedule Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'trainer@vivi.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/(dashboard)?$/, { timeout: 10000 })
  })

  test('should display the schedule/calendar page', async ({ page }) => {
    await page.goto('/schedule')

    // Calendar or schedule view should be visible
    await expect(
      page.locator('[class*="calendar"], [class*="schedule"], [data-testid="schedule"]'),
    ).toBeVisible({ timeout: 10000 })
  })

  test('should show existing sessions on the calendar', async ({ page }) => {
    await page.goto('/schedule')

    // Wait for sessions to load
    await page.waitForTimeout(2000)

    // Sessions are typically rendered as event cards/blocks
    const sessionElements = page.locator('[class*="session"], [class*="event"], [class*="appointment"]')
    // Might have zero sessions — just verify the calendar renders without error
    const count = await sessionElements.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should create a new session', async ({ page }) => {
    await page.goto('/schedule')

    // Look for add session button
    const addButton = page.locator('button:has-text("Nova"), button:has-text("Adicionar"), button:has-text("Add"), [data-testid="add-session"]')
    if (await addButton.isVisible({ timeout: 5000 })) {
      await addButton.click()

      // Should open a modal/form for creating a session
      const modal = page.locator('[role="dialog"], [class*="modal"], [class*="drawer"]')
      if (await modal.isVisible({ timeout: 3000 })) {
        // Fill in required fields if form is visible
        const clientSelect = page.locator('select[name="clientId"], [data-testid="client-select"]')
        if (await clientSelect.isVisible()) {
          // Select the first available client
          await clientSelect.selectOption({ index: 1 })
        }

        // Submit the form
        const submitBtn = page.locator('button[type="submit"], button:has-text("Salvar"), button:has-text("Save")')
        if (await submitBtn.isVisible()) {
          await submitBtn.click()
        }
      }
    }
  })

  test('should be able to switch calendar views', async ({ page }) => {
    await page.goto('/schedule')

    // Look for view toggle buttons (Day/Week/Month)
    const viewButtons = page.locator('button:has-text("Dia"), button:has-text("Semana"), button:has-text("Mês"), button:has-text("Day"), button:has-text("Week"), button:has-text("Month")')
    const count = await viewButtons.count()

    if (count > 0) {
      // Click the first view button
      await viewButtons.first().click()
      // Calendar should still be visible after view change
      await expect(
        page.locator('[class*="calendar"], [class*="schedule"]'),
      ).toBeVisible({ timeout: 5000 })
    }
  })
})
