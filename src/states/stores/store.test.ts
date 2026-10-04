// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../services/api/apiService', () => ({
  getAllClients: vi.fn(),
  getEvaluations: vi.fn(),
  getPlans: vi.fn(),
  getSessions: vi.fn(),
  getWorkouts: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  deleteClient: vi.fn(),
  convertLead: vi.fn(),
  getAvatarUploadUrl: vi.fn(),
  createSession: vi.fn(),
  createRecurringEvent: vi.fn(),
  deleteRecurringSeries: vi.fn(),
  upsertSessionException: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  getSessionsForRange: vi.fn(),
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
  updateAiInstructions: vi.fn(),
  updateLanguage: vi.fn(),
  getAiInstructions: vi.fn(),
  getLanguage: vi.fn(),
  getPlanFeatures: vi.fn(),
  updateClientStatus: vi.fn(),
  recordPayment: vi.fn(),
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  getSettings: vi.fn(),
}))

vi.mock('../../utils/uploadToGcs', () => ({
  uploadFileToGcs: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./auth/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      logout: vi.fn(),
    })),
  },
}))

vi.mock('../../i18n/index', () => ({
  SUPPORTED_LOCALES: ['pt-BR', 'en'],
  i18n: {
    changeLanguage: vi.fn().mockResolvedValue(undefined),
  },
}))

