import { type StateCreator } from 'zustand'

import { type Session } from '../../../types'

/**
 * Slice managing schedule sessions state and synchronous mutations.
 */
export interface ScheduleSlice {
  /** List of scheduled workout/training sessions. */
  sessions: Session[]
  /**
   * Replaces the entire list of sessions in state.
   * 
   * @param sessions - List of Session entities
   */
  _setSessions: (sessions: Session[]) => void
  /**
   * Appends a single session to state.
   * 
   * @param session - The new Session entity
   */
  _addSession: (session: Session) => void
  /**
   * Appends multiple sessions to state.
   * 
   * @param sessions - Array of new Session entities
   */
  _addSessions: (sessions: Session[]) => void
  /**
   * Updates an existing session by ID in state.
   * 
   * @param session - The updated Session entity
   */
  _updateSession: (session: Session) => void
  /**
   * Updates a series of recurring sessions by recurrence ID.
   * 
   * @param sessions - Updated array of sessions in the series
   * @param recurrenceId - Unique identifier of the session series
   */
  _updateSessionSeries: (sessions: Session[], recurrenceId: string) => void
}

/**
 * Creates the schedule slice state creator for Zustand store integration.
 * 
 * @param set - Zustand state setter function
 * @returns Initialized ScheduleSlice state object and methods
 * @example
 * const slice = createScheduleSlice(set, get, storeApi);
 */
export const createScheduleSlice: StateCreator<ScheduleSlice, [], [], ScheduleSlice> = (set) => ({
  sessions: [],
  _setSessions: (sessions) => set({ sessions }),
  _addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  _addSessions: (sessions) => set((state) => ({ sessions: [...state.sessions, ...sessions] })),
  _updateSession: (session) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
    })),
  _updateSessionSeries: (updatedSessions, recurrenceId) =>
    set((state) => ({
      sessions: [...state.sessions.filter((s) => s.recurrenceId !== recurrenceId), ...updatedSessions],
    })),
})
