import { useState, useMemo, useEffect } from 'react'
import { addDays, addWeeks, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, parseISO } from 'date-fns'
import { format, isSameMonth } from 'date-fns'
import { formatLocalized } from '../utils/dateLocale'
import type { Session } from '../types'

export type ViewType = 'day' | 'week' | 'month'

export function useScheduleNavigation(sessions: Session[], fetchSessionsForRange: (start: Date, end: Date) => Promise<void>) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewType>('week')

  // Windowed session fetching
  useEffect(() => {
    let start: Date, end: Date
    if (view === 'day') {
      start = addDays(currentDate, -1)
      end = addDays(currentDate, 1)
    } else if (view === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 })
      end = addDays(start, 7)
    } else {
      start = startOfMonth(currentDate)
      end = addDays(endOfMonth(currentDate), 1)
    }
    fetchSessionsForRange(start, end).catch(console.error)
  }, [view, currentDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrevious = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, -1))
    if (view === 'week') setCurrentDate(addWeeks(currentDate, -1))
    if (view === 'month') setCurrentDate(addMonths(currentDate, -1))
  }

  const handleNext = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, 1))
    if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
  }

  const handleToday = () => setCurrentDate(new Date())

  const getHeaderText = () => {
    if (view === 'day') return formatLocalized(currentDate, 'EEEE, MMMM d, yyyy')
    if (view === 'month') return formatLocalized(currentDate, 'MMMM yyyy')
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = addDays(start, 6)
    if (isSameMonth(start, end)) {
      return `${formatLocalized(start, 'MMMM d')} - ${format(end, 'd, yyyy')}`
    }
    return `${formatLocalized(start, 'MMM d')} - ${formatLocalized(end, 'MMM d, yyyy')}`
  }

  const { stats, rangeSessions } = useMemo(() => {
    let start: Date, end: Date
    if (view === 'day') {
      start = startOfDay(currentDate)
      end = endOfMonth(addDays(start, 1))
    } else if (view === 'month') {
      start = startOfMonth(currentDate)
      end = endOfMonth(currentDate)
    } else {
      start = startOfWeek(currentDate, { weekStartsOn: 1 })
      end = endOfWeek(currentDate, { weekStartsOn: 1 })
    }
    const sessionsInRange = sessions.filter((s) => {
      const d = parseISO(s.date)
      return d >= start && d <= end
    })
    return {
      stats: {
        total: sessionsInRange.length,
        completed: sessionsInRange.filter((s) => s.completed).length,
        pending: sessionsInRange.filter((s) => !s.completed).length,
      },
      rangeSessions: sessionsInRange,
    }
  }, [sessions, currentDate, view])

  return {
    currentDate,
    setCurrentDate,
    view,
    setView,
    handlePrevious,
    handleNext,
    handleToday,
    getHeaderText,
    stats,
    rangeSessions,
  }
}
