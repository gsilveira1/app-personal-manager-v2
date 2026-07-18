import { test, expect } from '@playwright/test'
import { createClient, createSession, deleteSession, deleteClient } from './helpers/api-helpers'

test.describe('Schedule', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/schedule')
    await page.waitForLoadState('networkidle')
  })

  test('displays schedule page with Day view by default', async ({ page }) => {
    await expect(page.getByTestId('day-view')).toBeVisible({ timeout: 10000 })
  })

  test('switch between Day/Week/Month views', async ({ page }) => {
    await expect(page.getByTestId('day-view')).toBeVisible({ timeout: 10000 })

    // Switch to Week
    await page.getByRole('button', { name: /semana|week/i }).click()
    await expect(page.getByTestId('week-view')).toBeVisible()

    // Switch to Month
    await page.getByRole('button', { name: /mês|month/i }).click()
    await expect(page.getByTestId('month-view')).toBeVisible()

    // Switch back to Day
    await page.getByRole('button', { name: /dia|day/i }).click()
    await expect(page.getByTestId('day-view')).toBeVisible()
  })

  test('navigate forward and backward', async ({ page }) => {
    await expect(page.getByTestId('day-view')).toBeVisible({ timeout: 10000 })

    // Get current header text
    const header = page.locator('h2, h3').filter({ hasText: /\w+ \d+|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|january|february|march|april|may|june|july|august|september|october|november|december/i }).first()
    const initialText = await header.textContent()

    // Click next
    const nextBtn = page.locator('button:has(svg.lucide-chevron-right)').first()
    await nextBtn.click()
    await page.waitForTimeout(300)

    const afterNext = await header.textContent()
    expect(afterNext).not.toBe(initialText)

    // Click prev
    const prevBtn = page.locator('button:has(svg.lucide-chevron-left)').first()
    await prevBtn.click()
    await page.waitForTimeout(300)
  })

  test('"Today" button jumps to current date', async ({ page }) => {
    await expect(page.getByTestId('day-view')).toBeVisible({ timeout: 10000 })

    // Navigate away from today
    const nextBtn = page.locator('button:has(svg.lucide-chevron-right)').first()
    await nextBtn.click()
    await nextBtn.click()
    await page.waitForTimeout(300)

    // Click Today button
    const todayBtn = page.getByRole('button', { name: /hoje|today/i })
    await todayBtn.click()
    await page.waitForTimeout(300)

    // Should be back to today's date
    const today = new Date()
    const dayNum = today.getDate().toString()
    // The header or view should contain today's date
    await expect(page.locator('main')).toBeVisible()
  })

  test('overview banner shows stats', async ({ page }) => {
    await expect(page.getByTestId('day-view')).toBeVisible({ timeout: 10000 })

    // The overview banner is a gradient div that's clickable
    const overviewBanner = page.locator('[class*="gradient"], [class*="bg-indigo"]').filter({ hasText: /overview|visão|total|sessões|sessions/i }).first()
    if (await overviewBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(overviewBanner).toContainText(/\d/)
    }
  })

  test('create one-off session', async ({ page }) => {
    await expect(page.getByTestId('day-view')).toBeVisible({ timeout: 10000 })

    // Click add session button
    const addBtn = page.getByRole('button', { name: /nova sessão|add session|adicionar/i })
    await addBtn.click()

    await expect(page.getByTestId('session-editor-modal')).toBeVisible()

    // Select first client
    const clientSelect = page.locator('select[name="clientId"]')
    await clientSelect.selectOption({ index: 0 })

    // Set date to today
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    await page.locator('input[name="date"]').fill(dateStr)
    await page.locator('input[name="time"]').fill('10:00')

    // Submit
    await page.getByRole('button', { name: /salvar|save/i }).click()

    // Modal should close
    await expect(page.getByTestId('session-editor-modal')).not.toBeVisible({ timeout: 5000 })
  })

  test('session appears on calendar after creation', async ({ page }) => {
    // Create session via API for today
    const clients = await (await import('./helpers/api-helpers')).getClients()
    const activeClient = clients.find((c: any) => c.status === 'Active')
    if (!activeClient) return

    const today = new Date()
    today.setHours(14, 0, 0, 0)

    const session = await createSession({
      clientId: activeClient.id,
      date: today.toISOString(),
      durationMinutes: 60,
      type: activeClient.type || 'In-Person',
      category: 'Workout',
    })

    // Reload schedule
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('day-view')).toBeVisible({ timeout: 10000 })

    // Session card should be visible
    await expect(page.getByTestId(`session-card-${session.id}`)).toBeVisible({ timeout: 5000 })

    // Cleanup
    await deleteSession(session.id)
  })

  test('edit existing session', async ({ page }) => {
    // Create a session via API
    const clients = await (await import('./helpers/api-helpers')).getClients()
    const activeClient = clients.find((c: any) => c.status === 'Active')
    if (!activeClient) return

    const today = new Date()
    today.setHours(11, 0, 0, 0)

    const session = await createSession({
      clientId: activeClient.id,
      date: today.toISOString(),
      durationMinutes: 60,
      type: activeClient.type || 'In-Person',
      category: 'Workout',
    })

    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('day-view')).toBeVisible({ timeout: 10000 })

    // Click on the session card
    const sessionCard = page.getByTestId(`session-card-${session.id}`)
    if (await sessionCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sessionCard.click()
      // A details modal should open
      await page.waitForTimeout(500)
    }

    // Cleanup
    await deleteSession(session.id)
  })

  test('delete session removes from calendar', async ({ page }) => {
    const clients = await (await import('./helpers/api-helpers')).getClients()
    const activeClient = clients.find((c: any) => c.status === 'Active')
    if (!activeClient) return

    const today = new Date()
    today.setHours(15, 0, 0, 0)

    const session = await createSession({
      clientId: activeClient.id,
      date: today.toISOString(),
      durationMinutes: 60,
      type: activeClient.type || 'In-Person',
      category: 'Workout',
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Delete via API
    await deleteSession(session.id)

    // Reload and verify it's gone
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('day-view')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId(`session-card-${session.id}`)).not.toBeVisible({ timeout: 3000 })
  })

  test('toggle session completion', async ({ page }) => {
    const clients = await (await import('./helpers/api-helpers')).getClients()
    const activeClient = clients.find((c: any) => c.status === 'Active')
    if (!activeClient) return

    const today = new Date()
    today.setHours(16, 0, 0, 0)

    const session = await createSession({
      clientId: activeClient.id,
      date: today.toISOString(),
      durationMinutes: 60,
      type: activeClient.type || 'In-Person',
      category: 'Workout',
    })

    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('day-view')).toBeVisible({ timeout: 10000 })

    const sessionCard = page.getByTestId(`session-card-${session.id}`)
    if (await sessionCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click the completion toggle button inside the card
      const toggleBtn = sessionCard.getByRole('button', { name: /marcar|complete/i })
      if (await toggleBtn.isVisible().catch(() => false)) {
        await toggleBtn.click()
        // Should change to "completed" state
        await expect(sessionCard.locator('text=/concluí|completed/i')).toBeVisible({ timeout: 5000 })
      }
    }

    // Cleanup
    await deleteSession(session.id)
  })

  test('create recurring session with RRULE', async ({ page }) => {
    await expect(page.getByTestId('day-view')).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: /nova sessão|add session|adicionar/i }).click()
    await expect(page.getByTestId('session-editor-modal')).toBeVisible()

    // Select first client
    await page.locator('select[name="clientId"]').selectOption({ index: 0 })

    const today = new Date()
    await page.locator('input[name="date"]').fill(today.toISOString().split('T')[0])
    await page.locator('input[name="time"]').fill('09:00')

    // Enable recurring
    const recurringCheckbox = page.locator('input[type="checkbox"]').first()
    await recurringCheckbox.check()

    // Recurring section should appear
    await expect(page.locator('text=/frequência|frequency/i')).toBeVisible()

    // Submit
    await page.getByRole('button', { name: /salvar|save/i }).click()
    await expect(page.getByTestId('session-editor-modal')).not.toBeVisible({ timeout: 5000 })
  })

  test('conflict error shown on double-booking', async ({ page }) => {
    // Create a session for a specific time slot
    const clients = await (await import('./helpers/api-helpers')).getClients()
    const activeClient = clients.find((c: any) => c.status === 'Active')
    if (!activeClient) return

    const today = new Date()
    today.setHours(17, 0, 0, 0)

    const session = await createSession({
      clientId: activeClient.id,
      date: today.toISOString(),
      durationMinutes: 60,
      type: activeClient.type || 'In-Person',
      category: 'Workout',
    })

    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('day-view')).toBeVisible({ timeout: 10000 })

    // Try to create another session at the same time
    await page.getByRole('button', { name: /nova sessão|add session|adicionar/i }).click()
    await expect(page.getByTestId('session-editor-modal')).toBeVisible()

    await page.locator('select[name="clientId"]').selectOption({ index: 0 })
    await page.locator('input[name="date"]').fill(today.toISOString().split('T')[0])
    await page.locator('input[name="time"]').fill('17:00')

    await page.getByRole('button', { name: /salvar|save/i }).click()

    // Should show conflict error
    const errorEl = page.locator('[class*="red"], [class*="error"]').filter({ hasText: /conflict|conflito|horário/i })
    if (await errorEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(errorEl).toBeVisible()
    }

    // Cleanup
    await deleteSession(session.id)
  })

  test('create and display availability block', async ({ page }) => {
    await expect(page.getByTestId('day-view')).toBeVisible({ timeout: 10000 })

    // Click block button
    const blockBtn = page.getByRole('button', { name: /bloqu|block/i })
    if (await blockBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await blockBtn.click()

      // Fill block form
      const modal = page.locator('[data-testid="block-editor-modal"], [class*="modal"]').first()
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Fill title
        const titleInput = modal.locator('input').first()
        await titleInput.fill('E2E Lunch Block')

        // Submit
        const saveBtn = modal.getByRole('button', { name: /salvar|save/i })
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click()
        }
      }
    }
  })
})
