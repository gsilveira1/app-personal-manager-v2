import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ClientDetails } from './ClientDetails'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router', () => ({
  useParams: () => ({ id: 'c1' }),
  useNavigate: () => mockNavigate,
}))

vi.mock('../utils/dateLocale', () => ({
  formatLocalized: () => 'Jan 1, 2025',
}))

const mockUpdateClient = vi.fn()
const mockAddEvaluation = vi.fn()
const mockAddSession = vi.fn()
const mockAddWorkout = vi.fn()
const mockUpdateWorkout = vi.fn()
const mockDeleteWorkout = vi.fn()
const mockUploadClientAvatar = vi.fn()

const mockClient = { id: 'c1', name: 'Maria Silva', email: 'maria@test.com', phone: '123', status: 'Active', type: 'In-Person' as const, planId: 'p1', notes: 'Test notes', medicalHistory: { objective: ['Health'], injuries: '', surgeries: '', medications: '' } }

let mockStoreClients = [mockClient]

vi.mock('../store/store', () => ({
  useStore: () => ({
    clients: mockStoreClients,
    sessions: [],
    evaluations: [],
    workouts: [],
    plans: [{ id: 'p1', type: 'PRESENCIAL', name: 'Plano A', sessionsPerWeek: 3, durationMinutes: 60, price: 300 }],
    updateClient: mockUpdateClient,
    uploadClientAvatar: mockUploadClientAvatar,
    addEvaluation: mockAddEvaluation,
    addSession: mockAddSession,
    addWorkout: mockAddWorkout,
    updateWorkout: mockUpdateWorkout,
    deleteWorkout: mockDeleteWorkout,
  }),
}))

const mockSession = { id: 's1', clientId: 'c1', date: '2024-01-15T10:00:00.000Z', durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: true, notes: 'Great session' }
const mockSessionIncomplete = { id: 's2', clientId: 'c1', date: '2024-01-14T10:00:00.000Z', durationMinutes: 45, type: 'Online', category: 'Check-in', completed: false }

const mockEvaluation = { id: 'e1', clientId: 'c1', date: '2024-01-10T00:00:00.000Z', weight: 75, bodyFatPercentage: 15 }
const mockEvaluation2 = { id: 'e2', clientId: 'c1', date: '2024-01-20T00:00:00.000Z', weight: 73, bodyFatPercentage: 14 }

const mockActiveWorkout = { id: 'w1', clientId: 'c1', title: 'Push Day', status: 'Active', exercises: [], tags: [], createdAt: '2024-01-01T00:00:00.000Z' }
const mockArchivedWorkout = { id: 'w2', clientId: 'c1', title: 'Old Plan', status: 'Archived', exercises: [], tags: [], createdAt: '2023-06-01T00:00:00.000Z' }

let mockHookReturn: any = {
  clientSessions: [],
  clientEvaluations: [],
  clientWorkouts: [],
  activePlans: [],
  archivedPlans: [],
  chartData: [],
  chartableMetrics: { weight: { label: 'Weight', unit: 'kg' } },
}

vi.mock('../hooks/useClientDetails', () => ({
  useClientDetails: () => mockHookReturn,
}))

vi.mock('../components/organisms/client-details/ClientProfileHeader', () => ({
  ClientProfileHeader: ({ client }: any) => <div data-testid="profile-header">{client.name}</div>,
}))

vi.mock('../components/organisms/client-details/MedicalHistoryCard', () => ({
  MedicalHistoryCard: () => <div data-testid="medical-card" />,
}))

vi.mock('../components/organisms/client-details/EvaluationCard', () => ({
  EvaluationCard: ({ evaluation }: any) => <div data-testid="eval-card">{evaluation.id}</div>,
}))

vi.mock('../components/organisms/client-details/WorkoutCard', () => ({
  WorkoutCard: ({ workout, onDelete, onArchive, onActivate, onEdit }: any) => (
    <div data-testid="workout-card">
      {workout.title}
      {onDelete && <button data-testid={`delete-${workout.id}`} onClick={() => onDelete(workout.id)}>delete</button>}
      {onArchive && <button data-testid={`archive-${workout.id}`} onClick={() => onArchive(workout.id)}>archive</button>}
      {onActivate && <button data-testid={`activate-${workout.id}`} onClick={() => onActivate(workout.id)}>activate</button>}
      {onEdit && <button data-testid={`edit-${workout.id}`} onClick={() => onEdit(workout)}>edit</button>}
    </div>
  ),
}))

vi.mock('../components/organisms/client-details/EvaluationModal', () => ({
  EvaluationModal: ({ onClose }: any) => <div data-testid="eval-modal"><button onClick={onClose}>close-eval</button></div>,
}))

vi.mock('../components/organisms/client-details/SessionLogModal', () => ({
  SessionLogModal: ({ onClose }: any) => <div data-testid="session-modal"><button onClick={onClose}>close-session</button></div>,
}))

vi.mock('../components/organisms/client-details/ProgressChart', () => ({
  ProgressChart: () => <div data-testid="progress-chart" />,
}))

