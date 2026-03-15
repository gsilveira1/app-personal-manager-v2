import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Settings } from './Settings'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockAddPlan = vi.fn()
const mockUpdatePlan = vi.fn()
const mockDeletePlan = vi.fn()
const mockUpdateAiPromptInstructions = vi.fn()
const mockFetchSystemFeatures = vi.fn()

const mockPlans = [
  { id: 'p1', type: 'PRESENCIAL' as const, name: 'Plano A', sessionsPerWeek: 3, durationMinutes: 60, price: 300 },
  { id: 'p2', type: 'CONSULTORIA' as const, name: 'Plano B', sessionsPerWeek: 2, price: 200 },
]

vi.mock('../store/store', () => ({
  useStore: () => ({
    plans: mockPlans,
    addPlan: mockAddPlan,
    updatePlan: mockUpdatePlan,
    deletePlan: mockDeletePlan,
    aiPromptInstructions: 'test instructions',
    updateAiPromptInstructions: mockUpdateAiPromptInstructions,
    systemFeatures: [],
    fetchSystemFeatures: mockFetchSystemFeatures,
  }),
}))

let mockUserRole = 'trainer'

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({ user: { id: '1', name: 'Test', email: 'test@test.com', role: mockUserRole } }),
}))

vi.mock('../components/organisms/settings/PlanCard', () => ({
  PlanCard: ({ plan, onEdit, onDelete }: any) => (
    <div data-testid={`plan-${plan.id}`}>
      {plan.name}
      <button onClick={onEdit}>edit-{plan.id}</button>
      <button onClick={onDelete}>delete-{plan.id}</button>
    </div>
  ),
}))

vi.mock('../components/organisms/settings/PlanEditorModal', () => ({
  PlanEditorModal: ({ isOpen, onClose, onSave }: any) => isOpen ? <div data-testid="plan-modal"><button onClick={onClose}>close</button><button onClick={() => onSave({ name: 'New Plan', type: 'PRESENCIAL', sessionsPerWeek: 2, price: 150 })}>save</button></div> : null,
}))

vi.mock('../components/organisms/settings/SystemFeaturesSection', () => ({
  SystemFeaturesSection: () => <div data-testid="system-features" />,
}))

describe('Settings', () => {
  beforeEach(() => { vi.clearAllMocks() })

  const renderPage = () => render(<MemoryRouter><Settings /></MemoryRouter>)

  it('renders page title', () => {
    renderPage()
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('renders AI instructions section', () => {
    renderPage()
    expect(screen.getAllByText('aiInstructions').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByDisplayValue('test instructions')).toBeInTheDocument()
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

  it('calls fetchSystemFeatures on mount', () => {
    renderPage()
    expect(mockFetchSystemFeatures).toHaveBeenCalled()
  })

  it('does not render SystemFeaturesSection for non-admin', () => {
    renderPage()
    expect(screen.queryByTestId('system-features')).not.toBeInTheDocument()
  })

  it('calls updateAiPromptInstructions when textarea changes', async () => {
    const user = userEvent.setup()
    renderPage()

    const textarea = screen.getByDisplayValue('test instructions')
    await user.clear(textarea)
    await user.type(textarea, 'new instructions')
    expect(mockUpdateAiPromptInstructions).toHaveBeenCalled()
  })

  it('calls addPlan via handleSave when creating a new plan', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText('newPlan'))
    expect(screen.getByTestId('plan-modal')).toBeInTheDocument()

    await user.click(screen.getByText('save'))
    expect(mockAddPlan).toHaveBeenCalledWith({ name: 'New Plan', type: 'PRESENCIAL', sessionsPerWeek: 2, price: 150 })
    expect(screen.queryByTestId('plan-modal')).not.toBeInTheDocument()
  })

  it('calls updatePlan via handleSave when editing an existing plan', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText('edit-p1'))
    expect(screen.getByTestId('plan-modal')).toBeInTheDocument()

    await user.click(screen.getByText('save'))
    expect(mockUpdatePlan).toHaveBeenCalledWith('p1', { name: 'New Plan', type: 'PRESENCIAL', sessionsPerWeek: 2, price: 150 })
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
    mockUserRole = 'admin'
  })

  afterEach(() => {
    mockUserRole = 'trainer'
  })

  it('renders SystemFeaturesSection for admin user', () => {
    render(<MemoryRouter><Settings /></MemoryRouter>)
    expect(screen.getByTestId('system-features')).toBeInTheDocument()
  })
})
