import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { startOfWeek, startOfMonth } from 'date-fns'

// ---- Mocks ----

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../../../utils/dateLocale', () => ({
  formatLocalized: (_date: unknown, fmt: string) => `formatted-${fmt}`,
}))

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

// ---- Test data factories ----

const makeSession = (overrides: Record<string, unknown> = {}) => ({
  id: 's1',
  clientId: 'c1',
  date: new Date(2026, 2, 15, 10, 0).toISOString(),
  durationMinutes: 60,
  type: 'In-Person',
  category: 'Workout',
  completed: false,
  notes: '',
  ...overrides,
})

const makeClient = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  name: 'John Doe',
  email: 'john@test.com',
  phone: '555-1234',
  status: 'Active',
  type: 'In-Person',
  avatar: null,
  ...overrides,
})

const makeWorkout = (overrides: Record<string, unknown> = {}) => ({
  id: 'w1',
  title: 'Upper Body A',
  exercises: [{ name: 'Bench Press', sets: 3, reps: '10' }],
  tags: [],
  createdAt: '2026-01-01',
  ...overrides,
})

const makeDragHandlers = () => ({
  handleDragStart: vi.fn(),
  handleDrop: vi.fn(),
  handleDragOver: vi.fn(),
  handleDragEnd: vi.fn(),
  setDragOverId: vi.fn(),
  draggedItemId: null,
  dragOverId: null,
})

// ===============================
// SessionCard
// ===============================

