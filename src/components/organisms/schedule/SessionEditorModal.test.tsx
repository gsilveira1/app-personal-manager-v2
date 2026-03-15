import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: any) => (opts?.ns ? `${opts.ns}.${key}` : key) }),
}))

vi.mock('../../../utils/dateLocale', () => ({
  formatLocalized: (_date: unknown, fmt: string) => `formatted-${fmt}`,
}))

vi.mock('../../../utils/rruleHelpers', () => ({
  WEEKDAYS: [
    { label: 'Mon', rruleDay: 'MO' },
    { label: 'Tue', rruleDay: 'TU' },
    { label: 'Wed', rruleDay: 'WE' },
    { label: 'Thu', rruleDay: 'TH' },
    { label: 'Fri', rruleDay: 'FR' },
    { label: 'Sat', rruleDay: 'SA' },
    { label: 'Sun', rruleDay: 'SU' },
  ],
  buildRrule: vi.fn().mockReturnValue('FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;COUNT=12'),
  rruleHumanText: vi.fn().mockReturnValue('Every week on MO, 12 times'),
}))

vi.mock('../../../utils/scheduleUtils', () => ({
  isTimeSlotTaken: vi.fn().mockReturnValue(null),
}))

import { SessionEditorModal } from './SessionEditorModal'

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

const mockOnClose = vi.fn()
const mockOnSaveNew = vi.fn()
const mockOnSaveRecurring = vi.fn()
const mockOnSaveRecurringEvent = vi.fn()
const mockOnUpdate = vi.fn()

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSaveNew: mockOnSaveNew,
  onSaveRecurring: mockOnSaveRecurring,
  onSaveRecurringEvent: mockOnSaveRecurringEvent,
  onUpdate: mockOnUpdate,
  sessionToEdit: null,
  clients: [makeClient(), makeClient({ id: 'c2', name: 'Jane Smith', type: 'Online' })],
  sessions: [],
  initialDate: new Date(2026, 2, 15, 10, 0), // March 15, 2026 at 10:00
}

