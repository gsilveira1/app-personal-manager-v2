import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ---- Mocks ----

const mockNavigate = vi.fn()

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../../store/store', () => ({
  useStore: () => ({
    plans: [
      { id: 'p1', name: 'Plan A', type: 'PRESENCIAL', sessionsPerWeek: 3, durationMinutes: 60, price: 400 },
      { id: 'p2', name: 'Plan B', type: 'CONSULTORIA', sessionsPerWeek: 2, durationMinutes: 45, price: 300 },
    ],
  }),
}))

// ---- Test data factories ----

const makeClient = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  name: 'Maria Silva',
  email: 'maria@test.com',
  phone: '51-99999-0000',
  status: 'Active' as const,
  type: 'In-Person' as const,
  avatar: null,
  planId: 'p1',
  ...overrides,
})

const makePlan = (overrides: Record<string, unknown> = {}) => ({
  id: 'p1',
  name: 'Plan A',
  type: 'PRESENCIAL',
  sessionsPerWeek: 3,
  durationMinutes: 60,
  price: 400,
  ...overrides,
})

// ===============================
// ClientsTable
// ===============================

describe('ClientsTable', () => {
  let ClientsTable: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./ClientsTable')
    ClientsTable = mod.ClientsTable
  })

  const clients = [makeClient(), makeClient({ id: 'c2', name: 'Joao Santos', email: 'joao@test.com', status: 'Inactive', planId: 'p2' })]
  const plans = [makePlan(), makePlan({ id: 'p2', name: 'Plan B' })]

  it('renders table with client rows', () => {
    render(<ClientsTable clients={clients} plans={plans} searchTerm="" onSearchChange={vi.fn()} />)

    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('Joao Santos')).toBeInTheDocument()
  })

  it('renders table column headers', () => {
    render(<ClientsTable clients={clients} plans={plans} searchTerm="" onSearchChange={vi.fn()} />)

    expect(screen.getByText('name')).toBeInTheDocument()
    expect(screen.getByText('status')).toBeInTheDocument()
    expect(screen.getByText('plan')).toBeInTheDocument()
    expect(screen.getByText('type')).toBeInTheDocument()
    expect(screen.getByText('email')).toBeInTheDocument()
    expect(screen.getByText('actions')).toBeInTheDocument()
  })

  it('shows empty state when no clients match', () => {
    render(<ClientsTable clients={[]} plans={plans} searchTerm="" onSearchChange={vi.fn()} />)

    expect(screen.getByText('noClients')).toBeInTheDocument()
  })

  it('filters clients by search term', () => {
    render(<ClientsTable clients={clients} plans={plans} searchTerm="maria" onSearchChange={vi.fn()} />)

    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.queryByText('Joao Santos')).not.toBeInTheDocument()
  })

  it('navigates to client details on row click', () => {
    render(<ClientsTable clients={clients} plans={plans} searchTerm="" onSearchChange={vi.fn()} />)

    fireEvent.click(screen.getByText('Maria Silva'))
    expect(mockNavigate).toHaveBeenCalledWith('/clients/c1')
  })

  it('renders status badge for Active client', () => {
    render(<ClientsTable clients={[makeClient({ status: 'Active' })]} plans={plans} searchTerm="" onSearchChange={vi.fn()} />)

    expect(screen.getByText('status.active')).toBeInTheDocument()
  })

  it('displays plan name for clients with a plan', () => {
    render(<ClientsTable clients={clients} plans={plans} searchTerm="" onSearchChange={vi.fn()} />)

    expect(screen.getByText('Plan A')).toBeInTheDocument()
    expect(screen.getByText('Plan B')).toBeInTheDocument()
  })

  it('shows noPlan text for clients without a plan', () => {
    render(<ClientsTable clients={[makeClient({ planId: undefined })]} plans={plans} searchTerm="" onSearchChange={vi.fn()} />)

    expect(screen.getByText('noPlan')).toBeInTheDocument()
  })

  it('displays client email and phone', () => {
    render(<ClientsTable clients={[makeClient()]} plans={plans} searchTerm="" onSearchChange={vi.fn()} />)

    expect(screen.getByText('maria@test.com')).toBeInTheDocument()
    expect(screen.getByText('51-99999-0000')).toBeInTheDocument()
  })

  it('renders SearchBar with the provided searchTerm', () => {
    render(<ClientsTable clients={clients} plans={plans} searchTerm="test" onSearchChange={vi.fn()} />)

    expect(screen.getByPlaceholderText('searchPlaceholder')).toHaveValue('test')
  })

  it('navigates via eye button without triggering row click', () => {
    render(<ClientsTable clients={[makeClient()]} plans={plans} searchTerm="" onSearchChange={vi.fn()} />)

    const buttons = screen.getAllByRole('button')
    const viewButton = buttons[buttons.length - 1]
    mockNavigate.mockClear()
    fireEvent.click(viewButton)
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/clients/c1')
  })
})

// ===============================
// AddClientModal
// ===============================

