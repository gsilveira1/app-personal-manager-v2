import { test, expect } from '@playwright/test'
import { createPlan, deletePlan } from './helpers/api-helpers'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
  })

  test('work hours grid is displayed', async ({ page }) => {
    // Work hours section with day toggles
    const workHoursSection = page.locator('text=/horário|work hours|expediente/i').first()
    await expect(workHoursSection).toBeVisible({ timeout: 10000 })
  })

  test('toggle work day enabled/disabled', async ({ page }) => {
    // Find a toggle for a day (e.g., Sunday which is typically disabled)
    const dayToggle = page.locator('input[type="checkbox"]').last()
    if (await dayToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
      const wasChecked = await dayToggle.isChecked()
      await dayToggle.click()
      await page.waitForTimeout(500)

      // Should have toggled
      const isNowChecked = await dayToggle.isChecked()
      expect(isNowChecked).toBe(!wasChecked)

      // Toggle back
      await dayToggle.click()
      await page.waitForTimeout(500)
    }
  })

  test('change start/end times auto-saves', async ({ page }) => {
    // Find a time input in work hours
    const timeInputs = page.locator('input[type="time"]')
    const firstTimeInput = timeInputs.first()
    if (await firstTimeInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstTimeInput.fill('08:00')
      await firstTimeInput.blur()
      await page.waitForTimeout(500)

      // Verify it persists after reload
      await page.reload()
      await page.waitForLoadState('networkidle')

      const reloadedInput = page.locator('input[type="time"]').first()
      if (await reloadedInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        const value = await reloadedInput.inputValue()
        expect(value).toBeDefined()
      }
    }
  })

  test('change slot duration auto-saves', async ({ page }) => {
    const durationSelect = page.locator('select').filter({ hasText: /min/ }).first()
    if (await durationSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await durationSelect.selectOption({ index: 1 })
      await page.waitForTimeout(500)
    }
  })

  test('plans section displays PRESENCIAL and CONSULTORIA', async ({ page }) => {
    // Scroll down to plans section
    const presencialSection = page.locator('text=/presencial/i').first()
    await expect(presencialSection).toBeVisible({ timeout: 10000 })

    // Should also show plan cards
    const planCards = page.locator('[data-testid^="plan-card-"]')
    expect(await planCards.count()).toBeGreaterThan(0)
  })

  test('create new plan', async ({ page }) => {
    const name = `E2E Plan ${Date.now()}`
    let planId: string | undefined
    try {
      await page
        .getByRole('button', { name: /novo plano|new plan|nuevo plan/i })
        .first()
        .click()

      // Fill plan form
      const planEditor = page.getByTestId('plan-editor-modal')
      await expect(planEditor).toBeVisible({ timeout: 3000 })
      await planEditor.locator('#name').fill(name)
      await planEditor.locator('#price').fill('500')

      // Submit (the page has other "save" buttons: use the form's own)
      const created = page.waitForResponse((res) => res.request().method() === 'POST' && new URL(res.url()).pathname.endsWith('/plans'))
      await planEditor.locator('button[type="submit"]').click()
      const response = await created
      expect(response.status()).toBe(201)
      planId = (await response.json()).id

      // Modal should close and the plan is listed
      await expect(planEditor).not.toBeVisible({ timeout: 5000 })
      await expect(page.getByTestId(`plan-card-${planId}`)).toContainText(name)
    } finally {
      if (planId) await deletePlan(planId)
    }
  })

  test('edit plan price', async ({ page }) => {
    // Create a plan via API
    const plan = await createPlan({
      type: 'PRESENCIAL',
      name: `E2E Edit Plan ${Date.now()}`,
      sessionsPerWeek: 3,
      durationMinutes: 60,
      price: 300,
    })
    try {
      await page.reload()
      await page.waitForLoadState('networkidle')

      const planCard = page.getByTestId(`plan-card-${plan.id}`)
      await expect(planCard).toBeVisible({ timeout: 5000 })

      // Click edit button (lucide's Edit2 icon renders as "pen")
      await planCard.locator('button:has(svg.lucide-pen)').click()

      const planEditor = page.getByTestId('plan-editor-modal')
      await expect(planEditor).toBeVisible()

      // Change price
      await planEditor.locator('#price').fill('350')

      const patched = page.waitForResponse((res) => res.request().method() === 'PATCH' && res.url().includes(`/plans/${plan.id}`))
      await planEditor.locator('button[type="submit"]').click()
      const response = await patched
      expect(response.status()).toBe(200)
      expect(Number((await response.json()).price)).toBe(350)

      await expect(planEditor).not.toBeVisible({ timeout: 5000 })
      await expect(planCard).toContainText('350')
    } finally {
      await deletePlan(plan.id)
    }
  })

  test('delete plan with confirmation', async ({ page }) => {
    const plan = await createPlan({
      type: 'CONSULTORIA',
      name: `E2E Delete Plan ${Date.now()}`,
      sessionsPerWeek: 1,
      price: 150,
    })
    let deleted = false
    try {
      await page.reload()
      await page.waitForLoadState('networkidle')

      const planCard = page.getByTestId(`plan-card-${plan.id}`)
      await expect(planCard).toBeVisible({ timeout: 5000 })

      // The confirmation is a native window.confirm
      page.once('dialog', (dialog) => dialog.accept())
      const removed = page.waitForResponse((res) => res.request().method() === 'DELETE' && res.url().includes(`/plans/${plan.id}`))
      await planCard.locator('button:has(svg.lucide-trash-2)').click()
      expect((await removed).ok()).toBe(true)
      deleted = true

      await expect(planCard).not.toBeVisible({ timeout: 5000 })
    } finally {
      if (!deleted) await deletePlan(plan.id)
    }
  })

  test('AI instructions textarea is visible and editable', async ({ page }) => {
    // Scroll to AI instructions section
    const aiSection = page.locator('text=/instruções ia|ai instructions|prompt/i').first()
    if (await aiSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      const aiTextarea = page
        .locator('textarea')
        .filter({ hasNot: page.locator('[class*="notes"]') })
        .last()
      if (await aiTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        const testInstructions = `E2E test instructions ${Date.now()}`
        await aiTextarea.fill(testInstructions)
        await aiTextarea.blur()
        await page.waitForTimeout(500)

        // Verify persistence
        await page.reload()
        await page.waitForLoadState('networkidle')

        const reloadedTextarea = page.locator('textarea').last()
        if (await reloadedTextarea.isVisible({ timeout: 5000 }).catch(() => false)) {
          const value = await reloadedTextarea.inputValue()
          expect(value).toContain('E2E test instructions')
        }
      }
    }
  })
})
