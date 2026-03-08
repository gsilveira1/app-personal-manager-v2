import { create } from 'zustand'

import type { Client, Session, WorkoutPlan, Evaluation, Plan } from '../types'
import * as api from '../services/apiService'
import { ApiError } from '../utils/apiClient'
import { type ClientSlice, createClientSlice } from './clientSlice'
import { type ScheduleSlice, createScheduleSlice } from './scheduleSlice'
import { type WorkoutSlice, createWorkoutSlice } from './workoutSlice'
import { type FinanceSlice, createFinanceSlice } from './financeSlice'
import { type EvaluationSlice, createEvaluationSlice } from './evaluationSlice'
import { type SettingsSlice, createSettingsSlice } from './settingsSlice'

// Combine all slice interfaces and add async actions
export type AppState = ClientSlice &
  ScheduleSlice &
  WorkoutSlice &
  FinanceSlice &
  EvaluationSlice &
  SettingsSlice & {
    appState: 'idle' | 'loading' | 'ready' | 'error'
    errorMessage: string | null
    fetchInitialData: () => Promise<void>
    clearDataOnLogout: () => void
    addClient: (clientData: Omit<Client, 'id' | 'avatar'>, customPlanData?: Omit<Plan, 'id'>) => Promise<void>
    updateClient: (id: string, client: Partial<Client>) => Promise<void>
    deleteClient: (id: string) => Promise<void>
    convertLead: (id: string, planId?: string) => Promise<void>
    addSession: (session: Omit<Session, 'id' | 'completed' | 'recurrenceId'>) => Promise<void>
    addRecurringSessions: (baseSession: Omit<Session, 'id' | 'date' | 'completed'>, startDateStr: string, frequency: 'weekly' | 'bi-weekly', untilDateStr: string) => Promise<void>
    addRecurringEvent: (dto: { rrule: string; timezone: string; dtstart: string; durationMinutes: number; type: string; category: string; clientId: string; linkedWorkoutId?: string; notes?: string }) => Promise<void>
    deleteRecurringSeries: (id: string) => Promise<void>
    upsertSessionException: (dto: { recurringEventId: string; originalStartTime: string; cancelled?: boolean; newStartTime?: string; durationMinutes?: number; notes?: string; completed?: boolean }) => Promise<void>
    updateSession: (id: string, session: Partial<Session>) => Promise<void>
    updateSessionWithScope: (sessionId: string, updates: Partial<Session>, scope: 'single' | 'future') => Promise<void>
    toggleSessionComplete: (id: string) => Promise<void>
    fetchSessionsForRange: (start: Date, end: Date) => Promise<void>
    addWorkout: (workout: Omit<WorkoutPlan, 'id' | 'createdAt'>) => Promise<void>
    updateWorkout: (id: string, workout: Partial<WorkoutPlan>) => Promise<void>
    deleteWorkout: (id: string) => Promise<void>
    addEvaluation: (evaluation: Omit<Evaluation, 'id'>) => Promise<void>
    updateEvaluation: (id: string, evaluation: Partial<Evaluation>) => Promise<void>
    deleteEvaluation: (id: string) => Promise<void>
    addPlan: (plan: Omit<Plan, 'id'>) => Promise<void>
    updatePlan: (id: string, plan: Partial<Plan>) => Promise<void>
    deletePlan: (id: string) => Promise<void>
    updateAiPromptInstructions: (instructions: string) => Promise<void>
    updateLocale: (language: string) => Promise<void>
  }

