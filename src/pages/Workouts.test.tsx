import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Workouts } from './Workouts'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockAddWorkout = vi.fn()
const mockUpdateWorkout = vi.fn()
const mockDeleteWorkout = vi.fn()
const mockWorkouts = [
  {
    id: 'w1',
    title: 'Treino A',
    exercises: [{ name: 'Supino', sets: 4, reps: '10' }],
    tags: ['chest'],
    createdAt: '2025-01-01',
    status: 'Active',
  },
]

vi.mock('../store/store', () => ({
  useStore: () => ({
    workouts: mockWorkouts,
    addWorkout: mockAddWorkout,
    updateWorkout: mockUpdateWorkout,
    deleteWorkout: mockDeleteWorkout,
  }),
}))

// Mock organisms to avoid deep rendering
vi.mock('../components/organisms/workouts/WorkoutLibrary', () => ({
  WorkoutLibrary: ({ workouts, onCreate, onEdit, onDelete }: any) => (
    <div data-testid="workout-library">
      {workouts.map((w: any) => (
        <div key={w.id}>
          {w.title}
          <button onClick={() => onEdit(w)}>edit-{w.id}</button>
          <button onClick={() => onDelete(w.id)}>delete-{w.id}</button>
        </div>
      ))}
      <button onClick={onCreate}>create</button>
    </div>
  ),
}))

vi.mock('../components/organisms/workouts/AIWorkoutGenerator', () => ({
  AIWorkoutGenerator: ({ onSave }: any) => (
    <div data-testid="ai-generator">
      <button onClick={() => onSave({ title: 'AI Workout', exercises: [], tags: [] })}>generate</button>
    </div>
  ),
}))

vi.mock('../components/WorkoutEditorModal', () => ({
  WorkoutEditorModal: ({ isOpen, onClose, onSave, initialData }: any) => isOpen ? (
    <div data-testid="editor-modal">
      <button onClick={onClose}>close</button>
      <button onClick={() => onSave({ title: 'New Workout', exercises: [], tags: [] })}>save</button>
      {initialData && <span data-testid="editing-indicator">editing-{initialData.id}</span>}
    </div>
  ) : null,
}))

describe('Workouts', () => {
  beforeEach(() => { vi.clearAllMocks() })

  const renderPage = () => render(<MemoryRouter><Workouts /></MemoryRouter>)

  it('renders page title and tab bar', () => {
    renderPage()
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('templates')).toBeInTheDocument()
    expect(screen.getByText('aiGenerator')).toBeInTheDocument()
  })

  it('renders library tab by default with workouts', () => {
    renderPage()
    expect(screen.getByTestId('workout-library')).toBeInTheDocument()
  })

  it('switches to AI tab', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText('aiGenerator'))
    expect(screen.getByTestId('ai-generator')).toBeInTheDocument()
  })

  it('opens editor modal when create is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText('create'))
    expect(screen.getByTestId('editor-modal')).toBeInTheDocument()
  })

  it('saves a new workout via editor modal (addWorkout path)', async () => {
    const user = userEvent.setup()
    renderPage()

    // Open editor via create button
    await user.click(screen.getByText('create'))
    expect(screen.getByTestId('editor-modal')).toBeInTheDocument()

    // Save from the modal
    await user.click(screen.getByText('save'))
    expect(mockAddWorkout).toHaveBeenCalledTimes(1)
    expect(mockAddWorkout).toHaveBeenCalledWith({ title: 'New Workout', exercises: [], tags: [] })
  })

  it('saves an existing workout via editor modal (updateWorkout path)', async () => {
    const user = userEvent.setup()
    renderPage()

    // Open editor via edit button on existing workout
    await user.click(screen.getByText('edit-w1'))
    expect(screen.getByTestId('editor-modal')).toBeInTheDocument()
    expect(screen.getByTestId('editing-indicator')).toHaveTextContent('editing-w1')

    // Save from the modal — should call updateWorkout, not addWorkout
    await user.click(screen.getByText('save'))
    expect(mockUpdateWorkout).toHaveBeenCalledTimes(1)
    expect(mockUpdateWorkout.mock.calls[0][0]).toBe('w1')
    expect(mockAddWorkout).not.toHaveBeenCalled()
  })

  it('deletes a workout when confirmed', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPage()

    await user.click(screen.getByText('delete-w1'))
    expect(confirmSpy).toHaveBeenCalledWith('deleteWorkoutConfirm')
    expect(mockDeleteWorkout).toHaveBeenCalledWith('w1')
    confirmSpy.mockRestore()
  })

  it('does not delete a workout when confirm is cancelled', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPage()

    await user.click(screen.getByText('delete-w1'))
    expect(mockDeleteWorkout).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('AI generator onSave adds workout and switches to library tab', async () => {
    const user = userEvent.setup()
    renderPage()

    // Switch to AI tab
    await user.click(screen.getByText('aiGenerator'))
    expect(screen.getByTestId('ai-generator')).toBeInTheDocument()

    // Generate AI workout
    await user.click(screen.getByText('generate'))
    expect(mockAddWorkout).toHaveBeenCalledWith({ title: 'AI Workout', exercises: [], tags: [] })

    // Should switch back to library tab
    expect(screen.getByTestId('workout-library')).toBeInTheDocument()
  })

  it('closes the editor modal', async () => {
    const user = userEvent.setup()
    renderPage()

    // Open editor
    await user.click(screen.getByText('create'))
    expect(screen.getByTestId('editor-modal')).toBeInTheDocument()

    // Close editor
    await user.click(screen.getByText('close'))
    expect(screen.queryByTestId('editor-modal')).not.toBeInTheDocument()
  })
})
