import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type NewSession, type SessionUpdate } from '../../../types'
import * as api from '../../../services/api/apiService'
import { occurrenceId } from '../../../services/api/mappers/sessionMapper'
import { createScheduleSlice, type ScheduleSlice } from '../../slices/schedule/scheduleSlice'

/**
 * Async API actions domain interface for scheduling sessions and recurring series.
 * Sessions, series, exceptions and cancellations are one resource on the API:
 * a series is a session created with an `rrule`, and one occurrence of it is
 * addressed by its occurrence id (`<seriesId>_<ISO start>`).
 */
export interface ScheduleActions {
  /**
   * Adds a single non-recurring session to backend and state.
   *
   * @param session - Session data
   * @returns A promise resolving when session is created
   */
  addSession: (session: NewSession) => Promise<void>
  /**
   * Creates an RRULE-based recurring series on the server. Its occurrences are not
   * stored: they arrive with the next range fetch.
   *
   * @param series - Session data with the RRULE string and its timezone
   * @returns A promise resolving when the series is created
   */
  addRecurringEvent: (series: NewSession & { rrule: string }) => Promise<void>
  /**
   * Deletes a session. A one-off id removes it, a series master id removes the
   * whole series, an occurrence id cancels that occurrence only.
   *
   * @param id - Session UUID, series master UUID or occurrence id
   */
  deleteSession: (id: string) => Promise<void>
  /**
   * Deletes an entire recurring series by the id of its master.
   *
   * @param id - Recurrence series identifier
   * @returns A promise resolving when recurring series is deleted
   */
  deleteRecurringSeries: (id: string) => Promise<void>
  /**
   * Creates or updates the exception of one occurrence of a recurring series
   * (move it, change it, complete it or cancel it).
   *
   * @param dto - Series id, original start of the occurrence and the changes
   * @returns A promise resolving when exception is saved
   */
  upsertSessionException: (dto: { recurringEventId: string; originalStartTime: string } & SessionUpdate) => Promise<void>
  /**
   * Updates a single session, or one occurrence of a series, by ID.
   *
   * @param id - Session UUID or occurrence id
   * @param session - Fields to change
   * @returns A promise resolving when session update completes
   */
  updateSession: (id: string, session: SessionUpdate) => Promise<void>
  /**
   * Fetches sessions within a date range and replaces current state sessions.
   *
   * @param start - Start date boundary
   * @param end - End date boundary
   * @returns A promise resolving when sessions are loaded
   */
  fetchSessionsForRange: (start: Date, end: Date) => Promise<void>
  /**
   * Toggles the completion status of a session.
   *
   * @param id - Session UUID or occurrence id
   * @returns A promise resolving when completion status toggle completes
   */
  toggleSessionComplete: (id: string) => Promise<void>
}

/** Composite state type combining ScheduleSlice and ScheduleActions. */
export type ScheduleStoreState = ScheduleSlice & ScheduleActions

/**
 * Single source of truth for all schedule async actions.
 * Consumed by both useScheduleStore (standalone) and useStore (global).
 *
 * @param set - Zustand state setter function
 * @param get - Zustand state getter function
 * @returns Object containing schedule async action implementations
 */
export const createScheduleActions: StateCreator<ScheduleStoreState, [], [], ScheduleActions> = (_set, get) => ({
  addSession: async (sessionData) => {
    const newSession = await api.createSession(sessionData)
    get()._addSession(newSession)
  },

  addRecurringEvent: async (series) => {
    await api.createRecurringEvent(series)
  },

  deleteSession: async (id) => {
    await api.deleteSession(id)
    // The id may be a series master: its occurrences leave the state with it.
    get()._removeSeries(id)
    get()._removeSession(id)
  },

  deleteRecurringSeries: async (id) => {
    await api.deleteRecurringSeries(id)
    get()._removeSeries(id)
  },

  upsertSessionException: async (dto) => {
    const id = occurrenceId(dto.recurringEventId, dto.originalStartTime)
    const updated = await api.upsertSessionException(dto)
    const stored = get().sessions.find((s) => s.id === id || (s.recurringEventId === dto.recurringEventId && s.originalStartTime === dto.originalStartTime))
    if (!stored) return
    if (dto.cancelled) get()._removeSession(stored.id)
    else get()._updateSession(updated, stored.id)
  },

  updateSession: async (id, updates) => {
    const updatedSession = await api.updateSession(id, updates)
    if (updatedSession.cancelled) get()._removeSession(id)
    else get()._updateSession(updatedSession, id)
  },

  fetchSessionsForRange: async (start, end) => {
    const sessions = await api.getSessionsForRange(start, end)
    get()._setSessions(sessions || [])
  },

  toggleSessionComplete: async (id) => {
    const updatedSession = await api.toggleSessionComplete(id)
    get()._updateSession(updatedSession, id)
  },
})

/**
 * Zustand hook for managing schedule state and actions.
 *
 * @example
 * const { sessions, addSession } = useScheduleStore();
 */
export const useScheduleStore = create<ScheduleStoreState>()((...a) => ({
  ...createScheduleSlice(...a),
  ...createScheduleActions(...a),
}))

export type { ScheduleSlice }
export { createScheduleSlice }
