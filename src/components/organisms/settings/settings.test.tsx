import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { PlanCard } from './PlanCard'
import { PlanEditorModal } from './PlanEditorModal'
import type { Plan, PlanFeatureDescriptor } from '../../../types'

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
  features: ['automated_pix'],
  ...overrides,
})

const makeFeature = (overrides: Partial<PlanFeatureDescriptor> = {}): PlanFeatureDescriptor => ({
  key: 'automated_pix',
  name: 'PIX automático',
  description: 'Cobrança recorrente por PIX',
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

  it('renders feature badges with the catalogue name of each key', () => {
    render(<PlanCard {...defaultProps} featureCatalog={[makeFeature()]} />)
    expect(screen.getByText('PIX automático')).toBeInTheDocument()
  })

  it('falls back to the key when the catalogue has no entry for it', () => {
    render(<PlanCard {...defaultProps} />)
    expect(screen.getByText('automated_pix')).toBeInTheDocument()
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
  const availableFeatures: PlanFeatureDescriptor[] = [makeFeature(), makeFeature({ key: 'advanced_metrics', name: 'Métricas avançadas' })]

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
    expect(screen.getByText('PIX automático')).toBeInTheDocument()
    expect(screen.getByText('Métricas avançadas')).toBeInTheDocument()
  })

  it('saves the selected features as keys', async () => {
    const user = userEvent.setup()
    render(<PlanEditorModal {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('planNamePlaceholderInPerson'), 'Plano com recursos')
    await user.click(screen.getByRole('checkbox', { name: /Métricas avançadas/ }))
    await user.click(screen.getByRole('button', { name: 'saveSettings' }))

    const savedData = defaultProps.onSave.mock.calls[0][0]
    expect(savedData.features).toEqual(['advanced_metrics'])
    expect(savedData).not.toHaveProperty('featureIds')
  })

  it('edit plan: the plan feature keys start checked', () => {
    render(<PlanEditorModal {...defaultProps} initialData={makePlan()} />)

    expect(screen.getByRole('checkbox', { name: /PIX automático/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Métricas avançadas/ })).not.toBeChecked()
  })
})
