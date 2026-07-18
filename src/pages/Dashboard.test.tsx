import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Dashboard } from './Dashboard'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}))

vi.mock('../utils/dateLocale', () => ({
  formatLocalized: (_date: Date, _format: string) => 'Mon',
}))

const today = new Date().toISOString().split('T')[0]

const mockClients = [
  { id: 'c1', name: 'Maria Silva', email: 'maria@test.com', phone: '123', status: 'Active', type: 'In-Person' as const },
  { id: 'c2', name: 'João Santos', email: 'joao@test.com', phone: '456', status: 'Active', type: 'Online' as const },
  { id: 'c3', name: 'Ana Lead', email: 'ana@test.com', phone: '789', status: 'Lead', type: 'In-Person' as const },
]

const mockSessions = [
  {
    id: 's1',
    clientId: 'c1',
    date: `${today}T09:00:00.000Z`,
    durationMinutes: 60,
    type: 'In-Person' as const,
    category: 'Workout' as const,
    completed: false,
  },
  {
    id: 's2',
    clientId: 'c2',
    date: `${today}T10:00:00.000Z`,
    durationMinutes: 45,
    type: 'Online' as const,
    category: 'Check-in' as const,
    completed: true,
  },
]

const mockToggleSessionComplete = vi.fn()

vi.mock('../store/store', () => ({
  useStore: () => ({
    clients: mockClients,
    sessions: mockSessions,
    toggleSessionComplete: mockToggleSessionComplete,
  }),
}))

vi.mock('../utils/scheduleUtils', () => ({
  findSchedulingConflicts: () => [],
}))

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderDashboard = () =>
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

  it('renders dashboard title', () => {
    renderDashboard()
    expect(screen.getByText('dashboard')).toBeInTheDocument()
  })

  it('renders all four stat card titles', () => {
    renderDashboard()
    expect(screen.getByText('sessionsToday')).toBeInTheDocument()
    expect(screen.getByText('thisWeeksSessions')).toBeInTheDocument()
    expect(screen.getByText('newLeads')).toBeInTheDocument()
    expect(screen.getByText('activeClients')).toBeInTheDocument()
  })

  it('renders new session link', () => {
    renderDashboard()
    expect(screen.getByText(/newSession/)).toBeInTheDocument()
  })

  it('renders weekly overview chart', () => {
    renderDashboard()
    expect(screen.getByText('weeklyOverview')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('does not render conflicts card when there are no conflicts', () => {
    renderDashboard()
    expect(screen.queryByText('conflictsDetected')).not.toBeInTheDocument()
  })

  it('renders today agenda section', () => {
    renderDashboard()
    expect(screen.getByText('todaysAgenda')).toBeInTheDocument()
  })

  it('renders client watchlist section', () => {
    renderDashboard()
    expect(screen.getByText('clientWatchlist')).toBeInTheDocument()
  })
})