describe('AddClientModal', () => {
  let AddClientModal: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./AddClientModal')
    AddClientModal = mod.AddClientModal
  })

  it('renders the modal heading', () => {
    render(<AddClientModal onClose={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'addClient' })).toBeInTheDocument()
  })

  it('renders form fields for client data', () => {
    render(<AddClientModal onClose={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByPlaceholderText('namePlaceholder')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('emailPlaceholder')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('phonePlaceholder')).toBeInTheDocument()
    expect(screen.getByLabelText('dateOfBirth')).toBeInTheDocument()
    expect(screen.getByLabelText('status')).toBeInTheDocument()
    expect(screen.getByLabelText('type')).toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn()
    render(<AddClientModal onClose={onClose} onSave={vi.fn()} />)

    fireEvent.click(screen.getByText('cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('does not show checkInFrequency by default (In-Person type)', () => {
    render(<AddClientModal onClose={vi.fn()} onSave={vi.fn()} />)

    expect(screen.queryByText('checkInFrequency')).not.toBeInTheDocument()
  })

  it('shows checkInFrequency when Online type is selected', async () => {
    const user = userEvent.setup()
    render(<AddClientModal onClose={vi.fn()} onSave={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('type'), 'Online')

    expect(screen.getByText('checkInFrequency')).toBeInTheDocument()
  })

  it('does not show custom plan fields by default', () => {
    render(<AddClientModal onClose={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByText('selectPlan')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('planTitle')).not.toBeInTheDocument()
  })

  it('shows custom plan fields when toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<AddClientModal onClose={vi.fn()} onSave={vi.fn()} />)

    await user.click(screen.getByText('createCustomPlan'))

    expect(screen.getByPlaceholderText('planTitle')).toBeInTheDocument()
  })

  it('renders existing plans in the plan selector', () => {
    render(<AddClientModal onClose={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByText(/Plan A/)).toBeInTheDocument()
    expect(screen.getByText(/Plan B/)).toBeInTheDocument()
  })

  it('submits form with client data and calls onSave', async () => {
    const onSave = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(<AddClientModal onClose={onClose} onSave={onSave} />)

    await user.type(screen.getByPlaceholderText('namePlaceholder'), 'Ana Costa')
    await user.type(screen.getByPlaceholderText('emailPlaceholder'), 'ana@test.com')
    await user.type(screen.getByPlaceholderText('phonePlaceholder'), '51-88888-0000')
    fireEvent.change(screen.getByLabelText('dateOfBirth'), { target: { value: '1990-05-20' } })

    // The submit button has the same text as the heading; find the button specifically
    const submitBtn = screen.getAllByRole('button').find((b) => b.getAttribute('type') === 'submit')!
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    const savedClient = onSave.mock.calls[0][0]
    expect(savedClient.name).toBe('Ana Costa')
    expect(savedClient.email).toBe('ana@test.com')
    expect(savedClient.phone).toBe('51-88888-0000')
    expect(savedClient.type).toBe('In-Person')
    expect(onClose).toHaveBeenCalled()
  })

  it('shows medical history fields when toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<AddClientModal onClose={vi.fn()} onSave={vi.fn()} />)

    await user.click(screen.getByText('medicalHistoryOptional'))

    expect(screen.getByPlaceholderText('injuriesPlaceholder')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('medicationsPlaceholder')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('surgeriesPlaceholder')).toBeInTheDocument()
  })

  it('toggles between custom plan and existing plan selector', async () => {
    const user = userEvent.setup()
    render(<AddClientModal onClose={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByText('selectPlan')).toBeInTheDocument()

    await user.click(screen.getByText('createCustomPlan'))
    expect(screen.getByPlaceholderText('planTitle')).toBeInTheDocument()
    expect(screen.queryByText('selectPlan')).not.toBeInTheDocument()

    await user.click(screen.getByText('selectExistingPlan'))
    expect(screen.getByText('selectPlan')).toBeInTheDocument()
  })
})

// ===============================
// formatPlanLabel (exported utility)
// ===============================

describe('formatPlanLabel', () => {
  let formatPlanLabel: any

  beforeEach(async () => {
    const mod = await import('./AddClientModal')
    formatPlanLabel = mod.formatPlanLabel
  })

  it('formats plan with sessions per month and price', () => {
    const plan = { id: 'p1', name: 'Gold', type: 'PRESENCIAL' as const, sessionsPerWeek: 3, durationMinutes: 60, price: 500 }
    const result = formatPlanLabel(plan, '/mo')

    expect(result).toBe('Gold \u2014 12x/mo 60min \u00B7 R$ 500.00')
  })

  it('formats plan without duration', () => {
    const plan = { id: 'p2', name: 'Online', type: 'CONSULTORIA' as const, sessionsPerWeek: 2, price: 200 }
    const result = formatPlanLabel(plan, '/mo')

    expect(result).toBe('Online \u2014 8x/mo \u00B7 R$ 200.00')
  })
})
