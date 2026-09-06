import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Settings } from './Settings'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'pt-BR' } }),
}))

const mockAddPlan = vi.fn()
const mockUpdatePlan = vi.fn()
const mockDeletePlan = vi.fn()
const mockUpdateAiPromptInstructions = vi.fn()
const mockFetchSystemFeatures = vi.fn()

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
    aiPromptInstructions: 'test instructions',
    updateAiPromptInstructions: mockUpdateAiPromptInstructions,
    systemFeatures: [{ id: 'feat-1', key: 'nutrition', name: 'Nutrição', isActive: true }],
    fetchSystemFeatures: mockFetchSystemFeatures,
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

vi.mock('../../components/organisms/settings/ProfileEditSection', () => ({
  ProfileEditSection: () => <div data-testid="profile-edit-section" />,
}))

vi.mock('../../components/organisms/settings/WorkHoursEditor', () => ({
  WorkHoursEditor: () => <div data-testid="work-hours-editor" />,
}))

vi.mock('../../components/organisms/settings/AppFeaturesConfigSection', () => ({
  AppFeaturesConfigSection: () => <div data-testid="app-features-config-section" />,
}))

vi.mock('../../components/organisms/settings/SystemFeaturesSection', () => ({
  SystemFeaturesSection: () => <div data-testid="system-features" />,
}))

