import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type Session } from '../../../types'
import * as api from '../../../services/api/apiService'
import { createScheduleSlice, type ScheduleSlice } from '../../slices/schedule/scheduleSlice'

/**
 * Async API actions domain interface for scheduling sessions and recurring events.
 */
export interface ScheduleActions {
  /**
   * Adds a single non-recurring session to backend and state.
   * 
   * @param session - Session data omitting generated ID, completed flag, and recurrence ID
   * @returns A promise resolving when session is created
   */
  addSession: (session: Omit<Session, 'id' | 'completed' | 'recurrenceId'>) => Promise<void>
  /**
   * Creates an RRULE-based recurring event on the server.
   * 
   * @param dto - Object containing RRULE string, timezone, category, client, etc.
   * @returns A promise resolving when recurring event is created
   */
  addRecurringEvent: (dto: {
    rrule: string
    timezone: string
    dtstart: string
    durationMinutes: number
    type: string
    category: string
    clientId: string
    linkedWorkoutId?: string
    notes?: string
  }) => Promise<void>
  /**
   * Deletes an entire recurring event series by ID.
   * 
   * @param id - Recurrence series identifier
   * @returns A promise resolving when recurring series is deleted
   */
  deleteRecurringSeries: (id: string) => Promise<void>
  /**
   * Creates or updates an exception for a recurring event instance.
   * 
   * @param dto - Exception parameters including cancellation or new start time
   * @returns A promise resolving when exception is saved
   */
  upsertSessionException: (dto: {
    recurringEventId: string
    originalStartTime: string
    cancelled?: boolean
    newStartTime?: string
    durationMinutes?: number
    notes?: string
    completed?: boolean
  }) => Promise<void>
  /**
   * Updates a single session by ID.
   * 
   * @param id - Unique identifier of session
   * @param session - Partial session updates
   * @returns A promise resolving when session update completes
   */
  updateSession: (id: string, session: Partial<Session>) => Promise<void>
  /**
   * Updates a session with scoping (single vs. future instances).
   * 
   * @param sessionId - Session identifier
   * @param updates - Partial session updates
   * @param scope - Scope of update ('single' or 'future')
   * @returns A promise resolving when update completes
   */
  updateSessionWithScope: (sessionId: string, updates: Partial<Session>, scope: 'single' | 'future') => Promise<void>
  /**
   * Fetches scheduled sessions within a specified date range.
   * 
   * @param start - Start Date of range
   * @param end - End Date of range
   * @returns A promise resolving when sessions are loaded into state
   */
  fetchSessionsForRange: (start: Date, end: Date) => Promise<void>
  /**
   * Toggles completion status of a session by ID.
   * 
   * @param id - Unique identifier of session
   * @returns A promise resolving when completion state is toggled
   */
  toggleSessionComplete: (id: string) => Promise<void>
}

/** Composite state type combining ScheduleSlice and ScheduleActions. */
export type ScheduleStoreState = ScheduleSlice & ScheduleActions

/**
 * Single source of truth for all schedule/session async actions.
 * Consumed by both useScheduleStore (standalone) and useStore (global).
 * 
 * @param set - Zustand state setter function
 * @param get - Zustand state getter function
 * @returns Object containing schedule async action implementations
 */
export const createScheduleActions: StateCreator<ScheduleStoreState, [], [], ScheduleActions> = (set, get) => ({
  addSession: async (sessionData) => {
    const newSession = await api.createSession(sessionData)
    get()._addSession(newSession)
  },

  addRecurringEvent: async (dto) => {
    await api.createRecurringEvent(dto)
  },

  deleteRecurringSeries: async (id) => {
    await api.deleteRecurringSeries(id)
    set((state) => ({
      sessions: state.sessions.filter((s: any) => s.recurringEventId !== id && s.recurrenceId !== id),
    }))
  },

  upsertSessionException: async (dto) => {
    await api.upsertSessionException(dto)
    if (dto.cancelled) {
      set((state) => ({
        sessions: state.sessions.filter(
          (s: any) => !(s.recurringEventId === dto.recurringEventId && s.originalStartTime === dto.originalStartTime),
        ),
      }))
    }
  },

  updateSession: async (id, updates) => {
    const updatedSession = await api.updateSession(id, updates)
    get()._updateSession(updatedSession)
  },

  updateSessionWithScope: async (sessionId, updates, scope) => {
    if (scope === 'single') {
      await get().updateSession(sessionId, updates)
    } else {
      await api.updateSessionWithScope(sessionId, updates, scope)
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)
      await get().fetchSessionsForRange(start, end)
    }
  },

  fetchSessionsForRange: async (start, end) => {
    const sessions = await api.getSessionsForRange(start, end)
    get()._setSessions(sessions || [])
  },

  toggleSessionComplete: async (id) => {
    const updatedSession = await api.toggleSessionComplete(id)
    get()._updateSession(updatedSession)
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
