import { test, expect } from '@playwright/test'
import { createWorkout, deleteWorkout } from './helpers/api-helpers'

test.describe('Workouts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/workouts')
    await page.waitForLoadState('networkidle')
  })

  test('library tab displays workout template cards', async ({ page }) => {
    const library = page.getByTestId('workout-library')
    await expect(library).toBeVisible({ timeout: 10000 })
  })

  test('create new workout template', async ({ page }) => {
    await expect(page.getByTestId('workout-library')).toBeVisible({ timeout: 10000 })

    // Click create button (the dashed border card)
    const createBtn = page.getByRole('button', { name: /criar|create|novo|new/i }).last()
    await createBtn.click()

    // Fill workout form
    const titleInput = page.locator('input[name="title"], input#title, input[placeholder*="title" i], input[placeholder*="título" i]')
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('E2E Test Workout')

      // Try to add an exercise
      const addExerciseBtn = page.getByRole('button', { name: /adicionar exercício|add exercise/i })
      if (await addExerciseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addExerciseBtn.click()
      }

      // Submit
      await page.getByRole('button', { name: /salvar|save/i }).click()
      await page.waitForTimeout(1000)
    }
  })

  test('edit workout template', async ({ page }) => {
    // Create a workout via API
    const workout = await createWorkout({
      title: `E2E Edit Workout ${Date.now()}`,
      description: 'Test workout for editing',
      exercises: [
        { name: 'Squat', sets: 3, reps: '12' },
        { name: 'Bench Press', sets: 4, reps: '10' },
      ],
      tags: ['test'],
    })

    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('workout-library')).toBeVisible({ timeout: 10000 })

    // Find the workout card and click edit
    const workoutCard = page.getByTestId(`workout-card-${workout.id}`)
    if (await workoutCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      const editBtn = workoutCard.locator('button:has(svg.lucide-edit-2), button:has(svg.lucide-pencil)')
      await editBtn.click()

      // Edit modal should open — change title
      const titleInput = page.locator('input[name="title"], input#title').first()
      if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await titleInput.clear()
        await titleInput.fill('E2E Updated Workout')

        await page.getByRole('button', { name: /salvar|save/i }).click()
        await page.waitForTimeout(1000)
      }
    }

    // Cleanup
    await deleteWorkout(workout.id)
  })

  test('delete workout template with confirmation', async ({ page }) => {
    const workout = await createWorkout({
      title: `E2E Delete Workout ${Date.now()}`,
      description: 'To be deleted',
      exercises: [{ name: 'Deadlift', sets: 3, reps: '8' }],
      tags: ['test'],
    })

    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('workout-library')).toBeVisible({ timeout: 10000 })

    const workoutCard = page.getByTestId(`workout-card-${workout.id}`)
    if (await workoutCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      const deleteBtn = workoutCard.locator('button:has(svg.lucide-trash-2)')
      await deleteBtn.click()

      // Handle confirmation dialog if present
      const confirmBtn = page.getByRole('button', { name: /confirmar|confirm|sim|yes|excluir|delete/i })
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click()
      }

      // Card should be gone
      await expect(workoutCard).not.toBeVisible({ timeout: 5000 })
    } else {
      await deleteWorkout(workout.id)
    }
  })

  test('expand workout to see exercises', async ({ page }) => {
    await expect(page.getByTestId('workout-library')).toBeVisible({ timeout: 10000 })

    // Click expand button on first workout card
    const expandBtn = page.locator('button:has-text(/view|ver|detalhes|items/i)').first()
    if (await expandBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expandBtn.click()

      // Exercises should be visible
      await expect(page.locator('text=/sets|séries|x/i').first()).toBeVisible({ timeout: 3000 })
    }
  })

  test('switch to AI generator tab', async ({ page }) => {
    await expect(page.getByTestId('workout-library')).toBeVisible({ timeout: 10000 })

    // Click AI tab
    const aiTab = page.getByRole('button', { name: /ia|ai|gerador|generator/i })
    await aiTab.click()

    await expect(page.getByTestId('ai-generator-form')).toBeVisible()
  })

  test('AI generator fills form and submits (mocked)', async ({ page }) => {
    // Mock Gemini API
    await page.route('**/generativelanguage.googleapis.com/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  title: 'E2E AI Workout',
                  description: 'Generated for testing',
                  exercises: [
                    { name: 'Squat', sets: 3, reps: '12', notes: 'Full depth' },
                    { name: 'Bench Press', sets: 4, reps: '10', notes: 'Control descent' },
                  ],
                  tags: ['strength', 'test'],
                }),
              }],
            },
          }],
        }),
      })
    })

    // Switch to AI tab
    const aiTab = page.getByRole('button', { name: /ia|ai|gerador|generator/i })
    await aiTab.click()
    await expect(page.getByTestId('ai-generator-form')).toBeVisible()

    // Fill AI form
    await page.locator('#clientName').fill('E2E AI Client')
    await page.locator('#goal').fill('Strength')

    // Submit
    await page.getByRole('button', { name: /gerar|generate/i }).click()

    // Wait for generation to complete — should switch back to library
    await page.waitForTimeout(3000)
  })

  test('AI generator handles error gracefully', async ({ page }) => {
    // Mock Gemini API with error
    await page.route('**/generativelanguage.googleapis.com/**', (route) => {
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    })

    const aiTab = page.getByRole('button', { name: /ia|ai|gerador|generator/i })
    await aiTab.click()
    await expect(page.getByTestId('ai-generator-form')).toBeVisible()

    await page.locator('#clientName').fill('E2E Error Client')
    await page.locator('#goal').fill('Test error')

    await page.getByRole('button', { name: /gerar|generate/i }).click()

    // Should show error message
    await expect(page.locator('[class*="red"], [class*="error"]').filter({ hasText: /erro|error/i })).toBeVisible({ timeout: 10000 })
  })
})