vi.mock('../../components/organisms/settings/AiInstructionsSection', () => ({
  AiInstructionsSection: ({ value, onChange }: any) => (
    <div data-testid="ai-instructions-section">
      <textarea data-testid="ai-instructions-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  ),
}))

vi.mock('../../components/organisms/settings/PlansSection', () => ({
  PlansSection: ({ plans, onCreate, onEdit, onDelete }: any) => (
    <div data-testid="plans-section">
      <button onClick={onCreate}>newPlan</button>
      {plans.map((plan: any) => (
        <div key={plan.id} data-testid={`plan-${plan.id}`}>
          <span>{plan.name}</span>
          <button onClick={() => onEdit(plan)}>edit-{plan.id}</button>
          <button onClick={() => onDelete(plan.id)}>delete-{plan.id}</button>
        </div>
      ))}
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

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserRole = 'trainer'
  })

  const renderPage = (initialUrl = '/settings') =>
    render(
      <MemoryRouter initialEntries={[initialUrl]}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    )

  it('renders page title and calls fetchSystemFeatures on mount', () => {
    renderPage()
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(mockFetchSystemFeatures).toHaveBeenCalledOnce()
  })

  it('defaults to profile tab when no query param is given', () => {
    renderPage()
    expect(screen.getByTestId('tab-profile')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('profile-edit-section')).toBeInTheDocument()
    expect(screen.queryByTestId('work-hours-editor')).not.toBeInTheDocument()
    expect(screen.queryByTestId('app-features-config-section')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ai-instructions-section')).not.toBeInTheDocument()
    expect(screen.queryByTestId('plans-section')).not.toBeInTheDocument()
  })

  it('switches tabs and renders corresponding components when tab buttons are clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    // Switch to schedule
    await user.click(screen.getByTestId('tab-schedule'))
    expect(screen.getByTestId('tab-schedule')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('work-hours-editor')).toBeInTheDocument()
    expect(screen.queryByTestId('profile-edit-section')).not.toBeInTheDocument()

    // Switch to features
    await user.click(screen.getByTestId('tab-features'))
    expect(screen.getByTestId('tab-features')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('app-features-config-section')).toBeInTheDocument()

    // Switch to ai
    await user.click(screen.getByTestId('tab-ai'))
    expect(screen.getByTestId('tab-ai')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('ai-instructions-section')).toBeInTheDocument()

    // Switch to plans
    await user.click(screen.getByTestId('tab-plans'))
    expect(screen.getByTestId('tab-plans')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('plans-section')).toBeInTheDocument()

    // Switch back to profile
    await user.click(screen.getByTestId('tab-profile'))
    expect(screen.getByTestId('tab-profile')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('profile-edit-section')).toBeInTheDocument()
  })

  it('renders initial tab based on URL query param', () => {
    renderPage('/settings?tab=plans')
    expect(screen.getByTestId('tab-plans')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('plans-section')).toBeInTheDocument()
  })

  it('renders schedule tab when ?tab=schedule is in URL', () => {
    renderPage('/settings?tab=schedule')
    expect(screen.getByTestId('tab-schedule')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('work-hours-editor')).toBeInTheDocument()
  })

  it('renders features tab when ?tab=features is in URL', () => {
    renderPage('/settings?tab=features')
    expect(screen.getByTestId('tab-features')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('app-features-config-section')).toBeInTheDocument()
  })

  it('renders ai tab when ?tab=ai is in URL', () => {
    renderPage('/settings?tab=ai')
    expect(screen.getByTestId('tab-ai')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('ai-instructions-section')).toBeInTheDocument()
  })

  it('falls back to default profile tab if invalid ?tab=invalid is provided in URL', () => {
    renderPage('/settings?tab=invalid')
    expect(screen.getByTestId('tab-profile')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('profile-edit-section')).toBeInTheDocument()
  })

  it('does not render SystemFeaturesSection for non-admin on features tab', () => {
    renderPage('/settings?tab=features')
    expect(screen.getByTestId('app-features-config-section')).toBeInTheDocument()
    expect(screen.queryByTestId('system-features')).not.toBeInTheDocument()
  })

  it('calls updateAiPromptInstructions when textarea changes inside AI tab', async () => {
    const user = userEvent.setup()
    renderPage('/settings?tab=ai')

    const input = screen.getByTestId('ai-instructions-input')
    expect(input).toHaveValue('test instructions')
    await user.clear(input)
    await user.type(input, 'new instructions')
    expect(mockUpdateAiPromptInstructions).toHaveBeenCalled()
  })

  describe('Plans tab interactions', () => {
    it('opens plan editor modal when new plan button is clicked and creates plan', async () => {
      const user = userEvent.setup()
      renderPage('/settings?tab=plans')

      expect(screen.queryByTestId('plan-modal')).not.toBeInTheDocument()
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

    it('opens plan editor modal for editing and updates existing plan', async () => {
      const user = userEvent.setup()
      renderPage('/settings?tab=plans')

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

    it('closes modal without saving when close button is clicked', async () => {
      const user = userEvent.setup()
      renderPage('/settings?tab=plans')

      await user.click(screen.getByText('newPlan'))
      expect(screen.getByTestId('plan-modal')).toBeInTheDocument()

      await user.click(screen.getByText('close'))
      expect(screen.queryByTestId('plan-modal')).not.toBeInTheDocument()
      expect(mockAddPlan).not.toHaveBeenCalled()
    })

    it('calls deletePlan when delete confirmed', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      renderPage('/settings?tab=plans')

      await user.click(screen.getByText('delete-p1'))
      expect(confirmSpy).toHaveBeenCalledWith('deletePlanConfirm')
      expect(mockDeletePlan).toHaveBeenCalledWith('p1')
      confirmSpy.mockRestore()
    })

    it('does not call deletePlan when delete cancelled', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
      renderPage('/settings?tab=plans')

      await user.click(screen.getByText('delete-p1'))
      expect(confirmSpy).toHaveBeenCalledWith('deletePlanConfirm')
      expect(mockDeletePlan).not.toHaveBeenCalled()
      confirmSpy.mockRestore()
    })
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

  it('renders SystemFeaturesSection for admin user on features tab', () => {
    render(
      <MemoryRouter initialEntries={['/settings?tab=features']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByTestId('app-features-config-section')).toBeInTheDocument()
    expect(screen.getByTestId('system-features')).toBeInTheDocument()
  })
})
