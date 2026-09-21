import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { WorkoutPlayer } from './WorkoutPlayer'
import * as api from '../../services/api/apiService'

vi.mock('../../services/api/apiService', () => ({
  getPortalWorkoutSheet: vi.fn(),
  recordPortalSession: vi.fn(),
}))

describe('WorkoutPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders error when token is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/workout-player']}>
        <WorkoutPlayer />
      </MemoryRouter>
    )

    expect(await screen.findByText('Token de treino não informado.')).toBeInTheDocument()
  })

  it('loads active workout sheet and starts workout', async () => {
    const user = userEvent.setup()
    vi.mocked(api.getPortalWorkoutSheet).mockResolvedValue({
      sheetId: 'sheet-1',
      sheetName: 'Adaptação Hipertrofia',
      trainerName: 'Viviana',
      trainerPhone: '+5511999998888',
      workouts: [
        {
          id: 'w-1',
          letter: 'A',
          name: 'Peito e Tríceps',
          blocks: [
            {
              id: 'b-1',
              type: 'REGULAR',
              restTimeSeconds: 60,
              exercises: [
                {
                  workoutExerciseId: 'we-1',
                  exerciseName: 'Supino Reto',
                  gifUrl: 'https://pub-r2.com/exercises/bench.gif',
                  sets: 4,
                  reps: '8-10',
                  lastLoadKg: 50,
                },
              ],
            },
          ],
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/workout-player?token=valid-jwt']}>
        <WorkoutPlayer />
      </MemoryRouter>
    )

    expect(await screen.findByText('Adaptação Hipertrofia')).toBeInTheDocument()
    expect(screen.getByText(/Treino A - Peito e Tríceps/)).toBeInTheDocument()

    const startBtn = screen.getByRole('button', { name: /Iniciar Treino de Hoje/i })
    await user.click(startBtn)

    expect(screen.getByText('Supino Reto')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Finalizar Treino/i })).toBeInTheDocument()
  })

  it('finishes workout and sends session data', async () => {
    const user = userEvent.setup()
    vi.mocked(api.getPortalWorkoutSheet).mockResolvedValue({
      sheetId: 'sheet-1',
      sheetName: 'Adaptação Hipertrofia',
      trainerName: 'Viviana',
      trainerPhone: '+5511999998888',
      workouts: [
        {
          id: 'w-1',
          letter: 'A',
          name: 'Peito e Tríceps',
          blocks: [
            {
              id: 'b-1',
              type: 'REGULAR',
              restTimeSeconds: 60,
              exercises: [
                {
                  workoutExerciseId: 'we-1',
                  exerciseName: 'Supino Reto',
                  gifUrl: 'https://pub-r2.com/exercises/bench.gif',
                  sets: 4,
                  reps: '8-10',
                  lastLoadKg: 50,
                },
              ],
            },
          ],
        },
      ],
    })
    vi.mocked(api.recordPortalSession).mockResolvedValue({
      message: 'Treino finalizado',
      sessionId: 'sess-1',
      durationSeconds: 300,
    })

    render(
      <MemoryRouter initialEntries={['/workout-player?token=valid-jwt']}>
        <WorkoutPlayer />
      </MemoryRouter>
    )

    const startBtn = await screen.findByRole('button', { name: /Iniciar Treino de Hoje/i })
    await user.click(startBtn)

    const finishBtn = screen.getByRole('button', { name: /Finalizar Treino/i })
    await user.click(finishBtn)

    await waitFor(() => {
      expect(screen.getByText(/Treino Concluído!/i)).toBeInTheDocument()
      expect(api.recordPortalSession).toHaveBeenCalled()
    })
  })
})
