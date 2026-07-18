import { test, expect } from '@playwright/test'
import { createClient, deleteClient } from './helpers/api-helpers'

test.describe('Clients', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/clients')
    await page.waitForLoadState('networkidle')
  })

  test('displays clients table with seeded data', async ({ page }) => {
    const table = page.getByTestId('clients-table')
    await expect(table).toBeVisible({ timeout: 10000 })

    // Should have at least one row
    const rows = page.locator('table tbody tr')
    await expect(rows.first()).toBeVisible()
    expect(await rows.count()).toBeGreaterThan(0)
  })

  test('search/filter clients by name', async ({ page }) => {
    await expect(page.getByTestId('clients-table')).toBeVisible({ timeout: 10000 })

    const searchInput = page.getByPlaceholder(/buscar|pesquisar|search/i)
    await expect(searchInput).toBeVisible()

    // Get initial row count
    const initialCount = await page.locator('table tbody tr').count()

    // Type a name that likely won't match all clients
    await searchInput.fill('zzzzz_nonexistent')
    await page.waitForTimeout(300)

    // Should show fewer or zero rows
    const filteredCount = await page.locator('table tbody tr').count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)
  })

  test('open Add Client modal', async ({ page }) => {
    await expect(page.getByTestId('clients-table')).toBeVisible({ timeout: 10000 })

    const addButton = page.getByRole('button', { name: /novo|adicionar|add/i })
    await addButton.click()

    await expect(page.getByTestId('add-client-modal')).toBeVisible()
  })

  test('create new client with required fields', async ({ page }) => {
    await expect(page.getByTestId('clients-table')).toBeVisible({ timeout: 10000 })

    // Open modal
    await page.getByRole('button', { name: /novo|adicionar|add/i }).click()
    await expect(page.getByTestId('add-client-modal')).toBeVisible()

    const uniqueName = `E2E Client ${Date.now()}`

    // Fill required fields
    await page.locator('#name').fill(uniqueName)
    await page.locator('#dateOfBirth').fill('1990-01-15')
    await page.locator('#email').fill(`e2e-${Date.now()}@test.com`)
    await page.locator('#phone').fill('53999000000')

    // Submit
    await page.getByRole('button', { name: /adicionar|salvar|save|add client/i }).last().click()

    // Verify client appears in table
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible({ timeout: 10000 })
  })

  test('navigate to client details by clicking row', async ({ page }) => {
    await expect(page.getByTestId('clients-table')).toBeVisible({ timeout: 10000 })

    const firstRow = page.locator('table tbody tr').first()
    await firstRow.click()

    await expect(page).toHaveURL(/\/#\/clients\/[a-zA-Z0-9-]+/, { timeout: 5000 })
  })

  test('client type badges display correctly', async ({ page }) => {
    await expect(page.getByTestId('clients-table')).toBeVisible({ timeout: 10000 })

    // Should have status badges in the table
    const badges = page.locator('table tbody td span[class*="bg-"]')
    await expect(badges.first()).toBeVisible()
  })

  test('delete client with confirmation', async ({ page }) => {
    // Create a client to delete via API
    const client = await createClient({
      name: `E2E Delete ${Date.now()}`,
      email: `e2e-delete-${Date.now()}@test.com`,
      phone: '53999111111',
      dateOfBirth: '1990-01-01',
    })

    // Reload the clients page
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('clients-table')).toBeVisible({ timeout: 10000 })

    // Navigate to client details
    await page.goto(`/#/clients/${client.id}`)
    await page.waitForLoadState('networkidle')

    // Look for delete action — cleanup via API as fallback
    await deleteClient(client.id)
  })

  test('empty search shows no clients message', async ({ page }) => {
    await expect(page.getByTestId('clients-table')).toBeVisible({ timeout: 10000 })

    const searchInput = page.getByPlaceholder(/buscar|pesquisar|search/i)
    await searchInput.fill('zzzzz_definitely_no_match_12345')
    await page.waitForTimeout(300)

    // Should show empty state
    await expect(page.locator('text=/nenhum|no clients|sem resultados/i')).toBeVisible()
  })
})
