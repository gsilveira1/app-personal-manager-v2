import { useMemo } from 'react'
import { isSameDay, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isAfter, subDays } from 'date-fns'
import { useStore } from '../states/stores/store'
import { ClientStatus } from '../types'
import { formatLocalized } from '../utils/dateLocale'
import { findSchedulingConflicts } from '../utils/scheduleUtils'

/**
 * Hook to encapsulate Dashboard logic and state management.
 */
export const useDashboard = () => {
  const { clients, sessions, toggleSessionComplete } = useStore()

  const conflicts = useMemo(() => findSchedulingConflicts(sessions), [sessions])
  
  const today = useMemo(() => new Date(), [])
  
  const weekStart = useMemo(() => startOfWeek(today, { weekStartsOn: 1 }), [today])
  const weekEnd = useMemo(() => endOfWeek(today, { weekStartsOn: 1 }), [today])

  const todaySessions = useMemo(() => sessions.filter((s) => isSameDay(parseISO(s.date), today)), [sessions, today])
  const weeklySessions = useMemo(() => sessions.filter((s) => { 
    const d = parseISO(s.date)
    return d >= weekStart && d <= weekEnd
  }), [sessions, weekStart, weekEnd])
  
  const newLeads = useMemo(() => clients.filter((c) => c.status === ClientStatus.Lead).length, [clients])
  const activeClients = useMemo(() => clients.filter((c) => c.status === ClientStatus.Active).length, [clients])

  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd])
  
  const weeklyScheduleData = useMemo(() => weekDays.map((day) => ({
    name: formatLocalized(day, 'EEE'),
    sessions: sessions.filter((s) => isSameDay(parseISO(s.date), day)).length,
  })), [weekDays, sessions])

  const clientsToWatch = useMemo(() => clients
    .filter((client) => {
      if (client.status !== ClientStatus.Active) return false
      const clientSessions = sessions.filter((s) => s.clientId === client.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      if (clientSessions.length === 0) return true
      return isAfter(subDays(today, 14), parseISO(clientSessions[0].date))
    })
    .slice(0, 5), [clients, sessions, today])

  return {
    clients,
    sessions,
    toggleSessionComplete,
    conflicts,
    todaySessions,
    weeklySessions,
    newLeads,
    activeClients,
    weeklyScheduleData,
    clientsToWatch
  }
}
