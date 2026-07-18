import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Clients } from './Clients'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

const mockAddClient = vi.fn()
const mockClients = [
  { id: '1', name: 'Maria Silva', email: 'maria@test.com', phone: '123', status: 'Active', type: 'In-Person' as const },
  { id: '2', name: 'João Santos', email: 'joao@test.com', phone: '456', status: 'Active', type: 'Online' as const },
  { id: '3', name: 'Ana Lead', email: 'ana@test.com', phone: '789', status: 'Lead', type: 'In-Person' as const },
]
const mockPlans = [
  { id: 'plan-1', type: 'PRESENCIAL' as const, name: 'Plano Básico', sessionsPerWeek: 3, durationMinutes: 60, price: 300 },
]

vi.mock('../store/store', () => ({
  useStore: () => ({
    clients: mockClients,
    plans: mockPlans,
    addClient: mockAddClient,
  }),
}))

describe('Clients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderClients = () =>
    render(
      <MemoryRouter>
        <Clients />
      </MemoryRouter>
    )

  it('renders page title', () => {
    renderClients()
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('renders add client button', () => {
    renderClients()
    expect(screen.getByText('addClient')).toBeInTheDocument()
  })

  it('renders all clients in the table', () => {
    renderClients()
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('João Santos')).toBeInTheDocument()
    expect(screen.getByText('Ana Lead')).toBeInTheDocument()
  })

  it('filters clients by search term', async () => {
    const user = userEvent.setup()
    renderClients()

    const searchInput = screen.getByPlaceholderText('searchPlaceholder')
    await user.type(searchInput, 'Maria')

    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.queryByText('João Santos')).not.toBeInTheDocument()
    expect(screen.queryByText('Ana Lead')).not.toBeInTheDocument()
  })

  it('filters clients by email', async () => {
    const user = userEvent.setup()
    renderClients()

    const searchInput = screen.getByPlaceholderText('searchPlaceholder')
    await user.type(searchInput, 'joao@')

    expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument()
    expect(screen.getByText('João Santos')).toBeInTheDocument()
  })

  it('shows empty state when search matches nothing', async () => {
    const user = userEvent.setup()
    renderClients()

    const searchInput = screen.getByPlaceholderText('searchPlaceholder')
    await user.type(searchInput, 'zzzzzzz')

    expect(screen.getByText('noClients')).toBeInTheDocument()
  })

  it('opens AddClientModal when add button is clicked', async () => {
    const user = userEvent.setup()
    renderClients()

    await user.click(screen.getByText('addClient'))

    // AddClientModal renders a form with "fullName" label
    expect(screen.getByText('fullName')).toBeInTheDocument()
  })
})
