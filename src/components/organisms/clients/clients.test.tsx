import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ---- Mocks ----

const mockNavigate = vi.fn()

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'pagination.showing' && options) {
        return `Showing ${options.start} to ${options.end} of ${options.total} results`
      }
      return key
    },
  }),
}))

vi.mock('../../../states/stores/store', () => ({
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
    expect(screen.getByText('modality')).toBeInTheDocument()
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
    render(<ClientsTable clients={[makeClient({ status: 'ACTIVE' })]} plans={plans} searchTerm="" onSearchChange={vi.fn()} />)

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

    const row = screen.getByTestId('client-row-c1')
    const buttonsInRow = row.querySelectorAll('button')
    const viewButton = buttonsInRow[buttonsInRow.length - 1]
    mockNavigate.mockClear()
    fireEvent.click(viewButton)
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/clients/c1')
  })

  it('paginates clients correctly when initialItemsPerPage is specified', () => {
    const manyClients = Array.from({ length: 12 }, (_, i) => makeClient({ id: `c${i + 1}`, name: `Client ${i + 1}`, email: `client${i + 1}@test.com` }))

    render(<ClientsTable clients={manyClients} plans={plans} searchTerm="" onSearchChange={vi.fn()} initialItemsPerPage={5} />)

    expect(screen.getByText('Client 1')).toBeInTheDocument()
    expect(screen.getByText('Client 5')).toBeInTheDocument()
    expect(screen.queryByText('Client 6')).not.toBeInTheDocument()

    // Click next page
    fireEvent.click(screen.getByTestId('pagination-next'))

    expect(screen.queryByText('Client 1')).not.toBeInTheDocument()
    expect(screen.getByText('Client 6')).toBeInTheDocument()
    expect(screen.getByText('Client 10')).toBeInTheDocument()
    expect(screen.queryByText('Client 11')).not.toBeInTheDocument()
  })

  it('changes items per page when selector changes', () => {
    const manyClients = Array.from({ length: 12 }, (_, i) => makeClient({ id: `c${i + 1}`, name: `Client ${i + 1}`, email: `client${i + 1}@test.com` }))

    render(<ClientsTable clients={manyClients} plans={plans} searchTerm="" onSearchChange={vi.fn()} initialItemsPerPage={5} />)

    fireEvent.change(screen.getByTestId('pagination-page-size'), { target: { value: '20' } })

    expect(screen.getByText('Client 1')).toBeInTheDocument()
    expect(screen.getByText('Client 12')).toBeInTheDocument()
  })

  it('sorts clients by name ascending and descending on header clicks', () => {
    const sortableClients = [
      makeClient({ id: 'c1', name: 'Zack Alpha', email: 'zack@test.com' }),
      makeClient({ id: 'c2', name: 'Alice Beta', email: 'alice@test.com' }),
    ]

    render(<ClientsTable clients={sortableClients} plans={plans} searchTerm="" onSearchChange={vi.fn()} />)

    const nameHeader = screen.getByTestId('sort-header-name')

    // Click to sort ASC (Alice first, Zack second)
    fireEvent.click(nameHeader)
    let rows = screen.getAllByTestId(/client-row-/)
    expect(rows[0]).toHaveTextContent('Alice Beta')
    expect(rows[1]).toHaveTextContent('Zack Alpha')

    // Click to sort DESC (Zack first, Alice second)
    fireEvent.click(nameHeader)
    rows = screen.getAllByTestId(/client-row-/)
    expect(rows[0]).toHaveTextContent('Zack Alpha')
    expect(rows[1]).toHaveTextContent('Alice Beta')
  })

  it('sorts clients by email, modality, and status on header clicks', () => {
    const sortableClients = [
      makeClient({ id: 'c1', name: 'Client 1', email: 'b@test.com', modality: 'PRESENCIAL', status: 'ACTIVE' }),
      makeClient({ id: 'c2', name: 'Client 2', email: 'a@test.com', modality: 'ONLINE', status: 'PAUSED' }),
    ]

    render(<ClientsTable clients={sortableClients} plans={plans} searchTerm="" onSearchChange={vi.fn()} />)

    // Sort by email ASC
    fireEvent.click(screen.getByTestId('sort-header-email'))
    let rows = screen.getAllByTestId(/client-row-/)
    expect(rows[0]).toHaveTextContent('a@test.com')

    // Sort by modality ASC
    fireEvent.click(screen.getByTestId('sort-header-modality'))
    rows = screen.getAllByTestId(/client-row-/)
    expect(rows[0]).toHaveTextContent('modalityOnline')

    // Sort by status ASC
    fireEvent.click(screen.getByTestId('sort-header-status'))
    rows = screen.getAllByTestId(/client-row-/)
    expect(rows[0]).toHaveTextContent('status.active')
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
    expect(screen.getByLabelText('modality')).toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn()
    render(<AddClientModal onClose={onClose} onSave={vi.fn()} />)

    fireEvent.click(screen.getByText('cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('does not show checkInFrequency by default (PRESENCIAL modality)', () => {
    render(<AddClientModal onClose={vi.fn()} onSave={vi.fn()} />)

    expect(screen.queryByText('checkInFrequency')).not.toBeInTheDocument()
  })

  it('shows checkInFrequency when ONLINE modality is selected', async () => {
    const user = userEvent.setup()
    render(<AddClientModal onClose={vi.fn()} onSave={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('modality'), 'ONLINE')

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
    expect(savedClient.modality).toBe('PRESENCIAL')
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

  it('handles full client entity submission with modality, status, notes, notifications and medical history', async () => {
    const onSave = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(<AddClientModal onClose={onClose} onSave={onSave} />)

    await user.type(screen.getByPlaceholderText('namePlaceholder'), 'Carlos Santana')
    await user.type(screen.getByPlaceholderText('emailPlaceholder'), 'carlos@santana.com')
    await user.type(screen.getByPlaceholderText('phonePlaceholder'), '+555399991111')
    await user.selectOptions(screen.getByLabelText('modality'), 'ONLINE')
    await user.selectOptions(screen.getByLabelText('status'), 'PAUSED')
    await user.type(screen.getByPlaceholderText('notesPlaceholder'), 'Aluno iniciante com foco em postura')

    // Open medical history
    await user.click(screen.getByText('medicalHistoryOptional'))
    await user.type(screen.getByPlaceholderText('injuriesPlaceholder'), 'Dor lombar L4-L5')
    await user.click(screen.getByLabelText('hasHeartDisease'))

    const submitBtn = screen.getAllByRole('button').find((b) => b.getAttribute('type') === 'submit')!
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    const payload = onSave.mock.calls[0][0]
    expect(payload.name).toBe('Carlos Santana')
    expect(payload.modality).toBe('ONLINE')
    expect(payload.status).toBe('PAUSED')
    expect(payload.phone).toBe('+555399991111')
    expect(payload.notes).toBe('Aluno iniciante com foco em postura')
    expect(payload.notificationEnabled).toBe(true)
    expect(payload.medicalHistory?.injuries).toBe('Dor lombar L4-L5')
    expect(payload.medicalHistory?.hasHeartDisease).toBe(true)
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
