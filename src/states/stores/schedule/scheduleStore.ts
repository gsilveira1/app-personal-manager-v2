import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type Session } from '../../../types'
import * as api from '../../../services/api/apiService'
import { createScheduleSlice, type ScheduleSlice } from '../../slices/schedule/scheduleSlice'

export interface ScheduleActions {
  addSession: (session: Omit<Session, 'id' | 'completed' | 'recurrenceId'>) => Promise<void>
  addRecurringSessions: (
    baseSession: Omit<Session, 'id' | 'date' | 'completed'>,
    startDateStr: string,
    frequency: 'weekly' | 'bi-weekly',
    untilDateStr: string,
  ) => Promise<void>
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
  deleteRecurringSeries: (id: string) => Promise<void>
  upsertSessionException: (dto: {
    recurringEventId: string
    originalStartTime: string
    cancelled?: boolean
    newStartTime?: string
    durationMinutes?: number
    notes?: string
    completed?: boolean
  }) => Promise<void>
  updateSession: (id: string, session: Partial<Session>) => Promise<void>
  updateSessionWithScope: (sessionId: string, updates: Partial<Session>, scope: 'single' | 'future') => Promise<void>
  fetchSessionsForRange: (start: Date, end: Date) => Promise<void>
  toggleSessionComplete: (id: string) => Promise<void>
}

export type ScheduleStoreState = ScheduleSlice & ScheduleActions

// Single source of truth for all schedule/session async actions.
// Consumed by both useScheduleStore (standalone) and useStore (global).
export const createScheduleActions: StateCreator<ScheduleStoreState, [], [], ScheduleActions> = (set, get) => ({
  addSession: async (sessionData) => {
    const newSession = await api.createSession(sessionData)
    get()._addSession(newSession)
  },

  addRecurringSessions: async (baseSession, startDateStr, frequency, untilDateStr) => {
    const newSessions = await api.createRecurringSessions({ baseSession, startDateStr, frequency, untilDateStr })
    get()._addSessions(newSessions)
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

export const useScheduleStore = create<ScheduleStoreState>()((...a) => ({
  ...createScheduleSlice(...a),
  ...createScheduleActions(...a),
}))

export type { ScheduleSlice }
export { createScheduleSlice }
