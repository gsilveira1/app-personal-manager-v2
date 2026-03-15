// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../services/apiService', () => ({
  getClients: vi.fn(),
  getEvaluations: vi.fn(),
  getPlans: vi.fn(),
  getSessions: vi.fn(),
  getWorkouts: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  deleteClient: vi.fn(),
  convertLead: vi.fn(),
  createSession: vi.fn(),
  toggleSessionComplete: vi.fn(),
  createWorkout: vi.fn(),
  updateWorkout: vi.fn(),
  deleteWorkout: vi.fn(),
  createEvaluation: vi.fn(),
  updateEvaluation: vi.fn(),
  deleteEvaluation: vi.fn(),
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
  deletePlan: vi.fn(),
  updateAiPromptInstructions: vi.fn(),
  updateLanguage: vi.fn(),
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  getSettings: vi.fn(),
  getLanguage: vi.fn(),
}))

vi.mock('./authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      logout: vi.fn(),
    })),
  },
}))

vi.mock('../i18n/index', () => ({
  SUPPORTED_LOCALES: ['pt-BR', 'en'],
  i18n: {
    changeLanguage: vi.fn().mockResolvedValue(undefined),
  },
}))

import * as api from '../services/apiService'
import { useStore } from './store'

const mockApi = api as Record<string, ReturnType<typeof vi.fn>>

