import { create } from 'zustand'

import { ApiError } from '../../utils/apiClient'
import * as api from '../../services/api/apiService'

// ── Slices (state + sync mutators) ────────────────────────────────────────────
import { type ClientSlice, createClientSlice } from '../slices/clients/clientSlice'
import { type ScheduleSlice, createScheduleSlice } from '../slices/schedule/scheduleSlice'
import { type WorkoutSlice, createWorkoutSlice } from '../slices/workout/workoutSlice'
import { type FinanceSlice, createFinanceSlice } from '../slices/finance/financeSlice'
import { type EvaluationSlice, createEvaluationSlice } from '../slices/evaluation/evaluationSlice'
import { type SettingsSlice, createSettingsSlice } from '../slices/settings/settingsSlice'
import { type SystemFeatureSlice, createSystemFeatureSlice } from '../slices/systemFeature/systemFeatureSlice'
import { type AvailabilitySlice, createAvailabilitySlice } from '../slices/availability/availabilitySlice'

// ── Domain actions (async API calls) — single source of truth ─────────────────
import { type ClientActions, createClientActions } from './clients/clientStore'
import { type ScheduleActions, createScheduleActions } from './schedule/scheduleStore'
import { type WorkoutActions, createWorkoutActions } from './workout/workoutStore'
import { type FinanceActions, createFinanceActions } from './finance/financeStore'
import { type EvaluationActions, createEvaluationActions } from './evaluation/evaluationStore'
import { type SettingsActions, createSettingsActions } from './settings/settingsStore'
import { type SystemFeatureActions, createSystemFeatureActions } from './systemFeature/systemFeatureStore'
import { type AvailabilityActions, createAvailabilityActions } from './availability/availabilityStore'

// ─── Global App State ─────────────────────────────────────────────────────────
// Composes all domain slices and their action interfaces.
// Only adds application-level concerns: fetchInitialData, clearDataOnLogout.
// Domain-specific async logic lives exclusively in each domain store file.
// ─────────────────────────────────────────────────────────────────────────────
export type AppState =
  ClientSlice & ClientActions &
  ScheduleSlice & ScheduleActions &
  WorkoutSlice & WorkoutActions &
  FinanceSlice & FinanceActions &
  EvaluationSlice & EvaluationActions &
  SettingsSlice & SettingsActions &
  SystemFeatureSlice & SystemFeatureActions &
  AvailabilitySlice & AvailabilityActions & {
    appState: 'idle' | 'loading' | 'ready' | 'error'
    errorMessage: string | null
    fetchInitialData: () => Promise<void>
    clearDataOnLogout: () => void
  }

export const useStore = create<AppState>()((set, get) => ({
  // ── Slices: state + sync mutators ──────────────────────────────────────────
  ...createClientSlice(set, get, {} as any),
  ...createScheduleSlice(set, get, {} as any),
  ...createWorkoutSlice(set, get, {} as any),
  ...createFinanceSlice(set, get, {} as any),
  ...createEvaluationSlice(set, get, {} as any),
  ...createSettingsSlice(set, get, {} as any),
  ...createSystemFeatureSlice(set, get, {} as any),
  ...createAvailabilitySlice(set, get, {} as any),

  // ── Domain actions: imported from domain stores — zero duplication ─────────
  ...createClientActions(set, get, {} as any),
  ...createScheduleActions(set, get, {} as any),
  ...createWorkoutActions(set, get, {} as any),
  ...createFinanceActions(set, get, {} as any),
  ...createEvaluationActions(set, get, {} as any),
  ...createSettingsActions(set, get, {} as any),
  ...createSystemFeatureActions(set, get, {} as any),
  ...createAvailabilityActions(set, get, {} as any),

  // ── Global lifecycle state ─────────────────────────────────────────────────
  appState: 'idle',
  errorMessage: null,

  // ── fetchInitialData: orchestrates all domain data hydration ───────────────
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

      await Promise.all([get().hydrateLocale(), get().hydrateAiInstructions(), get().hydrateWorkHours()])

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

  // ── clearDataOnLogout: resets all domain state ─────────────────────────────
  clearDataOnLogout: () => {
    set({
      clients: [],
      sessions: [],
      workouts: [],
      evaluations: [],
      plans: [],
      systemFeatures: [],
      availabilityBlocks: [],
      aiPromptInstructions: '',
      locale: '',
      appState: 'idle',
      errorMessage: null,
    })
  },

  // ── Cross-domain override: deletePlan must also unlink affected clients ─────
  // This is the only action that touches two domains (finance + clients),
  // so it lives here in the global store rather than in financeStore.
  deletePlan: async (id) => {
    await api.deletePlan(id)
    get()._removePlan(id)
    set((state) => ({
      clients: state.clients.map((c) => (c.planId === id ? { ...c, planId: undefined } : c)),
    }))
  },
}))

// Need to import authStore here to prevent circular dependency issues
import { useAuthStore } from './auth/authStore'
