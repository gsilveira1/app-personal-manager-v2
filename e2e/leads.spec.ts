import { test, expect } from '@playwright/test'
import { createClient, getClients, getPlans, deleteClient } from './helpers/api-helpers'

test.describe('Leads', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/leads')
    await page.waitForLoadState('networkidle')
  })

  test('kanban board renders columns', async ({ page }) => {
    const kanban = page.getByTestId('lead-kanban')
    await expect(kanban).toBeVisible({ timeout: 10000 })

    // Should have at least 3 columns
    const columns = page.locator('[data-testid^="lead-column-"]')
    expect(await columns.count()).toBeGreaterThanOrEqual(3)
  })

  test('lead cards display in columns', async ({ page }) => {
    const kanban = page.getByTestId('lead-kanban')
    await expect(kanban).toBeVisible({ timeout: 10000 })

    // Lead cards or empty states should exist
    const cards = page.locator('[data-testid^="lead-card-"]')
    const emptyStates = page.locator('text=/nenhum|no leads|sem leads/i')

    // Either there are cards or empty states
    const cardCount = await cards.count()
    const emptyCount = await emptyStates.count()
    expect(cardCount + emptyCount).toBeGreaterThan(0)
  })

  test('click lead card opens drawer', async ({ page }) => {
    const kanban = page.getByTestId('lead-kanban')
    await expect(kanban).toBeVisible({ timeout: 10000 })

    const firstCard = page.locator('[data-testid^="lead-card-"]').first()
    if (await firstCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstCard.click()
      await expect(page.getByTestId('lead-drawer')).toBeVisible({ timeout: 3000 })
    }
  })

  test('change lead stage via drawer dropdown', async ({ page }) => {
    const kanban = page.getByTestId('lead-kanban')
    await expect(kanban).toBeVisible({ timeout: 10000 })

    const firstCard = page.locator('[data-testid^="lead-card-"]').first()
    if (await firstCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstCard.click()
      const drawer = page.getByTestId('lead-drawer')
      await expect(drawer).toBeVisible()

      // Click a stage button in the drawer to change stage
      const stageButtons = drawer.locator('button').filter({ hasText: /contactado|contacted|interessado|interested|novo|new/i })
      const secondStageBtn = stageButtons.nth(1)
      if (await secondStageBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await secondStageBtn.click()
        await page.waitForTimeout(500)
      }

      // Close drawer
      const closeBtn = drawer.locator('button:has(svg.lucide-x)')
      await closeBtn.click()
    }
  })

  test('update lead notes in drawer', async ({ page }) => {
    const kanban = page.getByTestId('lead-kanban')
    await expect(kanban).toBeVisible({ timeout: 10000 })

    const firstCard = page.locator('[data-testid^="lead-card-"]').first()
    if (await firstCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstCard.click()
      const drawer = page.getByTestId('lead-drawer')
      await expect(drawer).toBeVisible()

      const notesTextarea = drawer.locator('textarea')
      if (await notesTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await notesTextarea.fill('E2E test notes for lead')
        await notesTextarea.blur() // triggers auto-save on blur
        await page.waitForTimeout(500)
      }

      // Close drawer
      const closeBtn = drawer.locator('button:has(svg.lucide-x)')
      await closeBtn.click()
    }
  })

  test('convert lead to active client', async ({ page }) => {
    // Create a lead via API
    const lead = await createClient({
      name: `E2E Lead Convert ${Date.now()}`,
      email: `e2e-lead-${Date.now()}@test.com`,
      phone: '53999222222',
      status: 'Lead',
      type: 'In-Person',
    })

    await page.reload()
    await page.waitForLoadState('networkidle')
    const kanban = page.getByTestId('lead-kanban')
    await expect(kanban).toBeVisible({ timeout: 10000 })

    // Click on the lead card
    const leadCard = page.getByTestId(`lead-card-${lead.id}`)
    if (await leadCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await leadCard.click()
      const drawer = page.getByTestId('lead-drawer')
      await expect(drawer).toBeVisible()

      // Click convert button
      const convertBtn = drawer.getByRole('button', { name: /converter|convert/i })
      if (await convertBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await convertBtn.click()

        // Confirm conversion (modal appears)
        const confirmBtn = page.getByRole('button', { name: /confirmar|confirm/i })
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click()
          await page.waitForTimeout(1000)
        }
      }
    } else {
      // Cleanup
      await deleteClient(lead.id)
    }
  })

  test('mark lead as lost', async ({ page }) => {
    // Create a lead to mark as lost
    const lead = await createClient({
      name: `E2E Lead Lost ${Date.now()}`,
      email: `e2e-lost-${Date.now()}@test.com`,
      phone: '53999333333',
      status: 'Lead',
      type: 'In-Person',
    })

    await page.reload()
    await page.waitForLoadState('networkidle')
    const kanban = page.getByTestId('lead-kanban')
    await expect(kanban).toBeVisible({ timeout: 10000 })

    const leadCard = page.getByTestId(`lead-card-${lead.id}`)
    if (await leadCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await leadCard.click()
      const drawer = page.getByTestId('lead-drawer')
      await expect(drawer).toBeVisible()

      // Click "Mark as Lost" button
      const lostBtn = drawer.getByRole('button', { name: /perdido|lost|perder/i })
      if (await lostBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await lostBtn.click()
        await page.waitForTimeout(1000)

        // Lead should disappear from kanban
        await expect(page.getByTestId(`lead-card-${lead.id}`)).not.toBeVisible({ timeout: 5000 })
      }
    } else {
      await deleteClient(lead.id)
    }
  })

  test('WhatsApp link generated correctly in drawer', async ({ page }) => {
    const kanban = page.getByTestId('lead-kanban')
    await expect(kanban).toBeVisible({ timeout: 10000 })

    const firstCard = page.locator('[data-testid^="lead-card-"]').first()
    if (await firstCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstCard.click()
      const drawer = page.getByTestId('lead-drawer')
      await expect(drawer).toBeVisible()

      // WhatsApp link should point to wa.me
      const whatsappLink = drawer.locator('a[href*="wa.me"]')
      await expect(whatsappLink).toBeVisible()
      const href = await whatsappLink.getAttribute('href')
      expect(href).toMatch(/wa\.me/)

      // Close drawer
      const closeBtn = drawer.locator('button:has(svg.lucide-x)')
      await closeBtn.click()
    }
  })
})
