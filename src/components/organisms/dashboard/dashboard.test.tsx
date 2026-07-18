import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// --- Mocks ---

const mockNavigate = vi.fn()
let mockClients: Array<{
  id: string
  name: string
  email: string
  phone: string
  status: string
  type: string
  avatar?: string
}> = []

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('react-router-dom', () => ({
  Link: (props: any) => <a href={props.to}>{props.children}</a>,
}))

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../../utils/dateLocale', () => ({
  formatLocalized: () => 'formatted-date',
}))

vi.mock('../../../store/store', () => ({
  useStore: (selector?: (s: any) => any) => {
    const state = { clients: mockClients }
    return selector ? selector(state) : state
  },
}))

import { TodayAgenda } from './TodayAgenda'
import { ConflictsCard } from './ConflictsCard'
import { ClientWatchlist } from './ClientWatchlist'

import type { Session, Client } from '../../../types'

// --- Helpers ---

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'c1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    phone: '555-0101',
    status: 'Active',
    type: 'In-Person',
    avatar: 'https://example.com/avatar.jpg',
    ...overrides,
  }
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    clientId: 'c1',
    date: '2026-03-15T10:00:00.000Z',
    durationMinutes: 60,
    type: 'In-Person',
    category: 'Workout',
    completed: false,
    ...overrides,
  }
}

// --- Tests ---

describe('TodayAgenda', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "allClear" text when there are no sessions', () => {
    render(<TodayAgenda sessions={[]} clients={[]} onToggleComplete={vi.fn()} />)
    expect(screen.getByText('allClear')).toBeInTheDocument()
    expect(screen.getByText('noSessionsForToday')).toBeInTheDocument()
  })

  it('renders session details including client name and type', () => {
    const client = makeClient()
    const session = makeSession()
    render(<TodayAgenda sessions={[session]} clients={[client]} onToggleComplete={vi.fn()} />)

    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    // Type renders as tc('inPerson') which returns 'inPerson'
    expect(screen.getByText(/inPerson/)).toBeInTheDocument()
  })

  it('renders session with Online type', () => {
    const client = makeClient()
    const session = makeSession({ type: 'Online' })
    render(<TodayAgenda sessions={[session]} clients={[client]} onToggleComplete={vi.fn()} />)

    expect(screen.getByText(/online/)).toBeInTheDocument()
  })

  it('shows "unknownClient" when client is not found', () => {
    const session = makeSession({ clientId: 'unknown-id' })
    render(<TodayAgenda sessions={[session]} clients={[]} onToggleComplete={vi.fn()} />)

    expect(screen.getByText('unknownClient')).toBeInTheDocument()
  })

  it('calls onToggleComplete with session id when mark complete button is clicked', () => {
    const client = makeClient()
    const session = makeSession({ id: 'session-123' })
    const onToggle = vi.fn()
    render(<TodayAgenda sessions={[session]} clients={[client]} onToggleComplete={onToggle} />)

    // The button contains the text 'markComplete'
    const completeButton = screen.getByText('markComplete').closest('button')!
    fireEvent.click(completeButton)
    expect(onToggle).toHaveBeenCalledWith('session-123')
  })

  it('shows completed status instead of button for completed sessions', () => {
    const client = makeClient()
    const session = makeSession({ completed: true })
    render(<TodayAgenda sessions={[session]} clients={[client]} onToggleComplete={vi.fn()} />)

    expect(screen.getByText('completed')).toBeInTheDocument()
    expect(screen.queryByText('markComplete')).not.toBeInTheDocument()
  })

  it('renders formatted date from formatLocalized', () => {
    render(<TodayAgenda sessions={[]} clients={[]} onToggleComplete={vi.fn()} />)
    // The date line uses formatLocalized which returns 'formatted-date'
    expect(screen.getByText('formatted-date')).toBeInTheDocument()
  })
})

describe('ConflictsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClients = [
      makeClient({ id: 'c1', name: 'Alice Smith' }),
      makeClient({ id: 'c2', name: 'Bob Jones' }),
    ]
  })

  it('renders conflict count in the title', () => {
    const conflicts: Session[][] = [
      [makeSession({ id: 's1', clientId: 'c1' }), makeSession({ id: 's2', clientId: 'c2' })],
      [makeSession({ id: 's3', clientId: 'c1' }), makeSession({ id: 's4', clientId: 'c2' })],
    ]
    render(<ConflictsCard conflicts={conflicts} />)

    // t('conflictsDetected', { count: 2 }) returns 'conflictsDetected'
    expect(screen.getByText('conflictsDetected')).toBeInTheDocument()
  })

  it('renders client names within conflict groups', () => {
    const conflicts: Session[][] = [
      [makeSession({ id: 's1', clientId: 'c1' }), makeSession({ id: 's2', clientId: 'c2' })],
    ]
    render(<ConflictsCard conflicts={conflicts} />)

    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
  })

  it('navigates to /schedule when resolve button is clicked', () => {
    const conflicts: Session[][] = [
      [makeSession({ id: 's1', clientId: 'c1' })],
    ]
    render(<ConflictsCard conflicts={conflicts} />)

    const resolveButton = screen.getByText('resolveConflicts').closest('button')!
    fireEvent.click(resolveButton)
    expect(mockNavigate).toHaveBeenCalledWith('/schedule')
  })

  it('renders with empty conflicts array without crashing', () => {
    render(<ConflictsCard conflicts={[]} />)
    expect(screen.getByText('conflictsDetected')).toBeInTheDocument()
  })

  it('renders conflict group labels', () => {
    const conflicts: Session[][] = [
      [makeSession({ id: 's1', clientId: 'c1' })],
      [makeSession({ id: 's2', clientId: 'c2' })],
    ]
    render(<ConflictsCard conflicts={conflicts} />)

    // Each group renders t('conflictGroup', { index: n }) which returns 'conflictGroup'
    const groupLabels = screen.getAllByText('conflictGroup')
    expect(groupLabels).toHaveLength(2)
  })
})

describe('ClientWatchlist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders client names', () => {
    const clients = [
      makeClient({ id: 'c1', name: 'Alice Smith' }),
      makeClient({ id: 'c2', name: 'Bob Jones' }),
    ]
    render(<ClientWatchlist clients={clients} />)

    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
  })

  it('shows empty state when no clients are provided', () => {
    render(<ClientWatchlist clients={[]} />)
    expect(screen.getByText('noClientsToWatch')).toBeInTheDocument()
  })

  it('renders view buttons for each client', () => {
    const clients = [
      makeClient({ id: 'c1', name: 'Alice Smith' }),
      makeClient({ id: 'c2', name: 'Bob Jones' }),
    ]
    render(<ClientWatchlist clients={clients} />)

    // Each client has a 'view' button (translation key)
    const viewButtons = screen.getAllByText('view')
    expect(viewButtons).toHaveLength(2)
  })

  it('renders links to client detail pages', () => {
    const clients = [makeClient({ id: 'client-42', name: 'Alice Smith' })]
    render(<ClientWatchlist clients={clients} />)

    // The Link renders as <a href="/clients/client-42">
    const links = screen.getAllByRole('link')
    const clientLinks = links.filter((link) => link.getAttribute('href') === '/clients/client-42')
    expect(clientLinks.length).toBeGreaterThan(0)
  })

  it('renders the watchlist title', () => {
    render(<ClientWatchlist clients={[]} />)
    expect(screen.getByText('clientWatchlist')).toBeInTheDocument()
  })
})