import * as api from '../../services/api/apiService'
import { ApiError } from '../../utils/apiClient'
import { useAuthStore } from './auth/authStore'
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
      mockApi.getAllClients.mockResolvedValue([{ id: '1', name: 'Maria' }])
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
      mockApi.getAllClients.mockRejectedValue(new Error('Network error'))
      mockApi.getEvaluations.mockResolvedValue([])
      mockApi.getPlans.mockResolvedValue([])
      mockApi.getSessions.mockResolvedValue([])
      mockApi.getWorkouts.mockResolvedValue([])

      await useStore.getState().fetchInitialData()

      expect(useStore.getState().appState).toBe('error')
      expect(useStore.getState().errorMessage).toBe('Network error')
    })

    it('ends the session before going back to idle when the API answers 401', async () => {
      // 'idle' with a live session makes ProtectedRoute load again: the session must be gone first
      mockApi.getAllClients.mockRejectedValue(new ApiError('Unauthorized', 401))
      mockApi.getEvaluations.mockResolvedValue([])
      mockApi.getPlans.mockResolvedValue([])
      mockApi.getSessions.mockResolvedValue([])
      mockApi.getWorkouts.mockResolvedValue([])
      vi.spyOn(console, 'error').mockImplementation(() => {})

      let sessionEnded = false
      const appStateWhileLoggingOut: string[] = []
      const logout = vi.fn(async () => {
        appStateWhileLoggingOut.push(useStore.getState().appState)
        await new Promise((resolve) => setTimeout(resolve, 0))
        appStateWhileLoggingOut.push(useStore.getState().appState)
        sessionEnded = true
      })
      vi.mocked(useAuthStore.getState).mockReturnValue({ logout } as never)

      await useStore.getState().fetchInitialData()

      expect(logout).toHaveBeenCalledTimes(1)
      expect(sessionEnded).toBe(true)
      expect(appStateWhileLoggingOut).toEqual(['loading', 'loading'])
      expect(useStore.getState().appState).toBe('idle')
      expect(useStore.getState().errorMessage).toBeNull()
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
      const newClient = { id: 'new-1', name: 'João', email: 'joao@test.com', phone: '123', status: 'ACTIVE', modality: 'PRESENCIAL' }
      mockApi.createClient.mockResolvedValue({ client: newClient, welcomeMessage: 'QUEUED' })

      const outcome = await useStore.getState().addClient({ name: 'João', email: 'joao@test.com', phone: '123', status: 'ACTIVE', modality: 'PRESENCIAL' } as any)

      expect(outcome).toBe('QUEUED')
      expect(mockApi.createClient).toHaveBeenCalled()
      expect(useStore.getState().clients).toHaveLength(1)
      expect(useStore.getState().clients[0].id).toBe('new-1')
    })
  })

  describe('updateClient', () => {
    it('should call updateClient API and update in store', async () => {
      const client = { id: '1', name: 'Maria', email: 'maria@test.com', phone: '123', status: 'ACTIVE', modality: 'PRESENCIAL' }
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
        clients: [
          { id: 'c-1', planId: 'p-1' },
          { id: 'c-2', planId: 'p-2' },
        ] as any,
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

  describe('addClient with custom plan', () => {
    it('should create plan first then client with planId', async () => {
      const plan = { id: 'p-new', name: 'Custom', type: 'PRESENCIAL', sessionsPerWeek: 3, price: 300 }
      mockApi.createPlan.mockResolvedValue(plan)
      mockApi.createClient.mockResolvedValue({ client: { id: 'c-new', name: 'Test', planId: 'p-new' }, welcomeMessage: 'SKIPPED' })

      await useStore
        .getState()
        .addClient({ name: 'Test', email: 't@t.com', phone: '1', status: 'ACTIVE', modality: 'PRESENCIAL' } as any, { name: 'Custom', type: 'PRESENCIAL', sessionsPerWeek: 3, price: 300 } as any)

      expect(mockApi.createPlan).toHaveBeenCalled()
      expect(mockApi.createClient).toHaveBeenCalled()
      expect(useStore.getState().clients[0].planId).toBe('p-new')
    })
  })

  describe('uploadClientAvatar', () => {
    it('should get upload URL, upload file, and update client', async () => {
      useStore.setState({ clients: [{ id: 'c1', name: 'Test' }] as any })
      mockApi.getAvatarUploadUrl.mockResolvedValue({ uploadUrl: 'https://upload.url', publicUrl: 'https://public.url' })
      mockApi.updateClient.mockResolvedValue({ id: 'c1', name: 'Test', avatar: 'https://public.url' })

      const file = new File(['img'], 'avatar.jpg', { type: 'image/jpeg' })
      await useStore.getState().uploadClientAvatar('c1', file)

      expect(mockApi.getAvatarUploadUrl).toHaveBeenCalledWith('c1', 'image/jpeg')
      expect(useStore.getState().clients[0].avatar).toBe('https://public.url')
    })
  })

  describe('addRecurringEvent', () => {
    it('should call createRecurringEvent API', async () => {
      mockApi.createRecurringEvent.mockResolvedValue({ id: 're1' })

      await useStore.getState().addRecurringEvent({
        rrule: 'FREQ=WEEKLY',
        timezone: 'America/Sao_Paulo',
        date: '2025-01-01T10:00:00.000Z',
        durationMinutes: 60,
        type: 'In-Person',
        category: 'Workout',
        clientId: 'c1',
      })

      expect(mockApi.createRecurringEvent).toHaveBeenCalled()
    })
  })

  describe('deleteRecurringSeries', () => {
    it('should remove every occurrence and exception of the series', async () => {
      useStore.setState({
        sessions: [
          { id: 're1_2025-01-01T10:00:00.000Z', recurringEventId: 're1' },
          { id: 'exception-uuid', recurrenceId: 're1' },
          { id: 's3', recurringEventId: 'other' },
        ] as any,
      })
      mockApi.deleteRecurringSeries.mockResolvedValue(undefined)

      await useStore.getState().deleteRecurringSeries('re1')

      expect(mockApi.deleteRecurringSeries).toHaveBeenCalledWith('re1')
      expect(useStore.getState().sessions.map((s) => s.id)).toEqual(['s3'])
    })
  })

  describe('deleteSession', () => {
    it('should remove a one-off session', async () => {
      useStore.setState({ sessions: [{ id: 's1' }, { id: 's2' }] as any })
      mockApi.deleteSession.mockResolvedValue(undefined)

      await useStore.getState().deleteSession('s1')

      expect(mockApi.deleteSession).toHaveBeenCalledWith('s1')
      expect(useStore.getState().sessions.map((s) => s.id)).toEqual(['s2'])
    })

    it('should remove only the cancelled occurrence when given an occurrence id', async () => {
      useStore.setState({
        sessions: [
          { id: 're1_2025-01-01T10:00:00.000Z', recurringEventId: 're1' },
          { id: 're1_2025-01-08T10:00:00.000Z', recurringEventId: 're1' },
        ] as any,
      })
      mockApi.deleteSession.mockResolvedValue(undefined)

      await useStore.getState().deleteSession('re1_2025-01-01T10:00:00.000Z')

      expect(useStore.getState().sessions.map((s) => s.id)).toEqual(['re1_2025-01-08T10:00:00.000Z'])
    })

    it('should remove the whole series when given the series master id', async () => {
      useStore.setState({ sessions: [{ id: 're1_2025-01-01T10:00:00.000Z', recurringEventId: 're1' }, { id: 's9' }] as any })
      mockApi.deleteSession.mockResolvedValue(undefined)

      await useStore.getState().deleteSession('re1')

      expect(useStore.getState().sessions.map((s) => s.id)).toEqual(['s9'])
    })
  })

  describe('upsertSessionException', () => {
    const first = '2025-01-01T10:00:00.000Z'
    const second = '2025-01-08T10:00:00.000Z'

    it('should remove cancelled occurrence from store', async () => {
      useStore.setState({
        sessions: [
          { id: `re1_${first}`, recurringEventId: 're1', originalStartTime: first },
          { id: `re1_${second}`, recurringEventId: 're1', originalStartTime: second },
        ] as any,
      })
      mockApi.upsertSessionException.mockResolvedValue({ id: 'se1', cancelled: true })

      await useStore.getState().upsertSessionException({ recurringEventId: 're1', originalStartTime: first, cancelled: true })

      expect(useStore.getState().sessions.map((s) => s.id)).toEqual([`re1_${second}`])
    })

    it('should replace the occurrence with the stored exception when not cancelled', async () => {
      useStore.setState({ sessions: [{ id: `re1_${first}`, recurringEventId: 're1', originalStartTime: first, notes: 'old' }] as any })
      mockApi.upsertSessionException.mockResolvedValue({ id: 'se1', recurringEventId: 're1', originalStartTime: first, notes: 'new' })

      await useStore.getState().upsertSessionException({ recurringEventId: 're1', originalStartTime: first, notes: 'new' })

      expect(useStore.getState().sessions).toHaveLength(1)
      expect(useStore.getState().sessions[0].notes).toBe('new')
    })
  })

  describe('updateSession', () => {
    it('should update session in store', async () => {
      useStore.setState({ sessions: [{ id: 's1', notes: 'old' }] as any })
      mockApi.updateSession.mockResolvedValue({ id: 's1', notes: 'new' })

      await useStore.getState().updateSession('s1', { notes: 'new' })

      expect(useStore.getState().sessions[0].notes).toBe('new')
    })

    it('should replace an occurrence even when the API answers with the exception id', async () => {
      const occurrence = 're1_2025-01-01T10:00:00.000Z'
      useStore.setState({ sessions: [{ id: occurrence, recurringEventId: 're1', date: '2025-01-01T10:00:00.000Z' }] as any })
      mockApi.updateSession.mockResolvedValue({ id: 'exception-uuid', recurringEventId: 're1', exceptionId: 'exception-uuid', date: '2025-01-01T12:00:00.000Z' })

      await useStore.getState().updateSession(occurrence, { date: '2025-01-01T12:00:00.000Z' })

      expect(mockApi.updateSession).toHaveBeenCalledWith(occurrence, { date: '2025-01-01T12:00:00.000Z' })
      expect(useStore.getState().sessions).toHaveLength(1)
      expect(useStore.getState().sessions[0].date).toBe('2025-01-01T12:00:00.000Z')
    })

    it('should drop a session the update cancelled', async () => {
      useStore.setState({ sessions: [{ id: 's1' }] as any })
      mockApi.updateSession.mockResolvedValue({ id: 's1', cancelled: true })

      await useStore.getState().updateSession('s1', { cancelled: true })

      expect(useStore.getState().sessions).toHaveLength(0)
    })
  })

  describe('fetchSessionsForRange', () => {
    it('should replace sessions in store', async () => {
      useStore.setState({ sessions: [{ id: 'old' }] as any })
      mockApi.getSessionsForRange.mockResolvedValue([{ id: 'new' }])

      await useStore.getState().fetchSessionsForRange(new Date(), new Date())

      expect(useStore.getState().sessions).toEqual([{ id: 'new' }])
    })
  })

  describe('updateWorkout', () => {
    it('should update workout in store', async () => {
      useStore.setState({ workouts: [{ id: 'w1', name: 'Old' }] as any })
      mockApi.updateWorkout.mockResolvedValue({ id: 'w1', name: 'New' })

      await useStore.getState().updateWorkout('w1', { name: 'New' })

      expect(useStore.getState().workouts[0].name).toBe('New')
    })
  })

  describe('updateEvaluation', () => {
    it('should update evaluation in store', async () => {
      useStore.setState({ evaluations: [{ id: 'e1', weight: 80 }] as any })
      mockApi.updateEvaluation.mockResolvedValue({ id: 'e1', weight: 75 })

      await useStore.getState().updateEvaluation('e1', { weight: 75 })

      expect(useStore.getState().evaluations[0].weight).toBe(75)
    })
  })

  describe('deleteEvaluation', () => {
    it('should remove evaluation from store', async () => {
      useStore.setState({ evaluations: [{ id: 'e1' }] as any })
      mockApi.deleteEvaluation.mockResolvedValue(undefined)

      await useStore.getState().deleteEvaluation('e1')

      expect(useStore.getState().evaluations).toHaveLength(0)
    })
  })

  describe('updatePlan', () => {
    it('should update plan in store', async () => {
      useStore.setState({ plans: [{ id: 'p1', name: 'Old' }] as any })
      mockApi.updatePlan.mockResolvedValue({ id: 'p1', name: 'New' })

      await useStore.getState().updatePlan('p1', { name: 'New' })

      expect(useStore.getState().plans[0].name).toBe('New')
    })
  })

  describe('updateAiPromptInstructions', () => {
    it('should call API and update store', async () => {
      mockApi.updateAiInstructions.mockResolvedValue(undefined)

      await useStore.getState().updateAiPromptInstructions('new instructions')

      expect(mockApi.updateAiInstructions).toHaveBeenCalledWith('new instructions')
      expect(useStore.getState().aiPromptInstructions).toBe('new instructions')
    })
  })

  describe('plan feature catalogue', () => {
    it('fetchPlanFeatures loads the catalogue', async () => {
      mockApi.getPlanFeatures.mockResolvedValue([{ key: 'automated_pix', name: 'PIX automático', description: '' }])

      await useStore.getState().fetchPlanFeatures()

      expect(useStore.getState().planFeatures).toEqual([{ key: 'automated_pix', name: 'PIX automático', description: '' }])
    })
  })

  describe('client status and payments', () => {
    it('setClientStatus updates the client with the API answer', async () => {
      useStore.setState({ clients: [{ id: 'c1', status: 'ACTIVE', activeWorkoutSheet: { id: 'sh1', name: 'Ficha' } }] as any })
      mockApi.updateClientStatus.mockResolvedValue({ id: 'c1', status: 'PAUSED' })

      await useStore.getState().setClientStatus('c1', 'PAUSED')

      expect(mockApi.updateClientStatus).toHaveBeenCalledWith('c1', 'PAUSED')
      expect(useStore.getState().clients[0].status).toBe('PAUSED')
      // list-only fields survive an update that does not carry them
      expect(useStore.getState().clients[0].activeWorkoutSheet).toEqual({ id: 'sh1', name: 'Ficha' })
    })

    it('recordClientPayment stores the client the API activated', async () => {
      useStore.setState({ clients: [{ id: 'c1', status: 'OVERDUE' }] as any })
      const payment = { amount: 150, method: 'PIX' as const, periodEnd: '2026-11-03T23:59:59.000Z' }
      mockApi.recordPayment.mockResolvedValue({ message: 'ok', payment: { id: 'pay1' }, client: { id: 'c1', status: 'ACTIVE', currentPeriodEnd: payment.periodEnd, subscriptionStatus: 'ACTIVE' } })

      await useStore.getState().recordClientPayment('c1', payment)

      expect(mockApi.recordPayment).toHaveBeenCalledWith('c1', payment)
      expect(useStore.getState().clients[0]).toMatchObject({ status: 'ACTIVE', currentPeriodEnd: payment.periodEnd, subscriptionStatus: 'ACTIVE' })
    })
  })

  describe('fetchInitialData with 401', () => {
    it('should logout on 401 error', async () => {
      const { ApiError } = await import('../../utils/apiClient')
      mockApi.getAllClients.mockRejectedValue(new ApiError('Unauthorized', 401))
      mockApi.getEvaluations.mockResolvedValue([])
      mockApi.getPlans.mockResolvedValue([])
      mockApi.getSessions.mockResolvedValue([])
      mockApi.getWorkouts.mockResolvedValue([])

      await useStore.getState().fetchInitialData()

      expect(useStore.getState().appState).toBe('idle')
    })
  })
})
