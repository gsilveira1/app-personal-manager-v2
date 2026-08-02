import { type Session } from '../../types'
import apiClient from '../../utils/apiClient'

/**
 * Retrieves all sessions.
 */
export const getSessions = async () => apiClient<Session[]>('/sessions')

/**
 * Retrieves sessions for a specific date range.
 */
export const getSessionsForRange = async (start: Date, end: Date) =>
  apiClient<Session[]>(`/sessions?start=${start.toISOString()}&end=${end.toISOString()}`)

/**
 * Creates a single session.
 */
export const createSession = async (session: Omit<Session, 'id' | 'completed'>) =>
  apiClient<Session>('/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  })

/**
 * Creates a recurring event series in the schedule.
 */
export const createRecurringEvent = async (dto: {
  rrule: string
  timezone: string
  dtstart: string
  durationMinutes: number
  type: string
  category: string
  clientId: string
  linkedWorkoutId?: string
  notes?: string
}) =>
  apiClient<{ id: string }>('/sessions/recurring-event', {
    method: 'POST',
    body: JSON.stringify(dto),
  })

/**
 * Deletes a recurring series of sessions.
 */
export const deleteRecurringSeries = async (id: string) =>
  apiClient<void>(`/sessions/recurring-event/${id}`, { method: 'DELETE' })

/**
 * Creates or updates an exception in a recurring series.
 */
export const upsertSessionException = async (dto: {
  recurringEventId: string
  originalStartTime: string
  cancelled?: boolean
  newStartTime?: string
  durationMinutes?: number
  notes?: string
  completed?: boolean
}) =>
  apiClient<{ id: string }>('/sessions/exception', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  })

/**
 * Updates a single session.
 */
export const updateSession = async (id: string, updates: Partial<Session>) =>
  apiClient<Session>(`/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })

/**
 * Updates a session with a target scope (single or future).
 */
export const updateSessionWithScope = async (
  id: string,
  updates: Partial<Session>,
  scope: 'single' | 'future'
) =>
  apiClient<Session>(`/sessions/${id}/scope`, {
    method: 'PATCH',
    body: JSON.stringify({ ...updates, scope }),
  })

/**
 * Toggles the completion status of a session.
 */
export const toggleSessionComplete = async (id: string) =>
  apiClient<Session>(`/sessions/${id}/toggle-complete`, {
    method: 'POST',
  })
