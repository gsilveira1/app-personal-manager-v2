import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScheduleNavigation } from './useScheduleNavigation'
import type { Session } from '../types'

vi.mock('../utils/dateLocale', () => ({
  formatLocalized: (_date: Date, fmt: string) => `formatted-${fmt}`,
}))

const NOW = new Date('2025-06-15T12:00:00.000Z') // A Sunday

function makeSession(overrides: Partial<Session> & { id: string; date: string }): Session {
  return {
    clientId: 'c1',
    durationMinutes: 60,
    type: 'In-Person',
    category: 'Workout',
    completed: false,
    ...overrides,
  }
}

describe('useScheduleNavigation', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    fetchMock = vi.fn().mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('defaults to week view', () => {
    const { result } = renderHook(() => useScheduleNavigation([], fetchMock))
    expect(result.current.view).toBe('week')
  })

  it('initializes currentDate to now', () => {
    const { result } = renderHook(() => useScheduleNavigation([], fetchMock))
    expect(result.current.currentDate.getTime()).toBe(NOW.getTime())
  })

  it('calls fetchSessionsForRange on mount', () => {
    renderHook(() => useScheduleNavigation([], fetchMock))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    // For week view, start should be Monday of the week
    const [start, end] = fetchMock.mock.calls[0]
    expect(start).toBeInstanceOf(Date)
    expect(end).toBeInstanceOf(Date)
  })

  describe('handlePrevious / handleNext for day view', () => {
    it('moves date by -1 day on handlePrevious', () => {
      const { result } = renderHook(() => useScheduleNavigation([], fetchMock))

      act(() => result.current.setView('day'))
      const dateBefore = result.current.currentDate

      act(() => result.current.handlePrevious())
      expect(result.current.currentDate.getDate()).toBe(dateBefore.getDate() - 1)
    })

    it('moves date by +1 day on handleNext', () => {
      const { result } = renderHook(() => useScheduleNavigation([], fetchMock))

      act(() => result.current.setView('day'))
      const dateBefore = result.current.currentDate

      act(() => result.current.handleNext())
      expect(result.current.currentDate.getDate()).toBe(dateBefore.getDate() + 1)
    })
  })

  describe('handlePrevious / handleNext for week view', () => {
    it('moves date by -7 days on handlePrevious', () => {
      const { result } = renderHook(() => useScheduleNavigation([], fetchMock))
      const dateBefore = result.current.currentDate.getTime()

      act(() => result.current.handlePrevious())
      const diff = dateBefore - result.current.currentDate.getTime()
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000)
    })

    it('moves date by +7 days on handleNext', () => {
      const { result } = renderHook(() => useScheduleNavigation([], fetchMock))
      const dateBefore = result.current.currentDate.getTime()

      act(() => result.current.handleNext())
      const diff = result.current.currentDate.getTime() - dateBefore
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000)
    })
  })

  describe('handlePrevious / handleNext for month view', () => {
    it('moves date by -1 month on handlePrevious', () => {
      const { result } = renderHook(() => useScheduleNavigation([], fetchMock))

      act(() => result.current.setView('month'))
      act(() => result.current.handlePrevious())
      expect(result.current.currentDate.getMonth()).toBe(NOW.getMonth() - 1)
    })

    it('moves date by +1 month on handleNext', () => {
      const { result } = renderHook(() => useScheduleNavigation([], fetchMock))

      act(() => result.current.setView('month'))
      act(() => result.current.handleNext())
      expect(result.current.currentDate.getMonth()).toBe(NOW.getMonth() + 1)
    })
  })

  describe('handleToday', () => {
    it('resets to current date', () => {
      const { result } = renderHook(() => useScheduleNavigation([], fetchMock))

      // Navigate away
      act(() => result.current.handleNext())
      act(() => result.current.handleNext())
      expect(result.current.currentDate.getTime()).not.toBe(NOW.getTime())

      // Reset
      act(() => result.current.handleToday())
      // handleToday creates a new Date(), which under fake timers equals NOW
      expect(result.current.currentDate.getTime()).toBe(NOW.getTime())
    })
  })

  describe('getHeaderText', () => {
    it('returns formatted string for day view', () => {
      const { result } = renderHook(() => useScheduleNavigation([], fetchMock))
      act(() => result.current.setView('day'))
      expect(result.current.getHeaderText()).toBe('formatted-EEEE, MMMM d, yyyy')
    })

    it('returns formatted string for month view', () => {
      const { result } = renderHook(() => useScheduleNavigation([], fetchMock))
      act(() => result.current.setView('month'))
      expect(result.current.getHeaderText()).toBe('formatted-MMMM yyyy')
    })

    it('returns a range string for week view', () => {
      const { result } = renderHook(() => useScheduleNavigation([], fetchMock))
      // Week view is default
      const text = result.current.getHeaderText()
      // Should contain formatted text (either same-month or cross-month format)
      expect(text).toContain('formatted-')
      expect(text).toContain(' - ')
    })
  })

  describe('stats', () => {
    it('computes total, completed, and pending from sessions in range', () => {
      // For week view, June 15 2025 (Sunday) => week starts Monday June 9, ends Sunday June 15
      const sessions = [
        makeSession({ id: 's1', date: '2025-06-09T10:00:00.000Z', completed: true }),
        makeSession({ id: 's2', date: '2025-06-12T10:00:00.000Z', completed: false }),
        makeSession({ id: 's3', date: '2025-06-15T10:00:00.000Z', completed: true }),
        makeSession({ id: 's4', date: '2025-06-20T10:00:00.000Z', completed: false }), // outside range
      ]

      const { result } = renderHook(() => useScheduleNavigation(sessions, fetchMock))
      expect(result.current.stats.total).toBe(3)
      expect(result.current.stats.completed).toBe(2)
      expect(result.current.stats.pending).toBe(1)
    })

    it('returns zero stats for empty sessions', () => {
      const { result } = renderHook(() => useScheduleNavigation([], fetchMock))
      expect(result.current.stats).toEqual({ total: 0, completed: 0, pending: 0 })
    })
  })

  describe('rangeSessions', () => {
    it('returns only sessions within current date range', () => {
      const sessions = [
        makeSession({ id: 's1', date: '2025-06-10T10:00:00.000Z' }),
        makeSession({ id: 's2', date: '2025-06-25T10:00:00.000Z' }), // outside week
      ]

      const { result } = renderHook(() => useScheduleNavigation(sessions, fetchMock))
      expect(result.current.rangeSessions).toHaveLength(1)
      expect(result.current.rangeSessions[0].id).toBe('s1')
    })
  })

  describe('fetchSessionsForRange called on view/date change', () => {
    it('calls fetch again when view changes', () => {
      const { result } = renderHook(() => useScheduleNavigation([], fetchMock))
      expect(fetchMock).toHaveBeenCalledTimes(1)

      act(() => result.current.setView('month'))
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('calls fetch again when date changes via handleNext', () => {
      const { result } = renderHook(() => useScheduleNavigation([], fetchMock))
      const initialCalls = fetchMock.mock.calls.length

      act(() => result.current.handleNext())
      expect(fetchMock.mock.calls.length).toBeGreaterThan(initialCalls)
    })
  })
})
