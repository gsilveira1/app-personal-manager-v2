import { type NewSession, type SessionUpdate } from '../../types'
import apiClient from '../../utils/apiClient'
import { occurrenceId, toSession, toSessionCreateBody, toSessionUpdateBody, type SessionWire } from './mappers/sessionMapper'

/**
 * Retrieves the one-off sessions (no range: recurring series are not expanded).
 */
export const getSessions = async () => (await apiClient<SessionWire[]>('/sessions')).map(toSession)

/**
 * Retrieves sessions for a date range: one-off sessions, the occurrences of every
 * recurring series, and their non-cancelled exceptions.
 */
export const getSessionsForRange = async (start: Date, end: Date) =>
  (await apiClient<SessionWire[]>(`/sessions?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`)).map(toSession)

/**
 * Creates a session. With `rrule` it creates a recurring series and the answer is
 * the series master; without it, a one-off session (409 when the slot is taken or blocked).
 */
export const createSession = async (session: NewSession) =>
  toSession(
    await apiClient<SessionWire>('/sessions', {
      method: 'POST',
      body: JSON.stringify(toSessionCreateBody(session)),
    })
  )

/**
 * Creates a recurring series: a session whose `rrule` is set, starting at `date`.
 */
export const createRecurringEvent = async (series: NewSession & { rrule: string }) => createSession(series)

/**
 * Updates a session. `id` is the UUID of a one-off session or the occurrence id of
 * a series (`<seriesId>_<ISO start>`), in which case only that occurrence changes.
 * A whole series cannot be edited (400): delete it and create it again.
 */
export const updateSession = async (id: string, updates: SessionUpdate) =>
  toSession(
    await apiClient<SessionWire>(`/sessions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(toSessionUpdateBody(updates)),
    })
  )

/**
 * Creates or updates the exception of one occurrence of a recurring series.
 */
export const upsertSessionException = async (dto: { recurringEventId: string; originalStartTime: string } & SessionUpdate) => {
  const { recurringEventId, originalStartTime, ...updates } = dto
  return updateSession(occurrenceId(recurringEventId, originalStartTime), updates)
}

/**
 * Deletes a session. A one-off UUID removes the session, a series master UUID
 * removes the whole series, and an occurrence id cancels that occurrence only.
 */
export const deleteSession = async (id: string) => apiClient<void>(`/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' })

/**
 * Deletes a recurring series of sessions (its exceptions go with it).
 */
export const deleteRecurringSeries = async (seriesId: string) => deleteSession(seriesId)

/**
 * Toggles the completion status of a session or of one occurrence of a series.
 */
export const toggleSessionComplete = async (id: string) =>
  toSession(
    await apiClient<SessionWire>(`/sessions/${encodeURIComponent(id)}/toggle-complete`, {
      method: 'POST',
    })
  )