export const useStore = create<AppState>()((set, get) => ({
  ...createClientSlice(set, get, {} as any),
  ...createScheduleSlice(set, get, {} as any),
  ...createWorkoutSlice(set, get, {} as any),
  ...createFinanceSlice(set, get, {} as any),
  ...createEvaluationSlice(set, get, {} as any),
  ...createSettingsSlice(set, get, {} as any),
  appState: 'idle',

  errorMessage: null,

  fetchInitialData: async () => {
    set({ appState: 'loading', errorMessage: null })
    try {
      const [clients, evaluations, plans, sessions, workouts] = await Promise.all([
        api.getClients(),
        api.getEvaluations(),
        api.getPlans(),
        api.getSessions(),
        api.getWorkouts(),
      ])

      get()._setClients(clients || [])
      get()._setSessions(sessions || [])
      get()._setWorkouts(workouts || [])
      get()._setEvaluations(evaluations || [])
      get()._setPlans(plans || [])
      await Promise.all([get().hydrateLocale(), get().hydrateAiInstructions()])
      set({ appState: 'ready' })
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
      if (error instanceof ApiError && error.status === 401) {
        useAuthStore.getState().logout()
        set({ appState: 'idle' })
      } else {
        set({ appState: 'error', errorMessage: (error as Error).message })
      }
    }
  },

  clearDataOnLogout: () => {
    set({
      clients: [],
      sessions: [],
      workouts: [],
      evaluations: [],
      plans: [],
      aiPromptInstructions: '',
      locale: '',
      appState: 'idle',
      errorMessage: null,
    })
  },

  addClient: async (clientData, customPlanData) => {
    const finalClientData = { ...clientData }
    if (customPlanData) {
      const newPlan = await api.createPlan(customPlanData)
      get()._addPlan(newPlan)
      finalClientData.planId = newPlan.id
    }
    const newClient = await api.createClient(finalClientData)
    get()._addClient(newClient)
  },
  updateClient: async (id, updates) => {
    const updatedClient = await api.updateClient(id, updates)
    get()._updateClient(updatedClient)
  },
  deleteClient: async (id) => {
    await api.deleteClient(id)
    get()._removeClient(id)
  },
  convertLead: async (id, planId) => {
    const updatedClient = await api.convertLead(id, planId)
    get()._updateClient(updatedClient)
  },

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
          (s: any) => !(s.recurringEventId === dto.recurringEventId && s.originalStartTime === dto.originalStartTime)
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

  addWorkout: async (workoutData) => {
    const newWorkout = await api.createWorkout(workoutData)
    get()._addWorkout(newWorkout)
  },
  updateWorkout: async (id, updates) => {
    const updatedWorkout = await api.updateWorkout(id, updates)
    get()._updateWorkout(updatedWorkout)
  },
  deleteWorkout: async (id) => {
    await api.deleteWorkout(id)
    get()._removeWorkout(id)
  },

  addEvaluation: async (evaluationData) => {
    const newEvaluation = await api.createEvaluation(evaluationData)
    get()._addEvaluation(newEvaluation)
  },
  updateEvaluation: async (id, updates) => {
    const updatedEvaluation = await api.updateEvaluation(id, updates)
    get()._updateEvaluation(updatedEvaluation)
  },
  deleteEvaluation: async (id) => {
    await api.deleteEvaluation(id)
    get()._removeEvaluation(id)
  },

  addPlan: async (planData) => {
    const newPlan = await api.createPlan(planData)
    get()._addPlan(newPlan)
  },
  updatePlan: async (id, updates) => {
    const updatedPlan = await api.updatePlan(id, updates)
    get()._updatePlan(updatedPlan)
  },
  deletePlan: async (id) => {
    await api.deletePlan(id)
    get()._removePlan(id)
    set((state) => ({
      clients: state.clients.map((c) => (c.planId === id ? { ...c, planId: undefined } : c)),
    }))
  },

  updateAiPromptInstructions: async (instructions: string) => {
    await api.updateAiInstructions(instructions)
    get()._setAiPromptInstructions(instructions)
  },

  updateLocale: async (language: string) => {
    const result = await api.updateLanguage(language)
    get()._setLocale(result.language)
  },
}))

// Need to import authStore here to prevent circular dependency issues
import { useAuthStore } from './authStore'