vi.mock('../components/WorkoutEditorModal', () => ({
  WorkoutEditorModal: ({ isOpen, onClose, onSave, initialData }: any) => isOpen ? <div data-testid="workout-editor"><button onClick={onClose}>close-workout</button><button onClick={() => onSave({ title: 'New' })} data-testid="save-workout">save</button>{initialData && <span data-testid="editing-workout">{initialData.title}</span>}</div> : null,
}))

describe('ClientDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreClients = [mockClient]
    mockHookReturn = {
      clientSessions: [],
      clientEvaluations: [],
      clientWorkouts: [],
      activePlans: [],
      archivedPlans: [],
      chartData: [],
      chartableMetrics: { weight: { label: 'Weight', unit: 'kg' } },
    }
  })

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/clients/c1']}>
        <Routes>
          <Route path="/clients/:id" element={<ClientDetails />} />
        </Routes>
      </MemoryRouter>
    )

  it('renders client profile header with name', () => {
    renderPage()
    expect(screen.getByTestId('profile-header')).toBeInTheDocument()
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
  })

  it('renders back button', () => {
    renderPage()
    expect(screen.getByText('backToClients')).toBeInTheDocument()
  })

  it('renders medical history card', () => {
    renderPage()
    expect(screen.getByTestId('medical-card')).toBeInTheDocument()
  })

  it('renders tab items', () => {
    renderPage()
    expect(screen.getAllByText('sessionHistory').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('evaluations').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('prescriptions')).toBeInTheDocument()
  })

  it('renders notes section', () => {
    renderPage()
    expect(screen.getByText('notesAndLimitations')).toBeInTheDocument()
  })

  it('shows not found state when client does not exist', () => {
    mockStoreClients = []
    renderPage()
    expect(screen.getByText('notFound')).toBeInTheDocument()
    expect(screen.getByText('backToClients')).toBeInTheDocument()
  })

  it('navigates to /clients when back button is clicked on not found', () => {
    mockStoreClients = []
    renderPage()
    fireEvent.click(screen.getByText('backToClients'))
    expect(mockNavigate).toHaveBeenCalledWith('/clients')
  })

  it('navigates to /clients when back arrow button is clicked', () => {
    renderPage()
    // The first backToClients text is the back button
    const backButtons = screen.getAllByText('backToClients')
    fireEvent.click(backButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/clients')
  })

  it('shows empty session history with no sessions', () => {
    renderPage()
    expect(screen.getByText('noSessions')).toBeInTheDocument()
    expect(screen.getByText('logFirstSession')).toBeInTheDocument()
  })

  it('renders session cards when sessions exist', () => {
    mockHookReturn = { ...mockHookReturn, clientSessions: [mockSession, mockSessionIncomplete] }
    renderPage()
    // Session dates are formatted via formatLocalized mock → 'Jan 1, 2025'
    expect(screen.getAllByText('Jan 1, 2025').length).toBeGreaterThanOrEqual(1)
    // Session with notes should show the notes
    expect(screen.getByText('"Great session"')).toBeInTheDocument()
  })

  it('opens session log modal when new session button clicked', () => {
    renderPage()
    fireEvent.click(screen.getByText('logFirstSession'))
    expect(screen.getByTestId('session-modal')).toBeInTheDocument()
  })

  it('opens session modal from the header button on history tab', () => {
    mockHookReturn = { ...mockHookReturn, clientSessions: [mockSession] }
    renderPage()
    fireEvent.click(screen.getByText('newSession'))
    expect(screen.getByTestId('session-modal')).toBeInTheDocument()
  })

  it('switches to evaluations tab and shows empty state', () => {
    renderPage()
    fireEvent.click(screen.getAllByText('evaluations')[0])
    expect(screen.getByText('noEvaluations')).toBeInTheDocument()
    expect(screen.getByText('addFirstEvaluation')).toBeInTheDocument()
  })

  it('shows evaluation cards when evaluations exist', () => {
    mockHookReturn = { ...mockHookReturn, clientEvaluations: [mockEvaluation] }
    renderPage()
    fireEvent.click(screen.getAllByText('evaluations')[0])
    expect(screen.getByTestId('eval-card')).toBeInTheDocument()
  })

  it('shows progress chart when multiple evaluations exist', () => {
    mockHookReturn = { ...mockHookReturn, clientEvaluations: [mockEvaluation, mockEvaluation2] }
    renderPage()
    fireEvent.click(screen.getAllByText('evaluations')[0])
    expect(screen.getByTestId('progress-chart')).toBeInTheDocument()
    expect(screen.getAllByTestId('eval-card').length).toBe(2)
  })

  it('does not show progress chart when only one evaluation exists', () => {
    mockHookReturn = { ...mockHookReturn, clientEvaluations: [mockEvaluation] }
    renderPage()
    fireEvent.click(screen.getAllByText('evaluations')[0])
    expect(screen.queryByTestId('progress-chart')).not.toBeInTheDocument()
  })

  it('opens evaluation modal from empty state button', () => {
    renderPage()
    fireEvent.click(screen.getAllByText('evaluations')[0])
    fireEvent.click(screen.getByText('addFirstEvaluation'))
    expect(screen.getByTestId('eval-modal')).toBeInTheDocument()
  })

  it('opens evaluation modal from header button', () => {
    mockHookReturn = { ...mockHookReturn, clientEvaluations: [mockEvaluation] }
    renderPage()
    fireEvent.click(screen.getAllByText('evaluations')[0])
    fireEvent.click(screen.getByText('addEvaluation'))
    expect(screen.getByTestId('eval-modal')).toBeInTheDocument()
  })

  it('switches to workouts tab and shows empty state', () => {
    renderPage()
    fireEvent.click(screen.getByText('prescriptions'))
    expect(screen.getByText('noActivePrescriptions')).toBeInTheDocument()
    expect(screen.getByText('noArchivedPlans')).toBeInTheDocument()
  })

  it('shows active and archived workout cards', () => {
    mockHookReturn = { ...mockHookReturn, activePlans: [mockActiveWorkout], archivedPlans: [mockArchivedWorkout] }
    renderPage()
    fireEvent.click(screen.getByText('prescriptions'))
    expect(screen.getByText('Push Day')).toBeInTheDocument()
    expect(screen.getByText('Old Plan')).toBeInTheDocument()
  })

  it('opens workout editor modal for new workout', () => {
    renderPage()
    fireEvent.click(screen.getByText('prescriptions'))
    fireEvent.click(screen.getByText('createWorkout'))
    expect(screen.getByTestId('workout-editor')).toBeInTheDocument()
    expect(screen.queryByTestId('editing-workout')).not.toBeInTheDocument()
  })

  it('opens workout editor modal for editing existing workout', () => {
    mockHookReturn = { ...mockHookReturn, activePlans: [mockActiveWorkout] }
    renderPage()
    fireEvent.click(screen.getByText('prescriptions'))
    fireEvent.click(screen.getByTestId('edit-w1'))
    expect(screen.getByTestId('workout-editor')).toBeInTheDocument()
    expect(screen.getByTestId('editing-workout')).toHaveTextContent('Push Day')
  })

  it('archives a workout via workout card callback', () => {
    mockHookReturn = { ...mockHookReturn, activePlans: [mockActiveWorkout] }
    renderPage()
    fireEvent.click(screen.getByText('prescriptions'))
    fireEvent.click(screen.getByTestId('archive-w1'))
    expect(mockUpdateWorkout).toHaveBeenCalledWith('w1', { status: 'Archived' })
  })

  it('activates an archived workout via workout card callback', () => {
    mockHookReturn = { ...mockHookReturn, archivedPlans: [mockArchivedWorkout] }
    renderPage()
    fireEvent.click(screen.getByText('prescriptions'))
    fireEvent.click(screen.getByTestId('activate-w2'))
    expect(mockUpdateWorkout).toHaveBeenCalledWith('w2', { status: 'Active' })
  })

  it('deletes a workout with confirmation', () => {
    mockHookReturn = { ...mockHookReturn, activePlans: [mockActiveWorkout] }
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPage()
    fireEvent.click(screen.getByText('prescriptions'))
    fireEvent.click(screen.getByTestId('delete-w1'))
    expect(window.confirm).toHaveBeenCalled()
    expect(mockDeleteWorkout).toHaveBeenCalledWith('w1')
  })

  it('does not delete workout when confirmation is cancelled', () => {
    mockHookReturn = { ...mockHookReturn, activePlans: [mockActiveWorkout] }
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPage()
    fireEvent.click(screen.getByText('prescriptions'))
    fireEvent.click(screen.getByTestId('delete-w1'))
    expect(mockDeleteWorkout).not.toHaveBeenCalled()
  })

  it('saves new workout via workout editor modal', () => {
    renderPage()
    fireEvent.click(screen.getByText('prescriptions'))
    fireEvent.click(screen.getByText('createWorkout'))
    fireEvent.click(screen.getByTestId('save-workout'))
    expect(mockAddWorkout).toHaveBeenCalledWith({ title: 'New' })
  })

  it('saves edited workout via workout editor modal', () => {
    mockHookReturn = { ...mockHookReturn, activePlans: [mockActiveWorkout] }
    renderPage()
    fireEvent.click(screen.getByText('prescriptions'))
    fireEvent.click(screen.getByTestId('edit-w1'))
    fireEvent.click(screen.getByTestId('save-workout'))
    expect(mockUpdateWorkout).toHaveBeenCalledWith('w1', { title: 'New' })
  })

  it('displays existing notes in notes section', () => {
    renderPage()
    expect(screen.getByText('Test notes')).toBeInTheDocument()
  })

  it('shows noNotes placeholder when client has no notes', () => {
    mockStoreClients = [{ ...mockClient, notes: '' }]
    renderPage()
    expect(screen.getByText('noNotes')).toBeInTheDocument()
  })
})