describe('SessionEditorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal when isOpen=true', () => {
    render(<SessionEditorModal {...defaultProps} />)
    expect(screen.getByText('newSession')).toBeInTheDocument()
  })

  it('returns null when isOpen=false', () => {
    const { container } = render(<SessionEditorModal {...defaultProps} isOpen={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders client selector with active clients', () => {
    render(<SessionEditorModal {...defaultProps} />)
    expect(screen.getByText('client')).toBeInTheDocument()
    // Both clients should appear in the select
    expect(screen.getByText('John Doe (In-Person)')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith (Online)')).toBeInTheDocument()
  })

  it('renders date and time inputs', () => {
    render(<SessionEditorModal {...defaultProps} />)
    expect(screen.getByText('date')).toBeInTheDocument()
    expect(screen.getByText('time')).toBeInTheDocument()

    // Check date input has initial value
    const dateInput = screen.getByDisplayValue('2026-03-15')
    expect(dateInput).toBeInTheDocument()

    // Check time input has initial value
    const timeInput = screen.getByDisplayValue('10:00')
    expect(timeInput).toBeInTheDocument()
  })

  it('renders duration selector', () => {
    render(<SessionEditorModal {...defaultProps} />)
    expect(screen.getByText('duration')).toBeInTheDocument()
  })

  it('form submission calls onSaveNew for a new non-recurring session', () => {
    render(<SessionEditorModal {...defaultProps} />)

    const form = screen.getByText('common.save').closest('form')
    fireEvent.submit(form!)

    expect(mockOnSaveNew).toHaveBeenCalledTimes(1)
    const savedSession = mockOnSaveNew.mock.calls[0][0]
    expect(savedSession.clientId).toBe('c1')
    expect(savedSession.durationMinutes).toBe(60)
    expect(savedSession.type).toBe('In-Person')
    expect(savedSession.category).toBe('Workout')
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('cancel button calls onClose', () => {
    render(<SessionEditorModal {...defaultProps} />)
    fireEvent.click(screen.getByText('common.cancel'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('edit mode populates fields from sessionToEdit', () => {
    const sessionToEdit = {
      id: 's1',
      clientId: 'c2',
      date: new Date(2026, 2, 20, 14, 30).toISOString(),
      durationMinutes: 45,
      type: 'Online',
      category: 'Check-in',
      completed: false,
      notes: 'Focus on form',
      linkedWorkoutId: '',
    }

    render(<SessionEditorModal {...defaultProps} sessionToEdit={sessionToEdit} />)

    expect(screen.getByText('editSession')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-03-20')).toBeInTheDocument()
    expect(screen.getByDisplayValue('14:30')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Focus on form')).toBeInTheDocument()
  })

  it('shows notes input field', () => {
    render(<SessionEditorModal {...defaultProps} />)
    expect(screen.getByText('notes')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('sessionNotesPlaceholder')).toBeInTheDocument()
  })

  it('shows recurrence toggle for new sessions', () => {
    render(<SessionEditorModal {...defaultProps} />)
    expect(screen.getByText('makeRecurring')).toBeInTheDocument()
  })

  it('hides recurrence toggle when editing existing session', () => {
    const sessionToEdit = {
      id: 's1',
      clientId: 'c1',
      date: new Date(2026, 2, 15, 10, 0).toISOString(),
      durationMinutes: 60,
      type: 'In-Person',
      category: 'Workout',
      completed: false,
      notes: '',
      linkedWorkoutId: '',
    }

    render(<SessionEditorModal {...defaultProps} sessionToEdit={sessionToEdit} />)
    expect(screen.queryByText('makeRecurring')).not.toBeInTheDocument()
  })

  it('submits update for non-recurring edit', () => {
    const sessionToEdit = {
      id: 's1',
      clientId: 'c1',
      date: new Date(2026, 2, 15, 10, 0).toISOString(),
      durationMinutes: 60,
      type: 'In-Person',
      category: 'Workout',
      completed: false,
      notes: '',
      linkedWorkoutId: '',
    }

    render(<SessionEditorModal {...defaultProps} sessionToEdit={sessionToEdit} />)

    const form = screen.getByText('common.save').closest('form')
    fireEvent.submit(form!)

    expect(mockOnUpdate).toHaveBeenCalledTimes(1)
    expect(mockOnUpdate).toHaveBeenCalledWith('s1', expect.objectContaining({ clientId: 'c1' }), 'single')
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('enables recurrence and shows RRULE builder when toggle is checked', async () => {
    const user = userEvent.setup()
    render(<SessionEditorModal {...defaultProps} />)

    // Find and click the recurrence checkbox
    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    // RRULE builder should now be visible
    expect(screen.getByText('frequency')).toBeInTheDocument()
    expect(screen.getByText('every')).toBeInTheDocument()
    expect(screen.getByText('ends')).toBeInTheDocument()
    expect(screen.getByText('onDays')).toBeInTheDocument()

    // Weekday buttons should be visible
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Tue')).toBeInTheDocument()
    expect(screen.getByText('Fri')).toBeInTheDocument()

    // Human-readable preview should be visible
    expect(screen.getByText('Every week on MO, 12 times')).toBeInTheDocument()
  })

  it('submits a recurring session with RRULE via onSaveRecurringEvent', async () => {
    const user = userEvent.setup()
    const { buildRrule } = await import('../../../utils/rruleHelpers')
    render(<SessionEditorModal {...defaultProps} />)

    // Enable recurrence
    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    // Submit the form
    const form = screen.getByText('common.save').closest('form')
    fireEvent.submit(form!)

    expect(buildRrule).toHaveBeenCalled()
    expect(mockOnSaveRecurringEvent).toHaveBeenCalledTimes(1)
    expect(mockOnSaveRecurringEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        rrule: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;COUNT=12',
        clientId: 'c1',
        type: 'In-Person',
        category: 'Workout',
      })
    )
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('toggles weekday buttons in RRULE builder', async () => {
    const user = userEvent.setup()
    render(<SessionEditorModal {...defaultProps} />)

    // Enable recurrence
    await user.click(screen.getByRole('checkbox'))

    // Click a day button to toggle it
    const tuesdayBtn = screen.getByText('Tue')
    await user.click(tuesdayBtn)

    // Click it again to deselect
    await user.click(tuesdayBtn)

    // The builder should still be visible and functional
    expect(screen.getByText('Tue')).toBeInTheDocument()
  })

  it('switches end type between count and until', async () => {
    const user = userEvent.setup()
    render(<SessionEditorModal {...defaultProps} />)

    // Enable recurrence
    await user.click(screen.getByRole('checkbox'))

    // Default should be count — check occurrences text is visible
    expect(screen.getByText('occurrences')).toBeInTheDocument()

    // Switch to "until" (onDate)
    await user.click(screen.getByText('onDate'))

    // occurrences text should no longer be visible, date input should appear
    expect(screen.queryByText('occurrences')).not.toBeInTheDocument()

    // Switch back to count
    await user.click(screen.getByText('after'))
    expect(screen.getByText('occurrences')).toBeInTheDocument()
  })

  it('changes frequency to DAILY and hides day-of-week selector', async () => {
    const user = userEvent.setup()
    render(<SessionEditorModal {...defaultProps} />)

    // Enable recurrence
    await user.click(screen.getByRole('checkbox'))

    // Should show onDays by default (WEEKLY)
    expect(screen.getByText('onDays')).toBeInTheDocument()

    // Change frequency to DAILY
    const freqSelect = screen.getByDisplayValue('weekly')
    await user.selectOptions(freqSelect, 'DAILY')

    // Day-of-week selector should be hidden for DAILY
    expect(screen.queryByText('onDays')).not.toBeInTheDocument()
    // Interval label should show days
    expect(screen.getByText('intervalDays')).toBeInTheDocument()
  })

  it('shows time conflict error when slot is taken', async () => {
    const { isTimeSlotTaken } = await import('../../../utils/scheduleUtils')
    const mockedIsTimeSlotTaken = vi.mocked(isTimeSlotTaken)
    mockedIsTimeSlotTaken.mockReturnValue({
      id: 'conflict-s1',
      clientId: 'c1',
      date: new Date(2026, 2, 15, 10, 0).toISOString(),
      durationMinutes: 60,
      type: 'In-Person',
      category: 'Workout',
      completed: false,
    } as any)

    render(<SessionEditorModal {...defaultProps} />)

    const form = screen.getByText('common.save').closest('form')
    fireEvent.submit(form!)

    // Error message should be displayed
    expect(screen.getByText(/timeConflict/)).toBeInTheDocument()
    // Should NOT call onSaveNew
    expect(mockOnSaveNew).not.toHaveBeenCalled()

    mockedIsTimeSlotTaken.mockReturnValue(null)
  })

  it('shows RecurrenceUpdateModal when editing a recurring session with date change', async () => {
    const user = userEvent.setup()
    const sessionToEdit = {
      id: 's1',
      clientId: 'c1',
      date: new Date(2026, 2, 15, 10, 0).toISOString(),
      durationMinutes: 60,
      type: 'In-Person',
      category: 'Workout',
      completed: false,
      notes: '',
      linkedWorkoutId: '',
      recurrenceId: 'rec-1',
    }

    render(<SessionEditorModal {...defaultProps} sessionToEdit={sessionToEdit} />)

    // Change the date to trigger recurrence prompt
    const dateInput = screen.getByDisplayValue('2026-03-15')
    fireEvent.change(dateInput, { target: { value: '2026-03-20', name: 'date' } })

    // Submit the form
    const form = screen.getByText('common.save').closest('form')
    fireEvent.submit(form!)

    // RecurrenceUpdateModal should now be visible
    expect(screen.getByText('editRecurring')).toBeInTheDocument()
    expect(screen.getByText('recurrenceUpdateMessage')).toBeInTheDocument()
    expect(screen.getByText('thisAndFuture')).toBeInTheDocument()
    expect(screen.getByText('onlyThis')).toBeInTheDocument()
  })

  it('RecurrenceUpdateModal confirms with "future" scope', async () => {
    const user = userEvent.setup()
    const sessionToEdit = {
      id: 's1',
      clientId: 'c1',
      date: new Date(2026, 2, 15, 10, 0).toISOString(),
      durationMinutes: 60,
      type: 'In-Person',
      category: 'Workout',
      completed: false,
      notes: '',
      linkedWorkoutId: '',
      recurringEventId: 'rev-1',
    }

    render(<SessionEditorModal {...defaultProps} sessionToEdit={sessionToEdit} />)

    // Change date
    fireEvent.change(screen.getByDisplayValue('2026-03-15'), { target: { value: '2026-03-22', name: 'date' } })

    // Submit
    fireEvent.submit(screen.getByText('common.save').closest('form')!)

    // Click "this and future"
    await user.click(screen.getByText('thisAndFuture'))

    expect(mockOnUpdate).toHaveBeenCalledWith('s1', expect.objectContaining({ clientId: 'c1' }), 'future')
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('RecurrenceUpdateModal confirms with "single" scope', async () => {
    const user = userEvent.setup()
    const sessionToEdit = {
      id: 's1',
      clientId: 'c1',
      date: new Date(2026, 2, 15, 10, 0).toISOString(),
      durationMinutes: 60,
      type: 'In-Person',
      category: 'Workout',
      completed: false,
      notes: '',
      linkedWorkoutId: '',
      recurrenceId: 'rec-1',
    }

    render(<SessionEditorModal {...defaultProps} sessionToEdit={sessionToEdit} />)

    fireEvent.change(screen.getByDisplayValue('2026-03-15'), { target: { value: '2026-03-22', name: 'date' } })
    fireEvent.submit(screen.getByText('common.save').closest('form')!)

    await user.click(screen.getByText('onlyThis'))

    expect(mockOnUpdate).toHaveBeenCalledWith('s1', expect.objectContaining({ clientId: 'c1' }), 'single')
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('RecurrenceUpdateModal cancel closes the prompt', async () => {
    const user = userEvent.setup()
    const sessionToEdit = {
      id: 's1',
      clientId: 'c1',
      date: new Date(2026, 2, 15, 10, 0).toISOString(),
      durationMinutes: 60,
      type: 'In-Person',
      category: 'Workout',
      completed: false,
      notes: '',
      linkedWorkoutId: '',
      recurrenceId: 'rec-1',
    }

    render(<SessionEditorModal {...defaultProps} sessionToEdit={sessionToEdit} />)

    fireEvent.change(screen.getByDisplayValue('2026-03-15'), { target: { value: '2026-03-22', name: 'date' } })
    fireEvent.submit(screen.getByText('common.save').closest('form')!)

    // RecurrenceUpdateModal should be visible
    expect(screen.getByText('editRecurring')).toBeInTheDocument()

    // Click cancel in RecurrenceUpdateModal (its cancel button renders as just 'cancel')
    const cancelBtn = screen.getByText('cancel')
    await user.click(cancelBtn)

    // The recurrence prompt should be closed
    await waitFor(() => {
      expect(screen.queryByText('editRecurring')).not.toBeInTheDocument()
    })
    // onUpdate should NOT have been called
    expect(mockOnUpdate).not.toHaveBeenCalled()
  })

  it('changes interval value in RRULE builder', async () => {
    const user = userEvent.setup()
    render(<SessionEditorModal {...defaultProps} />)

    await user.click(screen.getByRole('checkbox'))

    const intervalInput = screen.getByDisplayValue('1')
    fireEvent.change(intervalInput, { target: { value: '2' } })
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()
  })

  it('changes count value in RRULE builder', async () => {
    const user = userEvent.setup()
    render(<SessionEditorModal {...defaultProps} />)

    await user.click(screen.getByRole('checkbox'))

    const countInput = screen.getByDisplayValue('12')
    fireEvent.change(countInput, { target: { value: '24' } })
    expect(screen.getByDisplayValue('24')).toBeInTheDocument()
  })

  it('sets Online type and Check-in category for Online client', () => {
    const onlineClients = [makeClient({ id: 'c2', name: 'Jane Smith', type: 'Online', status: 'Active' })]
    render(<SessionEditorModal {...defaultProps} clients={onlineClients} />)

    const form = screen.getByText('common.save').closest('form')
    fireEvent.submit(form!)

    expect(mockOnSaveNew).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'Online',
        category: 'Check-in',
      })
    )
  })
})
