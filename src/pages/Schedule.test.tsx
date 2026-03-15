import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Schedule } from './Schedule'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockSessions = [
  { id: 's1', clientId: 'c1', date: new Date().toISOString(), durationMinutes: 60, type: 'In-Person' as const, category: 'Workout' as const, completed: false },
]

vi.mock('../store/store', () => ({
  useStore: () => ({
    sessions: mockSessions,
    clients: [{ id: 'c1', name: 'Maria', email: 'm@t.com', phone: '123', status: 'Active', type: 'In-Person' }],
    toggleSessionComplete: vi.fn(),
    addSession: vi.fn(),
    addRecurringSessions: vi.fn(),
    addRecurringEvent: vi.fn(),
    fetchSessionsForRange: vi.fn().mockResolvedValue(undefined),
    updateSessionWithScope: vi.fn(),
    updateSession: vi.fn(),
    workouts: [],
  }),
}))

vi.mock('../hooks/useScheduleNavigation', () => ({
  useScheduleNavigation: () => ({
    currentDate: new Date(),
    setCurrentDate: vi.fn(),
    view: 'week' as const,
    setView: vi.fn(),
    handlePrevious: vi.fn(),
    handleNext: vi.fn(),
    handleToday: vi.fn(),
    getHeaderText: () => 'March 10 - 16, 2025',
    stats: { total: 1, completed: 0, pending: 1 },
    rangeSessions: mockSessions,
  }),
}))

vi.mock('../hooks/useScheduleDragDrop', () => ({
  useScheduleDragDrop: () => ({
    handleDragStart: vi.fn(),
    handleDrop: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragEnd: vi.fn(),
    setDragOverId: vi.fn(),
    draggedItemId: null,
    dragOverId: null,
  }),
}))

vi.mock('../components/organisms/schedule/DayView', () => ({
  DayView: () => <div data-testid="day-view" />,
}))

vi.mock('../components/organisms/schedule/WeekView', () => ({
  WeekView: () => <div data-testid="week-view" />,
}))

vi.mock('../components/organisms/schedule/MonthView', () => ({
  MonthView: () => <div data-testid="month-view" />,
}))

vi.mock('../components/organisms/schedule/SessionEditorModal', () => ({
  SessionEditorModal: ({ isOpen }: any) => isOpen ? <div data-testid="session-editor" /> : null,
}))

vi.mock('../components/organisms/schedule/SessionDetailsModal', () => ({
  SessionDetailsModal: () => <div data-testid="session-details" />,
}))

vi.mock('../components/organisms/schedule/OverviewModal', () => ({
  OverviewModal: ({ isOpen }: any) => isOpen ? <div data-testid="overview-modal" /> : null,
}))

describe('Schedule', () => {
  beforeEach(() => { vi.clearAllMocks() })

  const renderPage = () => render(<MemoryRouter><Schedule /></MemoryRouter>)

  it('renders page title', () => {
    renderPage()
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('renders header text from navigation hook', () => {
    renderPage()
    expect(screen.getAllByText('March 10 - 16, 2025').length).toBeGreaterThanOrEqual(1)
  })

  it('renders add session button', () => {
    renderPage()
    expect(screen.getByText('addSession')).toBeInTheDocument()
  })

  it('renders week view by default', () => {
    renderPage()
    expect(screen.getByTestId('week-view')).toBeInTheDocument()
  })

  it('renders today button', () => {
    renderPage()
    expect(screen.getByText('today')).toBeInTheDocument()
  })

  it('opens session editor when add button clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText('addSession'))
    expect(screen.getByTestId('session-editor')).toBeInTheDocument()
  })

  it('displays stats', () => {
    renderPage()
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1)
  })
})
