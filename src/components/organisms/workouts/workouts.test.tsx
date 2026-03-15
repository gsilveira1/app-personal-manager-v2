import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// ── Global mocks ──────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../../utils/dateLocale', () => ({
  formatLocalized: () => 'formatted-date',
}))

const mockGenerateWorkoutPlan = vi.fn()

vi.mock('../../../services/geminiService', () => ({
  generateWorkoutPlan: (...args: any[]) => mockGenerateWorkoutPlan(...args),
}))

vi.mock('../../../store/store', () => ({
  useStore: () => ({
    aiPromptInstructions: 'custom instructions',
  }),
}))

// ── Imports (after mocks) ─────────────────────────────────────────────
import { WorkoutLibrary } from './WorkoutLibrary'
import { AIWorkoutGenerator } from './AIWorkoutGenerator'
import type { WorkoutPlan } from '../../../types'

// ── Test fixtures ─────────────────────────────────────────────────────
const workouts: WorkoutPlan[] = [
  {
    id: 'w1',
    title: 'Treino A - Upper Body',
    description: 'Chest and back focus',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '10', isWarmup: false },
      { name: 'Light Jog', sets: 1, reps: '5min', isWarmup: true },
    ],
    tags: ['Upper', 'Strength'],
    createdAt: '2025-11-01T00:00:00.000Z',
  },
  {
    id: 'w2',
    title: 'Treino B - Lower Body',
    description: 'Legs and glutes',
    exercises: [
      { name: 'Squat', sets: 4, reps: '12', isWarmup: false },
    ],
    tags: ['Lower'],
    createdAt: '2025-11-05T00:00:00.000Z',
  },
]

// =====================================================================
// WorkoutLibrary
// =====================================================================
describe('WorkoutLibrary', () => {
  const defaultProps = {
    workouts,
    onCreate: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders workout cards', () => {
    render(<WorkoutLibrary {...defaultProps} />)
    expect(screen.getByText('Treino A - Upper Body')).toBeInTheDocument()
    expect(screen.getByText('Treino B - Lower Body')).toBeInTheDocument()
  })

  it('renders workout descriptions', () => {
    render(<WorkoutLibrary {...defaultProps} />)
    expect(screen.getByText('Chest and back focus')).toBeInTheDocument()
    expect(screen.getByText('Legs and glutes')).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<WorkoutLibrary {...defaultProps} />)
    expect(screen.getByText('#Upper')).toBeInTheDocument()
    expect(screen.getByText('#Strength')).toBeInTheDocument()
    expect(screen.getByText('#Lower')).toBeInTheDocument()
  })

  it('create button calls onCreate', async () => {
    render(<WorkoutLibrary {...defaultProps} />)
    const createBtn = screen.getByText('createTemplate')
    await userEvent.click(createBtn)
    expect(defaultProps.onCreate).toHaveBeenCalled()
  })

  it('edit button calls onEdit', async () => {
    render(<WorkoutLibrary {...defaultProps} />)
    const editBtns = screen.getAllByTitle('editTemplate')
    await userEvent.click(editBtns[0])
    expect(defaultProps.onEdit).toHaveBeenCalledWith(workouts[0])
  })

  it('delete button calls onDelete', async () => {
    render(<WorkoutLibrary {...defaultProps} />)
    const deleteBtns = screen.getAllByTitle('deleteTemplate')
    await userEvent.click(deleteBtns[0])
    expect(defaultProps.onDelete).toHaveBeenCalledWith('w1')
  })

  it('exercise expansion works', async () => {
    render(<WorkoutLibrary {...defaultProps} />)
    // Initially exercises are not visible
    expect(screen.queryByText('Bench Press')).not.toBeInTheDocument()

    // Click the first expand button
    const expandBtns = screen.getAllByText(/viewItems/)
    await userEvent.click(expandBtns[0])

    // Now exercises are visible
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('Light Jog')).toBeInTheDocument()
  })

  it('collapse hides exercises', async () => {
    render(<WorkoutLibrary {...defaultProps} />)
    const expandBtns = screen.getAllByText(/viewItems/)
    await userEvent.click(expandBtns[0])
    expect(screen.getByText('Bench Press')).toBeInTheDocument()

    // Click hide
    const hideBtn = screen.getByText('hideDetails')
    await userEvent.click(hideBtn)
    expect(screen.queryByText('Bench Press')).not.toBeInTheDocument()
  })

  it('renders empty state with only create button when no workouts', () => {
    render(<WorkoutLibrary {...defaultProps} workouts={[]} />)
    expect(screen.getByText('createTemplate')).toBeInTheDocument()
    expect(screen.queryByText('Treino A - Upper Body')).not.toBeInTheDocument()
  })
})

