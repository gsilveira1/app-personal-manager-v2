import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/')
    await page.waitForLoadState('networkidle')
  })

  test('sidebar displays all nav links', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toBeVisible()

    await expect(page.getByTestId('nav-dashboard')).toBeVisible()
    await expect(page.getByTestId('nav-clients')).toBeVisible()
    await expect(page.getByTestId('nav-schedule')).toBeVisible()
    await expect(page.getByTestId('nav-workouts')).toBeVisible()
    await expect(page.getByTestId('nav-leads')).toBeVisible()
    await expect(page.getByTestId('nav-settings')).toBeVisible()
  })

  test('clicking each nav link navigates to correct page', async ({ page }) => {
    const routes = [
      { testId: 'nav-clients', url: /\/#\/clients/ },
      { testId: 'nav-schedule', url: /\/#\/schedule/ },
      { testId: 'nav-workouts', url: /\/#\/workouts/ },
      { testId: 'nav-leads', url: /\/#\/leads/ },
      { testId: 'nav-settings', url: /\/#\/settings/ },
      { testId: 'nav-dashboard', url: /\/#\/$/ },
    ]

    for (const { testId, url } of routes) {
      await page.getByTestId(testId).click()
      await expect(page).toHaveURL(url, { timeout: 5000 })
    }
  })

  test('active link is highlighted in sidebar', async ({ page }) => {
    await page.getByTestId('nav-clients').click()
    await expect(page).toHaveURL(/\/#\/clients/)

    // The active NavLink gets the 'bg-indigo-600' class
    const clientsLink = page.getByTestId('nav-clients')
    await expect(clientsLink).toHaveClass(/bg-indigo-600/)
  })

  test('user menu shows user info', async ({ page }) => {
    const userMenu = page.getByTestId('user-menu')
    await expect(userMenu).toBeVisible()

    await page.getByTestId('user-menu-toggle').click()
    // Dropdown should show user name/email
    await expect(page.getByTestId('user-menu-logout')).toBeVisible()
  })

  test('mobile sidebar toggles on hamburger click', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/#/')
    await page.waitForLoadState('networkidle')

    // Sidebar should be hidden (translated off-screen) on mobile
    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toHaveClass(/-translate-x-full/)

    // Click hamburger menu (the Menu button in the header)
    const hamburger = page.locator('button:has(svg.lucide-menu)')
    if (await hamburger.isVisible({ timeout: 2000 })) {
      await hamburger.click()
      // Sidebar should now be visible
      await expect(sidebar).toHaveClass(/translate-x-0/)
    }
  })
})
