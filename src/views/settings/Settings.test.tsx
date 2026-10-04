import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Settings } from './Settings'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'pt-BR' } }),
}))

const mockAddPlan = vi.fn()
const mockUpdatePlan = vi.fn()
const mockDeletePlan = vi.fn()
const mockFetchPlanFeatures = vi.fn().mockResolvedValue(undefined)

const mockPlans = [
  {
    id: 'p1',
    type: 'PRESENCIAL' as const,
    name: 'Plano A',
    sessionsPerWeek: 3,
    durationMinutes: 60,
    price: 300,
  },
  { id: 'p2', type: 'CONSULTORIA' as const, name: 'Plano B', sessionsPerWeek: 2, price: 200 },
]

vi.mock('../../states/stores/store', () => ({
  useStore: () => ({
    plans: mockPlans,
    addPlan: mockAddPlan,
    updatePlan: mockUpdatePlan,
    deletePlan: mockDeletePlan,
    planFeatures: [],
    fetchPlanFeatures: mockFetchPlanFeatures,
    workHours: {
      monday: { enabled: true, start: '07:00', end: '19:00' },
      tuesday: { enabled: true, start: '07:00', end: '19:00' },
      wednesday: { enabled: true, start: '07:00', end: '19:00' },
      thursday: { enabled: true, start: '07:00', end: '19:00' },
      friday: { enabled: true, start: '07:00', end: '19:00' },
      saturday: { enabled: true, start: '07:00', end: '19:00' },
      sunday: { enabled: false, start: '08:00', end: '12:00' },
      slotDurationMinutes: 60,
    },
    updateWorkHours: vi.fn(),
    fetchAvailabilityBlocks: vi.fn().mockResolvedValue(undefined),
  }),
}))

let mockUserRole = 'trainer'

vi.mock('../../states/stores/auth/authStore', () => ({
  useAuthStore: () => ({ user: { id: '1', name: 'Test', email: 'test@test.com', role: mockUserRole } }),
}))

vi.mock('../../components/organisms/settings/PlanCard', () => ({
  PlanCard: ({ plan, onEdit, onDelete }: any) => (
    <div data-testid={`plan-${plan.id}`}>
      {plan.name}
      <button onClick={onEdit}>edit-{plan.id}</button>
      <button onClick={onDelete}>delete-{plan.id}</button>
    </div>
  ),
}))

vi.mock('../../components/organisms/settings/PlanEditorModal', () => ({
  PlanEditorModal: ({ isOpen, onClose, onSave }: any) =>
    isOpen ? (
      <div data-testid="plan-modal">
        <button onClick={onClose}>close</button>
        <button onClick={() => onSave({ name: 'New Plan', type: 'PRESENCIAL', sessionsPerWeek: 2, price: 150 })}>save</button>
      </div>
    ) : null,
}))

vi.mock('../../components/organisms/settings/WorkHoursEditor', () => ({
  WorkHoursEditor: () => <div data-testid="work-hours-editor" />,
}))

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderPage = () =>
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

  it('renders page title', () => {
    renderPage()
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('keeps the profile and work hours sections', () => {
    renderPage()
    expect(screen.getByTestId('profile-edit-section')).toBeInTheDocument()
    expect(screen.getByTestId('work-hours-editor')).toBeInTheDocument()
  })

  it('no longer hosts the WhatsApp connection or the notification automations', () => {
    renderPage()
    expect(screen.queryByTestId('whatsapp-connection-card')).not.toBeInTheDocument()
    expect(screen.queryByTestId('notification-automations-section')).not.toBeInTheDocument()
  })

  it('no longer hosts the AI instructions', () => {
    renderPage()
    expect(screen.queryByLabelText('aiInstructions')).not.toBeInTheDocument()
    expect(document.getElementById('ai-instructions')).not.toBeInTheDocument()
  })

  it('no longer renders the app features configuration card', () => {
    renderPage()
    expect(screen.queryByTestId('app-features-config-section')).not.toBeInTheDocument()
    expect(screen.queryByText('appFeaturesConfig')).not.toBeInTheDocument()
  })

  it('renders presencial and consultoria plan cards', () => {
    renderPage()
    expect(screen.getByTestId('plan-p1')).toBeInTheDocument()
    expect(screen.getByTestId('plan-p2')).toBeInTheDocument()
  })

  it('opens plan editor modal when new plan clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText('newPlan'))
    expect(screen.getByTestId('plan-modal')).toBeInTheDocument()
  })

  it('loads the plan feature catalogue on mount', () => {
    renderPage()
    expect(mockFetchPlanFeatures).toHaveBeenCalled()
  })

  it('tells the trainer when the plan feature catalogue cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetchPlanFeatures.mockRejectedValueOnce(new Error('boom'))
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('planFeaturesLoadError')
  })

  it('calls addPlan via handleSave when creating a new plan', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText('newPlan'))
    expect(screen.getByTestId('plan-modal')).toBeInTheDocument()

    await user.click(screen.getByText('save'))
    expect(mockAddPlan).toHaveBeenCalledWith({
      name: 'New Plan',
      type: 'PRESENCIAL',
      sessionsPerWeek: 2,
      price: 150,
    })
    expect(screen.queryByTestId('plan-modal')).not.toBeInTheDocument()
  })

  it('calls updatePlan via handleSave when editing an existing plan', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText('edit-p1'))
    expect(screen.getByTestId('plan-modal')).toBeInTheDocument()

    await user.click(screen.getByText('save'))
    expect(mockUpdatePlan).toHaveBeenCalledWith('p1', {
      name: 'New Plan',
      type: 'PRESENCIAL',
      sessionsPerWeek: 2,
      price: 150,
    })
    expect(screen.queryByTestId('plan-modal')).not.toBeInTheDocument()
  })

  it('calls deletePlan when delete confirmed', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPage()

    await user.click(screen.getByText('delete-p1'))
    expect(mockDeletePlan).toHaveBeenCalledWith('p1')
  })
})

describe('Settings (admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchPlanFeatures.mockResolvedValue(undefined)
    mockUserRole = 'admin'
  })

  afterEach(() => {
    mockUserRole = 'trainer'
  })

  it('has no feature administration: the catalogue is defined by the API', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )
    expect(screen.queryByText('systemFeatures')).not.toBeInTheDocument()
    expect(screen.queryByText('newFeature')).not.toBeInTheDocument()
  })
})
