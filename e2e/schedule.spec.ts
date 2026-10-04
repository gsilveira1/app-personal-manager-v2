import { test, expect, type Page } from '@playwright/test'
import { createClient, createSession, deleteSession, deleteClient, deleteAvailabilityBlock } from './helpers/api-helpers'

/**
 * Every test books its own slot of today, for a client it creates itself, and removes
 * both again: the API refuses a second session in a taken slot (409), so leftovers of one
 * test (or one run) must never be in the way of another.
 *
 * The day view lists 06:00–22:00 and renders one card per hour, so each test owns a whole
 * hour; the hours are the ones the seed leaves free (it uses 8–13, 15 and 17).
 */
const SLOTS = {
  toggle: '06:00',
  conflict: '07:00',
  blockStart: '14:00',
  blockEnd: '14:30',
  uiOneOff: '18:00',
  uiRecurring: '19:00',
  appears: '20:00',
  edit: '21:00',
  remove: '22:00',
} as const

const pad = (n: number) => String(n).padStart(2, '0')

/** Today as the `yyyy-MM-dd` a date input expects, in the browser's (local) time zone. */
function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Today at a local `HH:mm`, as the ISO instant the API expects. */
function todayAt(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

function createScheduleClient(label: string) {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  return createClient({ name: `E2E Schedule ${label} ${unique}`, email: `e2e-schedule-${unique}@test.com`, phone: '53999444444', dateOfBirth: '1990-01-01' })
}

function createSlotSession(clientId: string, time: string) {
  return createSession({ clientId, date: todayAt(time), durationMinutes: 30, type: 'In-Person', category: 'Workout' })
}

/** (Re)loads the schedule: a `goto` to the URL the page is already on would not reload the app's data. */
async function openSchedule(page: Page) {
  if (page.url().endsWith('/schedule')) await page.reload()
  else await page.goto('/schedule')
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('week-view')).toBeVisible({ timeout: 10000 })
}

async function showDayView(page: Page) {
  // anchored: "Today" also contains "day"
  await page.getByRole('button', { name: /^(dia|day|día)$/i }).click()
  await expect(page.getByTestId('day-view')).toBeVisible()
}

async function openSessionEditor(page: Page) {
  await page.getByRole('button', { name: /adicionar sessão|add session|agregar sesión/i }).click()
  const modal = page.getByTestId('session-editor-modal')
  await expect(modal).toBeVisible()
  return modal
}

/** Resolves with the body of the next successful `POST <path>` the page makes. */
function waitForCreated(page: Page, path: string) {
  return page.waitForResponse((res) => res.request().method() === 'POST' && new URL(res.url()).pathname.endsWith(path))
}