// =====================================================================
// AIWorkoutGenerator
// =====================================================================
describe('AIWorkoutGenerator', () => {
  const defaultProps = {
    onSave: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields', () => {
    render(<AIWorkoutGenerator {...defaultProps} />)
    expect(screen.getByLabelText('clientName')).toBeInTheDocument()
    expect(screen.getByLabelText('experienceLevel')).toBeInTheDocument()
    expect(screen.getByLabelText('primaryGoal')).toBeInTheDocument()
    expect(screen.getByLabelText('frequencyDaysPerWeek')).toBeInTheDocument()
    expect(screen.getByLabelText('limitationsInjuries')).toBeInTheDocument()
  })

  it('renders header and subtitle', () => {
    render(<AIWorkoutGenerator {...defaultProps} />)
    expect(screen.getByText('aiWorkoutGenerator')).toBeInTheDocument()
    expect(screen.getByText('aiSubtitle')).toBeInTheDocument()
  })

  it('submit calls generateWorkoutPlan then onSave on success', async () => {
    const generatedPlan = {
      title: 'AI Workout',
      description: 'Generated plan',
      exercises: [{ name: 'Push-up', sets: 3, reps: '15' }],
      tags: ['AI Generated'],
    }
    mockGenerateWorkoutPlan.mockResolvedValueOnce(generatedPlan)

    render(<AIWorkoutGenerator {...defaultProps} />)

    // Fill required fields
    await userEvent.type(screen.getByLabelText('clientName'), 'Test Client')
    await userEvent.type(screen.getByLabelText('primaryGoal'), 'Muscle gain')

    // Submit
    const submitBtn = screen.getByText('generateWorkout')
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockGenerateWorkoutPlan).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'AI Workout',
          description: 'Generated plan',
          status: 'Active',
        })
      )
    })
  })

  it('loading state shown during generation', async () => {
    mockGenerateWorkoutPlan.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    )

    render(<AIWorkoutGenerator {...defaultProps} />)

    await userEvent.type(screen.getByLabelText('clientName'), 'Test Client')
    await userEvent.type(screen.getByLabelText('primaryGoal'), 'Strength')

    const submitBtn = screen.getByText('generateWorkout')
    await userEvent.click(submitBtn)

    expect(screen.getByText('generatingPlan')).toBeInTheDocument()
  })

  it('error state shown on failure', async () => {
    mockGenerateWorkoutPlan.mockRejectedValueOnce(new Error('API error'))

    render(<AIWorkoutGenerator {...defaultProps} />)

    await userEvent.type(screen.getByLabelText('clientName'), 'Test Client')
    await userEvent.type(screen.getByLabelText('primaryGoal'), 'Strength')

    const submitBtn = screen.getByText('generateWorkout')
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('generationError')).toBeInTheDocument()
    })
  })

  it('does not call onSave on failure', async () => {
    mockGenerateWorkoutPlan.mockRejectedValueOnce(new Error('API error'))

    render(<AIWorkoutGenerator {...defaultProps} />)

    await userEvent.type(screen.getByLabelText('clientName'), 'Test Client')
    await userEvent.type(screen.getByLabelText('primaryGoal'), 'Strength')

    await userEvent.click(screen.getByText('generateWorkout'))

    await waitFor(() => {
      expect(screen.getByText('generationError')).toBeInTheDocument()
    })

    expect(defaultProps.onSave).not.toHaveBeenCalled()
  })
})
