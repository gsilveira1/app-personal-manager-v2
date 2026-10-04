import { test, expect, type Page } from '@playwright/test'
import { createWorkout, deleteWorkout } from './helpers/api-helpers'

/** The page opens on the "Clients" tab; the template library is the second tab. */
async function openLibrary(page: Page) {
  await page.getByRole('button', { name: /^(modelos|templates|plantillas)$/i }).click()
  await expect(page.getByTestId('workout-library')).toBeVisible({ timeout: 10000 })
}

async function openAiGenerator(page: Page) {
  await page.getByRole('button', { name: /^(gerador ia|ai generator|generador ia)$/i }).click()
  await expect(page.getByTestId('ai-generator-form')).toBeVisible()
}

/** Reloads the app so it picks up data created through the API, then opens the library. */
async function reloadLibrary(page: Page) {
  await page.reload()
  await page.waitForLoadState('networkidle')
  await openLibrary(page)
}

function waitForTemplateCreated(page: Page) {
  return page.waitForResponse((res) => res.request().method() === 'POST' && new URL(res.url()).pathname.endsWith('/workout-templates'))
}

test.describe('Workouts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workouts')
    await page.waitForLoadState('networkidle')
  })

  test('library tab displays workout template cards', async ({ page }) => {
    const workout = await createWorkout({ title: `E2E Listed Workout ${Date.now()}`, exercises: [{ name: 'Squat', sets: 3, reps: '12' }] })
    try {
      await reloadLibrary(page)

      const card = page.getByTestId(`workout-card-${workout.id}`)
      await expect(card).toBeVisible()
      await expect(card).toContainText(workout.name)
    } finally {
      await deleteWorkout(workout.id)
    }
  })

  test('create new workout template', async ({ page }) => {
    await openLibrary(page)
    const title = `E2E Test Workout ${Date.now()}`
    let workoutId: string | undefined
    try {
      // The dashed "create" card at the end of the library
      await page.getByRole('button', { name: /criar modelo|create template|crear plantilla/i }).click()

      await page.locator('input#title').fill(title)
      // A new template starts with one empty exercise row; add a second one
      const exerciseNames = page.getByPlaceholder(/supino reto|bench press|press de banca/i)
      await expect(exerciseNames).toHaveCount(1)
      await page
        .getByRole('button', { name: /^(adicionar item|add item|agregar ítem)$/i })
        .first()
        .click()
      await expect(exerciseNames).toHaveCount(2)
      await exerciseNames.nth(0).fill('E2E Squat')
      await exerciseNames.nth(1).fill('E2E Lunge')

      const created = waitForTemplateCreated(page)
      await page.getByRole('button', { name: /salvar treino|save workout|guardar entrenamiento/i }).click()
      const response = await created
      expect(response.status()).toBe(201)
      workoutId = (await response.json()).id

      const card = page.getByTestId(`workout-card-${workoutId}`)
      await expect(card).toBeVisible({ timeout: 5000 })
      await expect(card).toContainText(title)
    } finally {
      if (workoutId) await deleteWorkout(workoutId)
    }
  })

  test('edit workout template', async ({ page }) => {
    const workout = await createWorkout({
      title: `E2E Edit Workout ${Date.now()}`,
      description: 'Test workout for editing',
      exercises: [
        { name: 'Squat', sets: 3, reps: '12' },
        { name: 'Bench Press', sets: 4, reps: '10' },
      ],
      tags: ['test'],
    })
    try {
      await reloadLibrary(page)

      const workoutCard = page.getByTestId(`workout-card-${workout.id}`)
      await workoutCard.getByTitle(/editar modelo|edit template|editar plantilla/i).click()

      // Edit modal should open — change title
      const updatedTitle = `E2E Updated Workout ${Date.now()}`
      const titleInput = page.locator('input#title')
      await expect(titleInput).toHaveValue(workout.name)
      await titleInput.fill(updatedTitle)

      const patched = page.waitForResponse((res) => res.request().method() === 'PATCH' && res.url().includes(`/workout-sheets/${workout.id}`))
      await page.getByRole('button', { name: /salvar treino|save workout|guardar entrenamiento/i }).click()
      expect((await patched).status()).toBe(200)

      await expect(workoutCard).toContainText(updatedTitle)
    } finally {
      await deleteWorkout(workout.id)
    }
  })

  test('delete workout template with confirmation', async ({ page }) => {
    const workout = await createWorkout({
      title: `E2E Delete Workout ${Date.now()}`,
      description: 'To be deleted',
      exercises: [{ name: 'Deadlift', sets: 3, reps: '8' }],
      tags: ['test'],
    })
    let deleted = false
    try {
      await reloadLibrary(page)

      const workoutCard = page.getByTestId(`workout-card-${workout.id}`)
      await expect(workoutCard).toBeVisible()

      // The confirmation is a native window.confirm
      page.once('dialog', (dialog) => dialog.accept())
      const removed = page.waitForResponse((res) => res.request().method() === 'DELETE' && res.url().includes(`/workout-sheets/${workout.id}`))
      await workoutCard.getByTitle(/excluir modelo|delete template|eliminar plantilla/i).click()
      expect((await removed).status()).toBe(200)
      deleted = true

      // Card should be gone
      await expect(workoutCard).not.toBeVisible({ timeout: 5000 })
    } finally {
      if (!deleted) await deleteWorkout(workout.id)
    }
  })

  test('expand workout to see exercises', async ({ page }) => {
    const workout = await createWorkout({ title: `E2E Expand Workout ${Date.now()}`, exercises: [{ name: 'E2E Lunge', sets: 3, reps: '15' }] })
    try {
      await reloadLibrary(page)

      const workoutCard = page.getByTestId(`workout-card-${workout.id}`)
      await workoutCard.getByRole('button', { name: /ver 1 |view 1 /i }).click()

      // Exercises should be visible
      await expect(workoutCard.getByText('E2E Lunge')).toBeVisible({ timeout: 3000 })
      await expect(workoutCard.getByText('3 x 15')).toBeVisible()
    } finally {
      await deleteWorkout(workout.id)
    }
  })

  test('switch to AI generator tab', async ({ page }) => {
    await openAiGenerator(page)
  })

  test('AI generator fills form and submits (mocked)', async ({ page }) => {
    // The app asks its own API for the plan (POST /ai/workout-plan); only that call is mocked
    const title = `E2E AI Workout ${Date.now()}`
    await page.route('**/api/ai/workout-plan', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          title,
          description: 'Generated for testing',
          exercises: [
            { name: 'Squat', sets: 3, reps: '12', notes: 'Full depth' },
            { name: 'Bench Press', sets: 4, reps: '10', notes: 'Control descent' },
          ],
          tags: ['strength', 'test'],
        }),
      })
    )

    let workoutId: string | undefined
    try {
      await openAiGenerator(page)

      await page.locator('#clientName').fill('E2E AI Client')
      await page.locator('#goal').fill('Strength')

      const aiRequest = page.waitForRequest((req) => req.method() === 'POST' && req.url().includes('/api/ai/workout-plan'))
      const created = waitForTemplateCreated(page)
      await page.getByRole('button', { name: /gerar treino|generate workout|generar entrenamiento/i }).click()

      // The generator sends the form, authenticated (the route needs the bearer token)
      const request = await aiRequest
      expect(request.postDataJSON()).toMatchObject({ clientName: 'E2E AI Client', goal: 'Strength' })
      expect(request.headers().authorization).toMatch(/^Bearer /)

      // The generated plan is saved as a template and shown in the library
      const response = await created
      expect(response.status()).toBe(201)
      workoutId = (await response.json()).id

      await expect(page.getByTestId('workout-library')).toBeVisible()
      await expect(page.getByTestId(`workout-card-${workoutId}`)).toContainText(title)
    } finally {
      if (workoutId) await deleteWorkout(workoutId)
    }
  })

  test('AI generator handles error gracefully', async ({ page }) => {
    // What the API answers when the provider fails (contract R12)
    await page.route('**/api/ai/workout-plan', (route) =>
      route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ statusCode: 502, message: 'AI provider request failed', error: 'Bad Gateway' }) })
    )

    await openAiGenerator(page)

    await page.locator('#clientName').fill('E2E Error Client')
    await page.locator('#goal').fill('Test error')

    await page.getByRole('button', { name: /gerar treino|generate workout|generar entrenamiento/i }).click()

    // Should show the error message and stay on the form
    const form = page.getByTestId('ai-generator-form')
    await expect(form.locator('[class*="red"]').filter({ hasText: /falha|failed|error/i })).toBeVisible({ timeout: 10000 })
    await expect(form).toBeVisible()
  })
})