test.describe('Schedule', () => {
  test.beforeEach(async ({ page }) => {
    await openSchedule(page)
  })

  test('displays schedule page with Week view by default', async ({ page }) => {
    await expect(page.getByTestId('week-view')).toBeVisible()
    await expect(page.getByTestId('day-view')).not.toBeVisible()
  })

  test('switch between Day/Week/Month views', async ({ page }) => {
    await showDayView(page)

    // Switch to Week
    await page.getByRole('button', { name: /^(semana|week)$/i }).click()
    await expect(page.getByTestId('week-view')).toBeVisible()

    // Switch to Month
    await page.getByRole('button', { name: /^(mês|month|mes)$/i }).click()
    await expect(page.getByTestId('month-view')).toBeVisible()

    // Switch back to Day
    await showDayView(page)
  })

  test('navigate forward and backward', async ({ page }) => {
    await showDayView(page)

    const header = page.getByTestId('schedule-range-label')
    const initialText = await header.textContent()
    expect(initialText).toBeTruthy()

    await page.locator('button:has(svg.lucide-chevron-right)').first().click()
    await expect(header).not.toHaveText(initialText!)

    await page.locator('button:has(svg.lucide-chevron-left)').first().click()
    await expect(header).toHaveText(initialText!)
  })

  test('"Today" button jumps to current date', async ({ page }) => {
    await showDayView(page)

    const header = page.getByTestId('schedule-range-label')
    const todayText = await header.textContent()
    expect(todayText).toBeTruthy()

    // Navigate away from today
    const nextBtn = page.locator('button:has(svg.lucide-chevron-right)').first()
    await nextBtn.click()
    await nextBtn.click()
    await expect(header).not.toHaveText(todayText!)

    await page.getByRole('button', { name: /^(hoje|today|hoy)$/i }).click()

    await expect(header).toHaveText(todayText!)
  })

  test('overview banner shows stats', async ({ page }) => {
    // The overview banner is the clickable gradient card above the calendar
    const overviewBanner = page
      .locator('[class*="gradient"], [class*="bg-indigo"]')
      .filter({ hasText: /overview|visão|resumen|total/i })
      .first()
    await expect(overviewBanner).toBeVisible()
    await expect(overviewBanner).toContainText(/\d/)
  })

  test('create one-off session', async ({ page }) => {
    const client = await createScheduleClient('OneOff')
    let sessionId: string | undefined
    try {
      await openSchedule(page)
      await showDayView(page)
      const modal = await openSessionEditor(page)

      await modal.locator('select[name="clientId"]').selectOption(client.id)
      await modal.locator('input[name="date"]').fill(localDate())
      await modal.locator('input[name="time"]').fill(SLOTS.uiOneOff)

      const created = waitForCreated(page, '/sessions')
      await modal.getByRole('button', { name: /^(salvar|save|guardar)$/i }).click()
      const response = await created
      expect(response.status()).toBe(201)
      sessionId = (await response.json()).id

      await expect(modal).not.toBeVisible({ timeout: 5000 })
      await expect(page.getByTestId(`session-card-${sessionId}`)).toBeVisible({ timeout: 5000 })
    } finally {
      if (sessionId) await deleteSession(sessionId)
      await deleteClient(client.id)
    }
  })

  test('session appears on calendar after creation', async ({ page }) => {
    const client = await createScheduleClient('Appears')
    const session = await createSlotSession(client.id, SLOTS.appears)
    try {
      await openSchedule(page)
      await showDayView(page)

      const card = page.getByTestId(`session-card-${session.id}`)
      await expect(card).toBeVisible({ timeout: 5000 })
      await expect(card).toContainText(client.name)
    } finally {
      await deleteSession(session.id)
      await deleteClient(client.id)
    }
  })

  test('edit existing session', async ({ page }) => {
    const client = await createScheduleClient('Edit')
    const session = await createSlotSession(client.id, SLOTS.edit)
    try {
      await openSchedule(page)
      await showDayView(page)

      // The card opens the details modal, which leads to the editor
      await page.getByTestId(`session-card-${session.id}`).click()
      await page.getByRole('button', { name: /editar sess|edit session|editar sesi/i }).click()
      const modal = page.getByTestId('session-editor-modal')
      await expect(modal).toBeVisible()

      const note = `E2E edited ${Date.now()}`
      await modal.locator('input[name="notes"]').fill(note)
      const patched = page.waitForResponse((res) => res.request().method() === 'PATCH' && res.url().includes(`/sessions/${session.id}`))
      await modal.getByRole('button', { name: /^(salvar|save|guardar)$/i }).click()

      const response = await patched
      expect(response.status()).toBe(200)
      expect((await response.json()).notes).toBe(note)
      await expect(modal).not.toBeVisible({ timeout: 5000 })
    } finally {
      await deleteSession(session.id)
      await deleteClient(client.id)
    }
  })

  test('delete session removes from calendar', async ({ page }) => {
    const client = await createScheduleClient('Delete')
    const session = await createSlotSession(client.id, SLOTS.remove)
    let deleted = false
    try {
      await openSchedule(page)
      await showDayView(page)
      await expect(page.getByTestId(`session-card-${session.id}`)).toBeVisible({ timeout: 5000 })

      // Delete via API
      await deleteSession(session.id)
      deleted = true

      // Reload and verify it's gone
      await openSchedule(page)
      await showDayView(page)
      await expect(page.getByTestId(`session-card-${session.id}`)).not.toBeVisible({ timeout: 3000 })
    } finally {
      if (!deleted) await deleteSession(session.id)
      await deleteClient(client.id)
    }
  })

  test('toggle session completion', async ({ page }) => {
    const client = await createScheduleClient('Toggle')
    const session = await createSlotSession(client.id, SLOTS.toggle)
    try {
      await openSchedule(page)
      await showDayView(page)

      const sessionCard = page.getByTestId(`session-card-${session.id}`)
      await expect(sessionCard).toBeVisible({ timeout: 5000 })

      // Click the completion toggle button inside the card
      await sessionCard.getByRole('button', { name: /marcar|mark complete/i }).click()

      // Should change to "completed" state
      await expect(sessionCard.getByRole('button', { name: /^(concluído|completed|completado)$/i })).toBeVisible({ timeout: 5000 })
    } finally {
      await deleteSession(session.id)
      await deleteClient(client.id)
    }
  })

  test('create recurring session with RRULE', async ({ page }) => {
    const client = await createScheduleClient('Recurring')
    let seriesId: string | undefined
    try {
      await openSchedule(page)
      await showDayView(page)
      const modal = await openSessionEditor(page)

      await modal.locator('select[name="clientId"]').selectOption(client.id)
      await modal.locator('input[name="date"]').fill(localDate())
      await modal.locator('input[name="time"]').fill(SLOTS.uiRecurring)

      // Enable recurring
      await modal.locator('input[type="checkbox"]').first().check()

      // Recurring section should appear
      await expect(modal.getByText(/^(frequência|frequency|frecuencia)$/i)).toBeVisible()

      const created = waitForCreated(page, '/sessions')
      await modal.getByRole('button', { name: /^(salvar|save|guardar)$/i }).click()
      const response = await created
      expect(response.status()).toBe(201)
      expect(response.request().postDataJSON().rrule).toMatch(/^FREQ=/)
      seriesId = (await response.json()).id

      await expect(modal).not.toBeVisible({ timeout: 5000 })
      // The series has no stored rows: today's occurrence arrives with the refetched range
      await expect(page.locator(`[data-testid^="session-card-${seriesId}_"]`)).toBeVisible({ timeout: 5000 })
    } finally {
      if (seriesId) await deleteSession(seriesId)
      await deleteClient(client.id)
    }
  })

  test('conflict error shown on double-booking', async ({ page }) => {
    const client = await createScheduleClient('Conflict')
    const session = await createSlotSession(client.id, SLOTS.conflict)
    try {
      await openSchedule(page)
      await showDayView(page)
      await expect(page.getByTestId(`session-card-${session.id}`)).toBeVisible({ timeout: 5000 })

      // Try to create another session at the same time
      const modal = await openSessionEditor(page)
      await modal.locator('select[name="clientId"]').selectOption(client.id)
      await modal.locator('input[name="date"]').fill(localDate())
      await modal.locator('input[name="time"]').fill(SLOTS.conflict)
      await modal.getByRole('button', { name: /^(salvar|save|guardar)$/i }).click()

      // Should show the conflict error and keep the editor open
      await expect(modal.getByText(/conflita|conflicts|conflicto/i)).toBeVisible()
      await expect(modal).toBeVisible()
    } finally {
      await deleteSession(session.id)
      await deleteClient(client.id)
    }
  })

  test('create and display availability block', async ({ page }) => {
    await showDayView(page)
    const title = `E2E Block ${Date.now()}`
    let blockId: string | undefined
    try {
      // "Bloquear" has no translation key: the label is the same in every language
      await page.getByRole('button', { name: /^(bloquear|block)$/i }).click()

      // The block editor is a ModalShell without a form element or test id
      const form = page.locator('div.fixed').filter({ has: page.locator('#block-title') })
      await expect(form).toBeVisible()
      await form.locator('#block-title').fill(title)
      await form.locator('#block-date').fill(localDate())
      await form.locator('#block-start').fill(SLOTS.blockStart)
      await form.locator('#block-end').fill(SLOTS.blockEnd)

      const created = waitForCreated(page, '/availability-blocks')
      await form.getByRole('button', { name: /^(bloquear|block)$/i }).click()
      const response = await created
      expect(response.status()).toBe(201)
      blockId = (await response.json()).id

      await expect(form).not.toBeVisible({ timeout: 5000 })
      await expect(page.getByTestId('day-view').getByText(title)).toBeVisible({ timeout: 5000 })
    } finally {
      if (blockId) await deleteAvailabilityBlock(blockId)
    }
  })
})
