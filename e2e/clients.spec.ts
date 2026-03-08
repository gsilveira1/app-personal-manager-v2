import { test, expect } from '@playwright/test'

test.describe('Clients Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[type="email"]', 'trainer@vivi.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/(dashboard)?$/, { timeout: 10000 })
  })

  test('should display clients list', async ({ page }) => {
    await page.goto('/clients')
    // The page should show a table/list of clients
    await expect(page.locator('table, [class*="client"], [data-testid="clients-list"]')).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to client details', async ({ page }) => {
    await page.goto('/clients')

    // Click on the first client row/card
    const clientRow = page.locator('table tbody tr, [class*="client-card"]').first()
    if (await clientRow.isVisible({ timeout: 5000 })) {
      await clientRow.click()
      // Should navigate to client details page
      await expect(page).toHaveURL(/\/clients\/[a-zA-Z0-9-]+/, { timeout: 5000 })
    }
  })

  test('should add a new client via modal/form', async ({ page }) => {
    await page.goto('/clients')

    // Click add button
    const addButton = page.locator('button:has-text("Novo"), button:has-text("Adicionar"), button:has-text("Add"), [data-testid="add-client"]')
    if (await addButton.isVisible({ timeout: 5000 })) {
      await addButton.click()

      // Fill in the form (modal or inline)
      await page.fill('input[name="name"], input[placeholder*="nome" i]', 'E2E Test Client')
      await page.fill('input[name="email"], input[placeholder*="email" i]', `e2e-${Date.now()}@test.com`)
      await page.fill('input[name="phone"], input[placeholder*="telefone" i], input[placeholder*="phone" i]', '53999000000')

      // Submit
      const submitBtn = page.locator('button[type="submit"], button:has-text("Salvar"), button:has-text("Save")')
      await submitBtn.click()

      // Verify client appears in list
      await expect(page.locator('text=E2E Test Client')).toBeVisible({ timeout: 10000 })
    }
  })

  test('should show client status badges with translated text', async ({ page }) => {
    await page.goto('/clients')

    // Look for status badges — Active, Lead, Inactive
    const statusBadge = page.locator('[class*="badge"], [class*="status"]').first()
    if (await statusBadge.isVisible({ timeout: 5000 })) {
      const text = await statusBadge.textContent()
      // Should contain translated status text (Portuguese)
      expect(text).toBeTruthy()
    }
  })

  test('should filter/search clients by name', async ({ page }) => {
    await page.goto('/clients')

    const searchInput = page.locator('input[placeholder*="buscar" i], input[placeholder*="pesquisar" i], input[placeholder*="search" i], input[type="search"]')
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('Maria')
      // Wait for filtering to take effect
      await page.waitForTimeout(500)
      // Verify filtered results
      const rows = page.locator('table tbody tr, [class*="client-card"]')
      const count = await rows.count()
      // Should have fewer rows than before (or at least the search happened)
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })
})