describe('SessionCard', () => {
  let SessionCard: any

  beforeEach(async () => {
    const mod = await import('./SessionCard')
    SessionCard = mod.SessionCard
  })

  it('renders client name, duration, and type', () => {
    const session = makeSession()
    render(<SessionCard session={session} client={makeClient()} onClick={vi.fn()} onToggle={vi.fn()} onDragStart={vi.fn()} onDragEnd={vi.fn()} isDragged={false} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('60 min')).toBeInTheDocument()
    expect(screen.getByText('inPerson')).toBeInTheDocument()
  })

  it('renders formatted time via formatLocalized', () => {
    render(<SessionCard session={makeSession()} client={makeClient()} onClick={vi.fn()} onToggle={vi.fn()} onDragStart={vi.fn()} onDragEnd={vi.fn()} isDragged={false} />)

    expect(screen.getByText('formatted-h:mm a')).toBeInTheDocument()
  })

  it('shows completed text when session is completed', () => {
    render(<SessionCard session={makeSession({ completed: true })} client={makeClient()} onClick={vi.fn()} onToggle={vi.fn()} onDragStart={vi.fn()} onDragEnd={vi.fn()} isDragged={false} />)

    expect(screen.getByText('completed')).toBeInTheDocument()
  })

  it('shows markComplete text when session is pending', () => {
    render(<SessionCard session={makeSession({ completed: false })} client={makeClient()} onClick={vi.fn()} onToggle={vi.fn()} onDragStart={vi.fn()} onDragEnd={vi.fn()} isDragged={false} />)

    expect(screen.getByText('markComplete')).toBeInTheDocument()
  })

  it('calls onToggle on complete button click, stopping propagation', () => {
    const onToggle = vi.fn()
    const onClick = vi.fn()
    render(<SessionCard session={makeSession()} client={makeClient()} onClick={onClick} onToggle={onToggle} onDragStart={vi.fn()} onDragEnd={vi.fn()} isDragged={false} />)

    fireEvent.click(screen.getByText('markComplete'))
    expect(onToggle).toHaveBeenCalledWith('s1')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('calls onClick when card body is clicked', () => {
    const onClick = vi.fn()
    render(<SessionCard session={makeSession()} client={makeClient()} onClick={onClick} onToggle={vi.fn()} onDragStart={vi.fn()} onDragEnd={vi.fn()} isDragged={false} />)

    fireEvent.click(screen.getByText('John Doe'))
    expect(onClick).toHaveBeenCalled()
  })

  it('renders recurring icon when recurrenceId is present', () => {
    render(<SessionCard session={makeSession({ recurrenceId: 'rec-1' })} client={makeClient()} onClick={vi.fn()} onToggle={vi.fn()} onDragStart={vi.fn()} onDragEnd={vi.fn()} isDragged={false} />)

    expect(screen.getByTitle('recurringSession')).toBeInTheDocument()
  })

  it('does not render recurring icon when recurrenceId is absent', () => {
    render(
      <SessionCard session={makeSession({ recurrenceId: undefined })} client={makeClient()} onClick={vi.fn()} onToggle={vi.fn()} onDragStart={vi.fn()} onDragEnd={vi.fn()} isDragged={false} />,
    )

    expect(screen.queryByTitle('recurringSession')).not.toBeInTheDocument()
  })

  it('shows unknownClient when client is null', () => {
    render(<SessionCard session={makeSession()} client={null} onClick={vi.fn()} onToggle={vi.fn()} onDragStart={vi.fn()} onDragEnd={vi.fn()} isDragged={false} />)

    expect(screen.getByText('unknownClient')).toBeInTheDocument()
  })

  it('renders Check-in category badge with purple styling', () => {
    const { container } = render(
      <SessionCard session={makeSession({ category: 'Check-in' })} client={makeClient()} onClick={vi.fn()} onToggle={vi.fn()} onDragStart={vi.fn()} onDragEnd={vi.fn()} isDragged={false} />,
    )

    expect(container.querySelector('.bg-purple-100')).toBeInTheDocument()
  })

  it('applies dragged opacity when isDragged is true', () => {
    const { container } = render(
      <SessionCard session={makeSession()} client={makeClient()} onClick={vi.fn()} onToggle={vi.fn()} onDragStart={vi.fn()} onDragEnd={vi.fn()} isDragged={true} />,
    )

    expect(container.firstChild).toHaveClass('opacity-50')
  })

  it('renders Online type text', () => {
    render(<SessionCard session={makeSession({ type: 'Online' })} client={makeClient()} onClick={vi.fn()} onToggle={vi.fn()} onDragStart={vi.fn()} onDragEnd={vi.fn()} isDragged={false} />)

    expect(screen.getByText('online')).toBeInTheDocument()
  })
})

// ===============================
// DayView
// ===============================

describe('DayView', () => {
  let DayView: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./DayView')
    DayView = mod.DayView
  })

  const testDate = new Date(2026, 2, 15)

  it('renders 17 hour slots (6am to 10pm)', () => {
    const { container } = render(
      <DayView date={testDate} sessions={[]} clients={[]} onSessionClick={vi.fn()} onToggleComplete={vi.fn()} onAreaClick={vi.fn()} dragHandlers={makeDragHandlers()} />,
    )

    // Each hour slot has a time label with formatted-h:00 a text
    const timeLabels = screen.getAllByText('formatted-h:00 a')
    expect(timeLabels).toHaveLength(17)
  })

  it('places session in correct hour slot', () => {
    const session = makeSession({ date: new Date(2026, 2, 15, 10, 0).toISOString() })

    render(
      <DayView date={testDate} sessions={[session]} clients={[makeClient()]} onSessionClick={vi.fn()} onToggleComplete={vi.fn()} onAreaClick={vi.fn()} dragHandlers={makeDragHandlers()} />,
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('does not render session from different day', () => {
    const session = makeSession({ date: new Date(2026, 2, 16, 10, 0).toISOString() })

    render(
      <DayView date={testDate} sessions={[session]} clients={[makeClient()]} onSessionClick={vi.fn()} onToggleComplete={vi.fn()} onAreaClick={vi.fn()} dragHandlers={makeDragHandlers()} />,
    )

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })

  it('calls onSessionClick when a session card is clicked', () => {
    const onSessionClick = vi.fn()
    const session = makeSession({ date: new Date(2026, 2, 15, 10, 0).toISOString() })

    render(
      <DayView
        date={testDate}
        sessions={[session]}
        clients={[makeClient()]}
        onSessionClick={onSessionClick}
        onToggleComplete={vi.fn()}
        onAreaClick={vi.fn()}
        dragHandlers={makeDragHandlers()}
      />,
    )

    fireEvent.click(screen.getByText('John Doe'))
    expect(onSessionClick).toHaveBeenCalledWith(session)
  })

  it('calls onAreaClick when empty slot is clicked', () => {
    const onAreaClick = vi.fn()

    render(
      <DayView date={testDate} sessions={[]} clients={[]} onSessionClick={vi.fn()} onToggleComplete={vi.fn()} onAreaClick={onAreaClick} dragHandlers={makeDragHandlers()} />,
    )

    const addButtons = screen.getAllByText('addShort')
    fireEvent.click(addButtons[0])
    expect(onAreaClick).toHaveBeenCalled()
  })
})

// ===============================
// WeekView
// ===============================

describe('WeekView', () => {
  let WeekView: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./WeekView')
    WeekView = mod.WeekView
  })

  const testDate = new Date(2026, 2, 15)

  it('renders 7 day rows', () => {
    render(<WeekView date={testDate} sessions={[]} clients={[]} onSessionClick={vi.fn()} onToggleComplete={vi.fn()} onAreaClick={vi.fn()} dragHandlers={makeDragHandlers()} />)

    const dayLabels = screen.getAllByText('formatted-EEE')
    expect(dayLabels).toHaveLength(7)
  })

  it('highlights today with indigo background', () => {
    const today = new Date()
    const { container } = render(
      <WeekView date={today} sessions={[]} clients={[]} onSessionClick={vi.fn()} onToggleComplete={vi.fn()} onAreaClick={vi.fn()} dragHandlers={makeDragHandlers()} />,
    )

    expect(container.querySelector('.bg-indigo-600')).toBeInTheDocument()
  })

  it('renders sessions for a given day', () => {
    const weekStart = startOfWeek(testDate, { weekStartsOn: 1 })
    const session = makeSession({ date: weekStart.toISOString() })

    render(
      <WeekView date={testDate} sessions={[session]} clients={[makeClient()]} onSessionClick={vi.fn()} onToggleComplete={vi.fn()} onAreaClick={vi.fn()} dragHandlers={makeDragHandlers()} />,
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('shows empty placeholder for days without sessions', () => {
    render(<WeekView date={testDate} sessions={[]} clients={[]} onSessionClick={vi.fn()} onToggleComplete={vi.fn()} onAreaClick={vi.fn()} dragHandlers={makeDragHandlers()} />)

    const placeholders = screen.getAllByText('noSessionsClickToAdd')
    expect(placeholders).toHaveLength(7)
  })

  it('calls onAreaClick when empty placeholder is clicked', () => {
    const onAreaClick = vi.fn()

    render(<WeekView date={testDate} sessions={[]} clients={[]} onSessionClick={vi.fn()} onToggleComplete={vi.fn()} onAreaClick={onAreaClick} dragHandlers={makeDragHandlers()} />)

    fireEvent.click(screen.getAllByText('noSessionsClickToAdd')[0])
    expect(onAreaClick).toHaveBeenCalled()
  })
})

// ===============================
// MonthView
// ===============================

describe('MonthView', () => {
  let MonthView: any

  beforeEach(async () => {
    const mod = await import('./MonthView')
    MonthView = mod.MonthView
  })

  const testDate = new Date(2026, 2, 1)

  it('renders 7-column weekday header', () => {
    render(<MonthView date={testDate} sessions={[]} clients={[]} onDayClick={vi.fn()} />)

    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Tue')).toBeInTheDocument()
    expect(screen.getByText('Wed')).toBeInTheDocument()
    expect(screen.getByText('Thu')).toBeInTheDocument()
    expect(screen.getByText('Fri')).toBeInTheDocument()
    expect(screen.getByText('Sat')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
  })

  it('renders calendar grid with day numbers', () => {
    render(<MonthView date={testDate} sessions={[]} clients={[]} onDayClick={vi.fn()} />)

    // Use getAllByText since day numbers can appear in prev/next month overlap
    expect(screen.getAllByText('15').length).toBeGreaterThan(0)
    expect(screen.getAllByText('31').length).toBeGreaterThan(0)
  })

  it('highlights today with indigo background', () => {
    const today = new Date()
    const thisMonth = startOfMonth(today)
    const { container } = render(<MonthView date={thisMonth} sessions={[]} clients={[]} onDayClick={vi.fn()} />)

    expect(container.querySelector('.bg-indigo-600.text-white')).toBeInTheDocument()
  })

  it('calls onDayClick when a day cell is clicked', () => {
    const onDayClick = vi.fn()
    render(<MonthView date={testDate} sessions={[]} clients={[]} onDayClick={onDayClick} />)

    fireEvent.click(screen.getByText('15'))
    expect(onDayClick).toHaveBeenCalled()
  })

  it('renders session dots for days with sessions', () => {
    const session = makeSession({ date: new Date(2026, 2, 15, 10, 0).toISOString() })

    const { container } = render(<MonthView date={testDate} sessions={[session]} clients={[makeClient()]} onDayClick={vi.fn()} />)

    expect(container.querySelectorAll('.bg-indigo-500').length).toBeGreaterThan(0)
  })

  it('renders completed session dots in green', () => {
    const session = makeSession({ date: new Date(2026, 2, 15, 10, 0).toISOString(), completed: true })

    const { container } = render(<MonthView date={testDate} sessions={[session]} clients={[makeClient()]} onDayClick={vi.fn()} />)

    expect(container.querySelectorAll('.bg-green-500').length).toBeGreaterThan(0)
  })

  it('dims out-of-month days with subdued styling', () => {
    const { container } = render(<MonthView date={testDate} sessions={[]} clients={[]} onDayClick={vi.fn()} />)

    // Out-of-month day numbers get text-slate-400
    expect(container.querySelectorAll('.text-slate-400').length).toBeGreaterThan(0)
  })
})

// ===============================
// SessionDetailsModal
// ===============================

describe('SessionDetailsModal', () => {
  let SessionDetailsModal: any

  beforeEach(async () => {
    const mod = await import('./SessionDetailsModal')
    SessionDetailsModal = mod.SessionDetailsModal
  })

  const session = makeSession({ notes: 'Great session', category: 'Workout' })
  const clients = [makeClient()]
  const workouts = [makeWorkout()]

  it('renders client name and formatted date/time', () => {
    render(<SessionDetailsModal session={session} clients={clients} workouts={workouts} onClose={vi.fn()} onUpdate={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('formatted-MMM d, yyyy')).toBeInTheDocument()
    expect(screen.getByText('formatted-h:mm a')).toBeInTheDocument()
  })

  it('renders pending status for incomplete session', () => {
    render(<SessionDetailsModal session={session} clients={clients} workouts={workouts} onClose={vi.fn()} onUpdate={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('renders completed status for completed session', () => {
    const completedSession = makeSession({ completed: true, category: 'Workout' })
    render(<SessionDetailsModal session={completedSession} clients={clients} workouts={workouts} onClose={vi.fn()} onUpdate={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getAllByText('completed').length).toBeGreaterThan(0)
  })

  it('displays notes in textarea', () => {
    render(<SessionDetailsModal session={session} clients={clients} workouts={workouts} onClose={vi.fn()} onUpdate={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByPlaceholderText('recordPerformancePlaceholder')).toHaveValue('Great session')
  })

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn()
    render(<SessionDetailsModal session={session} clients={clients} workouts={workouts} onClose={onClose} onUpdate={vi.fn()} onEdit={vi.fn()} />)

    fireEvent.click(screen.getByText('cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onUpdate and onClose when save button is clicked', () => {
    const onUpdate = vi.fn()
    const onClose = vi.fn()
    render(<SessionDetailsModal session={session} clients={clients} workouts={workouts} onClose={onClose} onUpdate={onUpdate} onEdit={vi.fn()} />)

    fireEvent.click(screen.getByText('saveSession'))
    expect(onUpdate).toHaveBeenCalledWith('s1', { notes: 'Great session', linkedWorkoutId: undefined })
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onEdit and onClose when edit button is clicked', () => {
    const onEdit = vi.fn()
    const onClose = vi.fn()
    render(<SessionDetailsModal session={session} clients={clients} workouts={workouts} onClose={onClose} onUpdate={vi.fn()} onEdit={onEdit} />)

    fireEvent.click(screen.getByText('editSession'))
    expect(onEdit).toHaveBeenCalledWith(session)
    expect(onClose).toHaveBeenCalled()
  })

  it('renders workout selector for Workout category', () => {
    render(<SessionDetailsModal session={session} clients={clients} workouts={workouts} onClose={vi.fn()} onUpdate={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText('trainingPlan')).toBeInTheDocument()
    expect(screen.getByText('Upper Body A')).toBeInTheDocument()
  })

  it('does not render workout selector for Check-in category', () => {
    render(<SessionDetailsModal session={makeSession({ category: 'Check-in' })} clients={clients} workouts={workouts} onClose={vi.fn()} onUpdate={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.queryByText('trainingPlan')).not.toBeInTheDocument()
  })

  it('renders link to client profile', () => {
    render(<SessionDetailsModal session={session} clients={clients} workouts={workouts} onClose={vi.fn()} onUpdate={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/clients/c1')
  })
})

// ===============================
// OverviewModal
// ===============================

describe('OverviewModal', () => {
  let OverviewModal: any

  beforeEach(async () => {
    const mod = await import('./OverviewModal')
    OverviewModal = mod.OverviewModal
  })

  const sessions = [
    makeSession({ id: 's1', completed: false }),
    makeSession({ id: 's2', completed: true, date: new Date(2026, 2, 15, 14, 0).toISOString() }),
    makeSession({ id: 's3', completed: false, date: new Date(2026, 2, 15, 16, 0).toISOString() }),
  ]
  const clients = [makeClient()]
  const workouts = [makeWorkout()]

  it('returns null when isOpen is false', () => {
    const { container } = render(<OverviewModal isOpen={false} onClose={vi.fn()} sessions={sessions} clients={clients} headerText="March 2026" workouts={workouts} />)

    expect(container.firstChild).toBeNull()
  })

  it('renders when isOpen is true', () => {
    render(<OverviewModal isOpen={true} onClose={vi.fn()} sessions={sessions} clients={clients} headerText="March 2026" workouts={workouts} />)

    expect(screen.getByText('March 2026')).toBeInTheDocument()
  })

  it('renders three tab buttons', () => {
    render(<OverviewModal isOpen={true} onClose={vi.fn()} sessions={sessions} clients={clients} headerText="Overview" workouts={workouts} />)

    expect(screen.getByText('total')).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('shows correct badge counts', () => {
    render(<OverviewModal isOpen={true} onClose={vi.fn()} sessions={sessions} clients={clients} headerText="Overview" workouts={workouts} />)

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders all sessions in the total tab by default', () => {
    render(<OverviewModal isOpen={true} onClose={vi.fn()} sessions={sessions} clients={clients} headerText="Overview" workouts={workouts} />)

    expect(screen.getAllByText('John Doe')).toHaveLength(3)
  })

  it('filters to completed sessions when completed tab is clicked', async () => {
    render(<OverviewModal isOpen={true} onClose={vi.fn()} sessions={sessions} clients={clients} headerText="Overview" workouts={workouts} />)

    fireEvent.click(screen.getByText('completed'))

    await waitFor(() => {
      expect(screen.getAllByText('John Doe')).toHaveLength(1)
    })
  })

  it('filters to pending sessions when pending tab is clicked', async () => {
    render(<OverviewModal isOpen={true} onClose={vi.fn()} sessions={sessions} clients={clients} headerText="Overview" workouts={workouts} />)

    fireEvent.click(screen.getByText('pending'))

    await waitFor(() => {
      expect(screen.getAllByText('John Doe')).toHaveLength(2)
    })
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<OverviewModal isOpen={true} onClose={onClose} sessions={sessions} clients={clients} headerText="Overview" workouts={workouts} />)

    // Find the X button in the header
    const buttons = screen.getAllByRole('button')
    // The close button is the one with no text content other than the X icon
    const closeBtn = buttons.find((b) => !b.textContent?.trim() || b.textContent?.trim() === '')
    if (closeBtn) fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('shows session detail view when a session item is clicked', async () => {
    render(<OverviewModal isOpen={true} onClose={vi.fn()} sessions={sessions} clients={clients} headerText="Overview" workouts={workouts} />)

    const sessionItems = screen.getAllByText('John Doe')
    const clickableItem = sessionItems[0].closest('[class*="cursor-pointer"]')
    if (clickableItem) fireEvent.click(clickableItem)

    await waitFor(() => {
      expect(screen.getByText('backToList')).toBeInTheDocument()
    })
  })

  it('shows empty state when no sessions match filter', async () => {
    const completedOnly = [makeSession({ id: 's1', completed: true })]

    render(<OverviewModal isOpen={true} onClose={vi.fn()} sessions={completedOnly} clients={clients} headerText="Overview" workouts={workouts} />)

    fireEvent.click(screen.getByText('pending'))

    await waitFor(() => {
      expect(screen.getByText('noSessionsInCategory')).toBeInTheDocument()
    })
  })
})
