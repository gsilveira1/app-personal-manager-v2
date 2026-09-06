import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { WorkHoursEditor } from './WorkHoursEditor'
import type { WorkHoursConfig } from '../../../types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'pt-BR' },
  }),
}))

const mockUpdateWorkHours = vi.fn().mockResolvedValue(undefined)

const initialWorkHours: WorkHoursConfig = {
  monday: { enabled: true, start: '07:00', end: '19:00' },
  tuesday: { enabled: true, start: '07:00', end: '19:00' },
  wednesday: { enabled: true, start: '07:00', end: '19:00' },
  thursday: { enabled: true, start: '07:00', end: '19:00' },
  friday: { enabled: true, start: '07:00', end: '19:00' },
  saturday: { enabled: true, start: '08:00', end: '14:00' },
  sunday: { enabled: false, start: '08:00', end: '12:00' },
  slotDurationMinutes: 60,
}

let storeWorkHours = { ...initialWorkHours }

vi.mock('../../../states/stores/store', () => ({
  useStore: () => ({
    workHours: storeWorkHours,
    updateWorkHours: mockUpdateWorkHours,
  }),
}))

describe('WorkHoursEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    storeWorkHours = { ...initialWorkHours }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders all 7 days with their initial start/end times and enabled status', () => {
    render(<WorkHoursEditor />)

    // Check weekday labels
    expect(screen.getByText('Segunda')).toBeInTheDocument()
    expect(screen.getByText('Terça')).toBeInTheDocument()
    expect(screen.getByText('Quarta')).toBeInTheDocument()
    expect(screen.getByText('Quinta')).toBeInTheDocument()
    expect(screen.getByText('Sexta')).toBeInTheDocument()
    expect(screen.getByText('Sábado')).toBeInTheDocument()
    expect(screen.getByText('Domingo')).toBeInTheDocument()

    // Check all checkboxes
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(7)
    expect(checkboxes[0]).toBeChecked() // Monday
    expect(checkboxes[5]).toBeChecked() // Saturday
    expect(checkboxes[6]).not.toBeChecked() // Sunday

    // Sunday time inputs should be disabled
    const timeInputs = screen.getAllByDisplayValue(/^(07:00|19:00|08:00|14:00|12:00)$/)
    expect(timeInputs.length).toBeGreaterThan(0)

    // Sunday start and end inputs (last 2 time inputs)
    const allInputs = document.querySelectorAll('input[type="time"]')
    expect(allInputs).toHaveLength(14)
    expect(allInputs[12]).toBeDisabled() // Sunday start (08:00)
    expect(allInputs[13]).toBeDisabled() // Sunday end (12:00)
    expect(allInputs[0]).not.toBeDisabled() // Monday start
  })

  it('toggles a day enabled/disabled checkbox and triggers auto-save', async () => {
    render(<WorkHoursEditor />)

    const checkboxes = screen.getAllByRole('checkbox')
    const sundayCheckbox = checkboxes[6]
    expect(sundayCheckbox).not.toBeChecked()

    // Toggle Sunday to enabled
    act(() => {
      fireEvent.click(sundayCheckbox)
    })
    expect(sundayCheckbox).toBeChecked()

    // Advance debouncing timer
    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(mockUpdateWorkHours).toHaveBeenCalledWith({
      ...initialWorkHours,
      sunday: { enabled: true, start: '08:00', end: '12:00' },
    })
  })

  it('changes start and end time inputs and triggers auto-save', async () => {
    render(<WorkHoursEditor />)

    const allTimeInputs = document.querySelectorAll('input[type="time"]')
    const mondayStart = allTimeInputs[0]
    const mondayEnd = allTimeInputs[1]

    act(() => {
      fireEvent.change(mondayStart, { target: { value: '08:30' } })
      fireEvent.change(mondayEnd, { target: { value: '20:30' } })
    })

    expect(mondayStart).toHaveValue('08:30')
    expect(mondayEnd).toHaveValue('20:30')

    // Advance debouncing timer
    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(mockUpdateWorkHours).toHaveBeenCalledWith({
      ...initialWorkHours,
      monday: { enabled: true, start: '08:30', end: '20:30' },
    })
  })

  it('updates slot duration dropdown and triggers auto-save', async () => {
    render(<WorkHoursEditor />)

    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('60')

    act(() => {
      fireEvent.change(select, { target: { value: '45' } })
    })

    expect(select).toHaveValue('45')

    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(mockUpdateWorkHours).toHaveBeenCalledWith({
      ...initialWorkHours,
      slotDurationMinutes: 45,
    })
  })

  it('debounces rapid changes so updateWorkHours is called only once', async () => {
    render(<WorkHoursEditor />)

    const select = screen.getByRole('combobox')
    const checkboxes = screen.getAllByRole('checkbox')

    act(() => {
      fireEvent.change(select, { target: { value: '30' } })
      vi.advanceTimersByTime(400) // Halfway through debounce
      fireEvent.click(checkboxes[0]) // Toggle Monday
      vi.advanceTimersByTime(400) // Halfway again
      fireEvent.change(select, { target: { value: '90' } }) // Change slot again
    })

    expect(mockUpdateWorkHours).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(800) // Complete final debounce
    })

    expect(mockUpdateWorkHours).toHaveBeenCalledTimes(1)
    expect(mockUpdateWorkHours).toHaveBeenCalledWith({
      ...initialWorkHours,
      monday: { enabled: false, start: '07:00', end: '19:00' },
      slotDurationMinutes: 90,
    })
  })

  it('handles errors when updateWorkHours rejects', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockUpdateWorkHours.mockRejectedValueOnce(new Error('Save error'))

    render(<WorkHoursEditor />)

    const select = screen.getByRole('combobox')
    act(() => {
      fireEvent.change(select, { target: { value: '45' } })
    })

    await act(async () => {
      vi.advanceTimersByTime(800)
    })

    expect(consoleSpy).toHaveBeenCalledWith('Failed to save work hours:', expect.any(Error))
    consoleSpy.mockRestore()
  })
})
