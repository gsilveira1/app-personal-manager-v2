import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../../services/apiService', () => ({
  getSystemFeatures: vi.fn(),
  createSystemFeature: vi.fn(),
  updateSystemFeature: vi.fn(),
  deleteSystemFeature: vi.fn(),
}))

import { PlanCard } from './PlanCard'
import { PlanEditorModal } from './PlanEditorModal'
import { FeatureEditorModal } from './FeatureEditorModal'
import { SystemFeaturesSection } from './SystemFeaturesSection'
import * as api from '../../../services/apiService'
import type { Plan, SystemFeature } from '../../../types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makePlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'plan-1',
  type: 'PRESENCIAL',
  name: 'Plano Premium',
  sessionsPerWeek: 3,
  durationMinutes: 60,
  price: 450,
  features: [
    {
      planId: 'plan-1',
      featureId: 'feat-1',
      feature: { id: 'feat-1', key: 'nutrition', name: 'Nutrição', isActive: true },
    },
  ],
  ...overrides,
})

const makeFeature = (overrides: Partial<SystemFeature> = {}): SystemFeature => ({
  id: 'feat-1',
  key: 'nutrition',
  name: 'Nutrição',
  description: 'Acompanhamento nutricional',
  isActive: true,
  _count: { plans: 2 },
  ...overrides,
})

