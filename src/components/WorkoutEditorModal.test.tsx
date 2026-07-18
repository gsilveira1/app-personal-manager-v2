import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../store/store', () => ({
  useStore: () => ({
    evaluations: [],
    workouts: [],
    aiPromptInstructions: '',
  }),
}))

vi.mock('../services/geminiService', () => ({
  generateWorkoutInsights: vi.fn(),
}))

import { WorkoutEditorModal } from './WorkoutEditorModal'
import { generateWorkoutInsights } from '../services/geminiService'

const mockOnClose = vi.fn()
const mockOnSave = vi.fn()

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSave: mockOnSave,
  initialData: null,
}

describe('WorkoutEditorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal when isOpen=true', () => {
    render(<WorkoutEditorModal {...defaultProps} />)
    expect(screen.getByText('createNewWorkout')).toBeInTheDocument()
    expect(screen.getByLabelText('planTitle')).toBeInTheDocument()
    expect(screen.getByLabelText('tags')).toBeInTheDocument()
    expect(screen.getByLabelText('description')).toBeInTheDocument()
  })

  it('returns null when isOpen=false', () => {
    const { container } = render(<WorkoutEditorModal {...defaultProps} isOpen={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows form fields for workout editing', () => {
    render(<WorkoutEditorModal {...defaultProps} />)
    // Title, tags, description inputs
    expect(screen.getByLabelText('planTitle')).toBeInTheDocument()
    expect(screen.getByLabelText('tags')).toBeInTheDocument()
    expect(screen.getByLabelText('description')).toBeInTheDocument()
    // Exercise section header
    expect(screen.getByText('exercisesAndWarmups')).toBeInTheDocument()
    // A default exercise row should appear (new workout starts with one exercise)
    expect(screen.getByText('addItem')).toBeInTheDocument()
  })

  it('calls onSave and onClose when form is submitted via save button', async () => {
    const user = userEvent.setup()
    render(<WorkoutEditorModal {...defaultProps} />)

    // Fill required fields
    await user.type(screen.getByLabelText('planTitle'), 'Leg Day')
    await user.type(screen.getByLabelText('tags'), 'legs, strength')
    await user.type(screen.getByLabelText('description'), 'Full leg workout')

    // Fill the default exercise name (required)
    const exerciseInputs = screen.getAllByRole('textbox')
    // The exercise name input has a placeholder; find it by placeholder
    const exerciseNameInput = screen.getByPlaceholderText('exercisePlaceholder')
    await user.type(exerciseNameInput, 'Squat')

    // Click Save
    fireEvent.click(screen.getByText('saveWorkout'))

    expect(mockOnSave).toHaveBeenCalledTimes(1)
    const savedWorkout = mockOnSave.mock.calls[0][0]
    expect(savedWorkout.title).toBe('Leg Day')
    expect(savedWorkout.description).toBe('Full leg workout')
    expect(savedWorkout.tags).toEqual(['legs', 'strength'])
    expect(savedWorkout.exercises[0].name).toBe('Squat')
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when cancel is clicked', async () => {
    render(<WorkoutEditorModal {...defaultProps} />)
    fireEvent.click(screen.getByText('cancel'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('populates fields from initialData in edit mode', () => {
    const initialData = {
      id: 'w1',
      title: 'Push Day',
      description: 'Upper body push',
      tags: ['push', 'chest'],
      exercises: [
        { name: 'Bench Press', sets: 4, reps: '8-10', notes: 'Slow eccentric', isWarmup: false },
      ],
      createdAt: '2026-01-01',
      status: 'Active' as const,
    }

    render(<WorkoutEditorModal {...defaultProps} initialData={initialData} />)

    expect(screen.getByText('editWorkout')).toBeInTheDocument()
    expect(screen.getByLabelText('planTitle')).toHaveValue('Push Day')
    expect(screen.getByLabelText('description')).toHaveValue('Upper body push')
    expect(screen.getByLabelText('tags')).toHaveValue('push, chest')
  })

  it('shows AI suggestions button when client is provided', () => {
    const client = {
      id: 'c1',
      name: 'Test Client',
      email: 'test@test.com',
      phone: '555',
      status: 'Active' as const,
      type: 'In-Person' as const,
      avatar: null,
    }

    render(<WorkoutEditorModal {...defaultProps} client={client as any} />)
    expect(screen.getByText('getAiSuggestions')).toBeInTheDocument()
  })

  it('does not show AI suggestions button when no client', () => {
    render(<WorkoutEditorModal {...defaultProps} />)
    expect(screen.queryByText('getAiSuggestions')).not.toBeInTheDocument()
  })

  it('handles AI insight generation successfully', async () => {
    const mockInsights = {
      insights: [
        {
          suggestion: { name: 'Lunges', sets: 3, reps: '12', notes: 'Keep balance' },
          reason: 'Good for leg strength',
        },
      ],
    }
    ;(generateWorkoutInsights as ReturnType<typeof vi.fn>).mockResolvedValue(mockInsights)

    const client = {
      id: 'c1',
      name: 'Test Client',
      email: 'test@test.com',
      phone: '555',
      status: 'Active' as const,
      type: 'In-Person' as const,
      avatar: null,
    }

    render(<WorkoutEditorModal {...defaultProps} client={client as any} />)

    fireEvent.click(screen.getByText('getAiSuggestions'))

    await waitFor(() => {
      expect(screen.getByText('aiSuggestions')).toBeInTheDocument()
      expect(screen.getByText(/Lunges/)).toBeInTheDocument()
      expect(screen.getByText('Good for leg strength')).toBeInTheDocument()
    })
  })

  it('adds exercise when add button is clicked', async () => {
    render(<WorkoutEditorModal {...defaultProps} />)

    // Initially one default exercise
    const initialExercises = screen.getAllByPlaceholderText('exercisePlaceholder')
    expect(initialExercises).toHaveLength(1)

    fireEvent.click(screen.getByText('addItem'))

    const updatedExercises = screen.getAllByPlaceholderText('exercisePlaceholder')
    expect(updatedExercises).toHaveLength(2)
  })
})