describe('store async actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useStore.setState({
      clients: [],
      sessions: [],
      workouts: [],
      evaluations: [],
      plans: [],
      appState: 'idle',
      errorMessage: null,
      aiPromptInstructions: '',
      locale: '',
    })
  })

  describe('fetchInitialData', () => {
    it('should fetch all data and set appState to ready', async () => {
      mockApi.getClients.mockResolvedValue([{ id: '1', name: 'Maria' }])
      mockApi.getEvaluations.mockResolvedValue([])
      mockApi.getPlans.mockResolvedValue([])
      mockApi.getSessions.mockResolvedValue([])
      mockApi.getWorkouts.mockResolvedValue([])
      mockApi.getLanguage.mockResolvedValue({ language: 'pt-BR' })

      await useStore.getState().fetchInitialData()

      expect(useStore.getState().appState).toBe('ready')
      expect(useStore.getState().clients).toHaveLength(1)
    })

    it('should set appState to error on failure', async () => {
      mockApi.getClients.mockRejectedValue(new Error('Network error'))
      mockApi.getEvaluations.mockResolvedValue([])
      mockApi.getPlans.mockResolvedValue([])
      mockApi.getSessions.mockResolvedValue([])
      mockApi.getWorkouts.mockResolvedValue([])

      await useStore.getState().fetchInitialData()

      expect(useStore.getState().appState).toBe('error')
      expect(useStore.getState().errorMessage).toBe('Network error')
    })
  })

  describe('clearDataOnLogout', () => {
    it('should reset all arrays and set appState to idle', () => {
      useStore.setState({
        clients: [{ id: '1' }] as any,
        sessions: [{ id: '1' }] as any,
        workouts: [{ id: '1' }] as any,
        evaluations: [{ id: '1' }] as any,
        plans: [{ id: '1' }] as any,
        appState: 'ready',
      })

      useStore.getState().clearDataOnLogout()

      const state = useStore.getState()
      expect(state.clients).toEqual([])
      expect(state.sessions).toEqual([])
      expect(state.workouts).toEqual([])
      expect(state.evaluations).toEqual([])
      expect(state.plans).toEqual([])
      expect(state.appState).toBe('idle')
    })
  })

  describe('addClient', () => {
    it('should call createClient API and add to store', async () => {
      const newClient = { id: 'new-1', name: 'João', email: 'joao@test.com', phone: '123', status: 'Active', type: 'In-Person' }
      mockApi.createClient.mockResolvedValue(newClient)

      await useStore.getState().addClient({ name: 'João', email: 'joao@test.com', phone: '123', status: 'Active', type: 'In-Person' } as any)

      expect(mockApi.createClient).toHaveBeenCalled()
      expect(useStore.getState().clients).toHaveLength(1)
      expect(useStore.getState().clients[0].id).toBe('new-1')
    })
  })

  describe('updateClient', () => {
    it('should call updateClient API and update in store', async () => {
      const client = { id: '1', name: 'Maria', email: 'maria@test.com', phone: '123', status: 'Active', type: 'In-Person' }
      useStore.setState({ clients: [client] as any })

      const updated = { ...client, name: 'Maria Santos' }
      mockApi.updateClient.mockResolvedValue(updated)

      await useStore.getState().updateClient('1', { name: 'Maria Santos' })

      expect(useStore.getState().clients[0].name).toBe('Maria Santos')
    })
  })

  describe('deleteClient', () => {
    it('should call deleteClient API and remove from store', async () => {
      useStore.setState({ clients: [{ id: '1', name: 'Maria' }] as any })
      mockApi.deleteClient.mockResolvedValue(undefined)

      await useStore.getState().deleteClient('1')

      expect(useStore.getState().clients).toHaveLength(0)
    })
  })

  describe('convertLead', () => {
    it('should call convertLead API and update client in store', async () => {
      const client = { id: '1', name: 'Lead', status: 'Lead' }
      useStore.setState({ clients: [client] as any })

      const updated = { ...client, status: 'Active', planId: 'plan-1' }
      mockApi.convertLead.mockResolvedValue(updated)

      await useStore.getState().convertLead('1', 'plan-1')

      expect(useStore.getState().clients[0].status).toBe('Active')
    })
  })

  describe('addSession', () => {
    it('should call createSession API and add to store', async () => {
      const session = { id: 'sess-1', clientId: 'c1', date: '2025-02-01', durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: false }
      mockApi.createSession.mockResolvedValue(session)

      await useStore.getState().addSession({ clientId: 'c1', date: '2025-02-01', durationMinutes: 60, type: 'In-Person', category: 'Workout' } as any)

      expect(useStore.getState().sessions).toHaveLength(1)
    })
  })

  describe('toggleSessionComplete', () => {
    it('should call API and update session in store', async () => {
      const session = { id: 'sess-1', completed: false }
      useStore.setState({ sessions: [session] as any })

      const updated = { ...session, completed: true }
      mockApi.toggleSessionComplete.mockResolvedValue(updated)

      await useStore.getState().toggleSessionComplete('sess-1')

      expect(useStore.getState().sessions[0].completed).toBe(true)
    })
  })

  describe('addWorkout', () => {
    it('should call createWorkout API and add to store', async () => {
      const workout = { id: 'w-1', title: 'Treino A', exercises: [], tags: [] }
      mockApi.createWorkout.mockResolvedValue(workout)

      await useStore.getState().addWorkout({ title: 'Treino A', exercises: [], tags: [] } as any)

      expect(useStore.getState().workouts).toHaveLength(1)
    })
  })

  describe('deleteWorkout', () => {
    it('should call deleteWorkout API and remove from store', async () => {
      useStore.setState({ workouts: [{ id: 'w-1' }] as any })
      mockApi.deleteWorkout.mockResolvedValue(undefined)

      await useStore.getState().deleteWorkout('w-1')

      expect(useStore.getState().workouts).toHaveLength(0)
    })
  })

  describe('addEvaluation', () => {
    it('should call createEvaluation API and add to store', async () => {
      const evaluation = { id: 'e-1', clientId: 'c1', date: '2025-02-01', weight: 65 }
      mockApi.createEvaluation.mockResolvedValue(evaluation)

      await useStore.getState().addEvaluation({ clientId: 'c1', date: '2025-02-01', weight: 65 } as any)

      expect(useStore.getState().evaluations).toHaveLength(1)
    })
  })

  describe('addPlan', () => {
    it('should call createPlan API and add to store', async () => {
      const plan = { id: 'p-1', type: 'PRESENCIAL', name: 'Básico', sessionsPerWeek: 3, price: 200 }
      mockApi.createPlan.mockResolvedValue(plan)

      await useStore.getState().addPlan({ type: 'PRESENCIAL', name: 'Básico', sessionsPerWeek: 3, price: 200 } as any)

      expect(useStore.getState().plans).toHaveLength(1)
    })
  })

  describe('deletePlan', () => {
    it('should remove plan and unlink clients with that planId', async () => {
      useStore.setState({
        plans: [{ id: 'p-1' }] as any,
        clients: [{ id: 'c-1', planId: 'p-1' }, { id: 'c-2', planId: 'p-2' }] as any,
      })
      mockApi.deletePlan.mockResolvedValue(undefined)

      await useStore.getState().deletePlan('p-1')

      expect(useStore.getState().plans).toHaveLength(0)
      expect(useStore.getState().clients[0].planId).toBeUndefined()
      expect(useStore.getState().clients[1].planId).toBe('p-2')
    })
  })

  describe('updateLocale', () => {
    it('should call updateLanguage API and set locale in store', async () => {
      mockApi.updateLanguage.mockResolvedValue({ language: 'en' })

      await useStore.getState().updateLocale('en')

      expect(mockApi.updateLanguage).toHaveBeenCalledWith('en')
    })
  })
})