// ===========================================================================
// PlanCard
// ===========================================================================
describe('PlanCard', () => {
  const defaultProps = {
    plan: makePlan(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders plan name', () => {
    render(<PlanCard {...defaultProps} />)
    expect(screen.getByText('Plano Premium')).toBeInTheDocument()
  })

  it('renders sessions per week', () => {
    render(<PlanCard {...defaultProps} />)
    expect(screen.getByText('3x')).toBeInTheDocument()
  })

  it('renders duration in minutes', () => {
    render(<PlanCard {...defaultProps} />)
    expect(screen.getByText('60')).toBeInTheDocument()
  })

  it('displays price correctly', () => {
    render(<PlanCard {...defaultProps} />)
    expect(screen.getByText('R$ 450.00')).toBeInTheDocument()
  })

  it('renders feature badges', () => {
    render(<PlanCard {...defaultProps} />)
    expect(screen.getByText('Nutrição')).toBeInTheDocument()
  })

  it('edit button calls onEdit', async () => {
    const user = userEvent.setup()
    render(<PlanCard {...defaultProps} />)
    // The plan card has exactly 2 icon buttons: edit (first) and delete (second)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(2)
    await user.click(buttons[0])
    expect(defaultProps.onEdit).toHaveBeenCalledOnce()
  })

  it('delete button calls onDelete', async () => {
    const user = userEvent.setup()
    render(<PlanCard {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[1])
    expect(defaultProps.onDelete).toHaveBeenCalledOnce()
  })
})

// ===========================================================================
// PlanEditorModal
// ===========================================================================
describe('PlanEditorModal', () => {
  const availableFeatures: SystemFeature[] = [
    makeFeature(),
    makeFeature({ id: 'feat-2', key: 'app_access', name: 'Acesso ao App' }),
  ]

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    initialData: null as Plan | null,
    availableFeatures,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when not open', () => {
    const { container } = render(<PlanEditorModal {...defaultProps} isOpen={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('new plan: fields use default values, type defaults to PRESENCIAL', () => {
    render(<PlanEditorModal {...defaultProps} />)
    // PRESENCIAL button should be the active type
    const presencialBtn = screen.getByRole('button', { name: 'inPerson' })
    expect(presencialBtn.className).toContain('border-indigo-600')
    // Name input should be empty
    const nameInput = screen.getByPlaceholderText('planNamePlaceholderInPerson')
    expect(nameInput).toHaveValue('')
  })

  it('edit plan: fields populated from initialData', () => {
    const plan = makePlan()
    render(<PlanEditorModal {...defaultProps} initialData={plan} />)
    const nameInput = screen.getByRole('textbox') as HTMLInputElement
    expect(nameInput.value).toBe('Plano Premium')
  })

  it('duration field only shown for PRESENCIAL', async () => {
    const user = userEvent.setup()
    render(<PlanEditorModal {...defaultProps} />)
    // Duration select should be visible for PRESENCIAL
    expect(screen.getByLabelText('duration')).toBeInTheDocument()
    // Switch to CONSULTORIA
    await user.click(screen.getByRole('button', { name: 'consulting' }))
    // Duration field should disappear
    expect(screen.queryByLabelText('duration')).not.toBeInTheDocument()
  })

  it('form submission calls onSave with correct data', async () => {
    const user = userEvent.setup()
    render(<PlanEditorModal {...defaultProps} />)
    const nameInput = screen.getByPlaceholderText('planNamePlaceholderInPerson')
    await user.clear(nameInput)
    await user.type(nameInput, 'Novo Plano')
    // Submit the form
    const saveBtn = screen.getByRole('button', { name: 'saveSettings' })
    await user.click(saveBtn)
    expect(defaultProps.onSave).toHaveBeenCalledOnce()
    const savedData = defaultProps.onSave.mock.calls[0][0]
    expect(savedData.name).toBe('Novo Plano')
    expect(savedData.type).toBe('PRESENCIAL')
  })

  it('renders feature checkboxes', () => {
    render(<PlanEditorModal {...defaultProps} />)
    expect(screen.getByText('Nutrição')).toBeInTheDocument()
    expect(screen.getByText('Acesso ao App')).toBeInTheDocument()
  })
})

// ===========================================================================
// FeatureEditorModal
// ===========================================================================
describe('FeatureEditorModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    initialData: null as SystemFeature | null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when not open', () => {
    const { container } = render(<FeatureEditorModal {...defaultProps} isOpen={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('new feature: fields empty, key input enabled', () => {
    render(<FeatureEditorModal {...defaultProps} />)
    const keyInput = screen.getByLabelText('featureKey') as HTMLInputElement
    const nameInput = screen.getByLabelText('featureName') as HTMLInputElement
    expect(keyInput.value).toBe('')
    expect(keyInput).not.toBeDisabled()
    expect(nameInput.value).toBe('')
  })

  it('edit feature: fields populated, key input disabled', () => {
    const feature = makeFeature()
    render(<FeatureEditorModal {...defaultProps} initialData={feature} />)
    const keyInput = screen.getByLabelText('featureKey') as HTMLInputElement
    const nameInput = screen.getByLabelText('featureName') as HTMLInputElement
    expect(keyInput.value).toBe('nutrition')
    expect(keyInput).toBeDisabled()
    expect(nameInput.value).toBe('Nutrição')
  })

  it('form submission calls onSave with entered data', async () => {
    const user = userEvent.setup()
    render(<FeatureEditorModal {...defaultProps} />)
    await user.type(screen.getByLabelText('featureKey'), 'cardio')
    await user.type(screen.getByLabelText('featureName'), 'Cardio')
    const saveBtn = screen.getByRole('button', { name: 'saveSettings' })
    await user.click(saveBtn)
    expect(defaultProps.onSave).toHaveBeenCalledWith({
      key: 'cardio',
      name: 'Cardio',
      description: undefined,
    })
  })

  it('cancel button calls onClose', async () => {
    const user = userEvent.setup()
    render(<FeatureEditorModal {...defaultProps} />)
    const cancelBtn = screen.getByRole('button', { name: 'cancel' })
    await user.click(cancelBtn)
    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })
})

// ===========================================================================
// SystemFeaturesSection
// ===========================================================================
describe('SystemFeaturesSection', () => {
  const features: SystemFeature[] = [
    makeFeature(),
    makeFeature({ id: 'feat-2', key: 'app_access', name: 'Acesso ao App', isActive: false }),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getSystemFeatures).mockResolvedValue(features)
    vi.mocked(api.createSystemFeature).mockResolvedValue(
      makeFeature({ id: 'feat-new', key: 'new_feat', name: 'Nova Feature' })
    )
    vi.mocked(api.updateSystemFeature).mockResolvedValue(
      makeFeature({ isActive: false })
    )
    vi.mocked(api.deleteSystemFeature).mockResolvedValue(undefined as any)
  })

  it('fetches features on mount and renders them', async () => {
    render(<SystemFeaturesSection />)
    await waitFor(() => {
      expect(api.getSystemFeatures).toHaveBeenCalledOnce()
    })
    expect(await screen.findByText('Nutrição')).toBeInTheDocument()
    expect(await screen.findByText('Acesso ao App')).toBeInTheDocument()
  })

  it('renders empty state when no features exist', async () => {
    vi.mocked(api.getSystemFeatures).mockResolvedValue([])
    render(<SystemFeaturesSection />)
    expect(await screen.findByText('noFeaturesCreated')).toBeInTheDocument()
  })

  it('toggle calls updateSystemFeature with inverted isActive', async () => {
    const user = userEvent.setup()
    render(<SystemFeaturesSection />)
    // Wait for features to load
    await screen.findByText('Nutrição')
    // Find toggle buttons (the rounded-full switch buttons)
    const toggleButtons = screen.getAllByRole('button').filter(
      (b) => b.className.includes('rounded-full') && b.className.includes('transition-colors')
    )
    expect(toggleButtons.length).toBeGreaterThan(0)
    await user.click(toggleButtons[0])
    expect(api.updateSystemFeature).toHaveBeenCalledWith('feat-1', { isActive: false })
  })

  it('New Feature button opens editor modal', async () => {
    const user = userEvent.setup()
    render(<SystemFeaturesSection />)
    await screen.findByText('Nutrição')
    const newBtn = screen.getByRole('button', { name: /newFeature/i })
    await user.click(newBtn)
    // The FeatureEditorModal should now be open with the title for new feature
    expect(screen.getByText('featureKey')).toBeInTheDocument()
  })

  it('delete with confirmation calls deleteSystemFeature', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<SystemFeaturesSection />)
    await screen.findByText('Nutrição')
    // Find delete buttons (Trash2 icon buttons)
    const deleteButtons = screen.getAllByRole('button').filter(
      (b) => b.querySelector('.lucide-trash-2')
    )
    expect(deleteButtons.length).toBeGreaterThan(0)
    await user.click(deleteButtons[0])
    expect(confirmSpy).toHaveBeenCalledWith('deleteFeatureConfirm')
    expect(api.deleteSystemFeature).toHaveBeenCalledWith('feat-1')
    confirmSpy.mockRestore()
  })

  it('delete cancelled does not call deleteSystemFeature', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<SystemFeaturesSection />)
    await screen.findByText('Nutrição')
    const deleteButtons = screen.getAllByRole('button').filter(
      (b) => b.querySelector('.lucide-trash-2')
    )
    await user.click(deleteButtons[0])
    expect(confirmSpy).toHaveBeenCalled()
    expect(api.deleteSystemFeature).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('delete removes feature from the list', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<SystemFeaturesSection />)
    await screen.findByText('Nutrição')
    const deleteButtons = screen.getAllByRole('button').filter(
      (b) => b.querySelector('.lucide-trash-2')
    )
    await user.click(deleteButtons[0])
    await waitFor(() => {
      expect(screen.queryByText('Nutrição')).not.toBeInTheDocument()
    })
    // The second feature should still be present
    expect(screen.getByText('Acesso ao App')).toBeInTheDocument()
  })

  it('handleDelete logs error when api fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.deleteSystemFeature).mockRejectedValueOnce(new Error('Network error'))
    render(<SystemFeaturesSection />)
    await screen.findByText('Nutrição')
    const deleteButtons = screen.getAllByRole('button').filter(
      (b) => b.querySelector('.lucide-trash-2')
    )
    await user.click(deleteButtons[0])
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete system feature:', expect.any(Error))
    })
    consoleSpy.mockRestore()
  })

  it('handleToggleActive updates feature in list', async () => {
    const user = userEvent.setup()
    const updatedFeature = makeFeature({ id: 'feat-1', isActive: false })
    vi.mocked(api.updateSystemFeature).mockResolvedValueOnce(updatedFeature)
    render(<SystemFeaturesSection />)
    await screen.findByText('Nutrição')
    const toggleButtons = screen.getAllByRole('button').filter(
      (b) => b.className.includes('rounded-full') && b.className.includes('transition-colors')
    )
    // First toggle is for feat-1 (active, bg-green-500)
    expect(toggleButtons[0].className).toContain('bg-green-500')
    await user.click(toggleButtons[0])
    await waitFor(() => {
      // After toggle, the button should reflect inactive state
      const updatedToggles = screen.getAllByRole('button').filter(
        (b) => b.className.includes('rounded-full') && b.className.includes('transition-colors')
      )
      expect(updatedToggles[0].className).toContain('bg-slate-300')
    })
  })

  it('handleToggleActive logs error when api fails', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.updateSystemFeature).mockRejectedValueOnce(new Error('Toggle error'))
    render(<SystemFeaturesSection />)
    await screen.findByText('Nutrição')
    const toggleButtons = screen.getAllByRole('button').filter(
      (b) => b.className.includes('rounded-full') && b.className.includes('transition-colors')
    )
    await user.click(toggleButtons[0])
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to toggle system feature:', expect.any(Error))
    })
    consoleSpy.mockRestore()
  })

  it('edit button opens modal with feature data pre-filled', async () => {
    const user = userEvent.setup()
    render(<SystemFeaturesSection />)
    await screen.findByText('Nutrição')
    // Find ghost variant buttons that are 7x7 (edit/delete buttons come in pairs per feature)
    const ghostButtons = screen.getAllByRole('button').filter(
      (b) => b.className.includes('h-7') && b.className.includes('w-7')
    )
    // Edit buttons are the odd-indexed (first of each pair)
    expect(ghostButtons.length).toBeGreaterThanOrEqual(2)
    await user.click(ghostButtons[0])
    // The FeatureEditorModal should be open with pre-filled data
    const keyInput = screen.getByLabelText('featureKey') as HTMLInputElement
    expect(keyInput.value).toBe('nutrition')
    expect(keyInput).toBeDisabled()
  })

  it('handleSave creates new feature and adds to list', async () => {
    const user = userEvent.setup()
    render(<SystemFeaturesSection />)
    await screen.findByText('Nutrição')
    // Open new feature modal
    const newBtn = screen.getByRole('button', { name: /newFeature/i })
    await user.click(newBtn)
    // Fill in the form
    await user.type(screen.getByLabelText('featureKey'), 'new_feat')
    await user.type(screen.getByLabelText('featureName'), 'Nova Feature')
    // Submit the form
    const saveBtn = screen.getByRole('button', { name: 'saveSettings' })
    await user.click(saveBtn)
    await waitFor(() => {
      expect(api.createSystemFeature).toHaveBeenCalledWith({
        key: 'new_feat',
        name: 'Nova Feature',
        description: undefined,
      })
    })
    // New feature should be in the list
    expect(await screen.findByText('Nova Feature')).toBeInTheDocument()
  })

  it('handleSave updates existing feature in list', async () => {
    const user = userEvent.setup()
    const updatedFeature = makeFeature({ id: 'feat-1', key: 'nutrition', name: 'Nutrição Atualizada' })
    vi.mocked(api.updateSystemFeature).mockResolvedValueOnce(updatedFeature)
    render(<SystemFeaturesSection />)
    await screen.findByText('Nutrição')
    // Open edit modal for first feature using ghost buttons
    const ghostButtons = screen.getAllByRole('button').filter(
      (b) => b.className.includes('h-7') && b.className.includes('w-7')
    )
    await user.click(ghostButtons[0])
    // Change the name
    const nameInput = screen.getByLabelText('featureName') as HTMLInputElement
    await user.clear(nameInput)
    await user.type(nameInput, 'Nutrição Atualizada')
    // Submit
    const saveBtn = screen.getByRole('button', { name: 'saveSettings' })
    await user.click(saveBtn)
    await waitFor(() => {
      expect(api.updateSystemFeature).toHaveBeenCalled()
    })
    // Updated name should appear
    expect(await screen.findByText('Nutrição Atualizada')).toBeInTheDocument()
  })

  it('handleSave logs error when api fails', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.createSystemFeature).mockRejectedValueOnce(new Error('Save error'))
    render(<SystemFeaturesSection />)
    await screen.findByText('Nutrição')
    const newBtn = screen.getByRole('button', { name: /newFeature/i })
    await user.click(newBtn)
    await user.type(screen.getByLabelText('featureKey'), 'fail_feat')
    await user.type(screen.getByLabelText('featureName'), 'Fail Feature')
    const saveBtn = screen.getByRole('button', { name: 'saveSettings' })
    await user.click(saveBtn)
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save system feature:', expect.any(Error))
    })
    consoleSpy.mockRestore()
  })

  it('renders plans count when _count is present', async () => {
    render(<SystemFeaturesSection />)
    await screen.findByText('Nutrição')
    // Both features have _count: { plans: 2 } — text is "· 2 plansUsingFeature" inside a span
    const planCountSpans = await screen.findAllByText(/plansUsingFeature/)
    expect(planCountSpans.length).toBeGreaterThanOrEqual(1)
  })

  it('renders description when feature has one', async () => {
    render(<SystemFeaturesSection />)
    await screen.findByText('Nutrição')
    // Both features have description from makeFeature defaults
    expect(screen.getAllByText('Acompanhamento nutricional').length).toBeGreaterThanOrEqual(1)
  })

  it('fetchAll logs error when api fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.getSystemFeatures).mockRejectedValueOnce(new Error('Fetch error'))
    render(<SystemFeaturesSection />)
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch system features:', expect.any(Error))
    })
    consoleSpy.mockRestore()
  })

  it('modal closes after successful save', async () => {
    const user = userEvent.setup()
    render(<SystemFeaturesSection />)
    await screen.findByText('Nutrição')
    const newBtn = screen.getByRole('button', { name: /newFeature/i })
    await user.click(newBtn)
    // Modal should be open
    expect(screen.getByLabelText('featureKey')).toBeInTheDocument()
    // Fill and save
    await user.type(screen.getByLabelText('featureKey'), 'new_feat')
    await user.type(screen.getByLabelText('featureName'), 'Nova Feature')
    const saveBtn = screen.getByRole('button', { name: 'saveSettings' })
    await user.click(saveBtn)
    // Modal should close
    await waitFor(() => {
      expect(screen.queryByLabelText('featureKey')).not.toBeInTheDocument()
    })
  })
})
