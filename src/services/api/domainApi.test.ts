// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../utils/apiClient', () => {
  class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  }
  return { default: vi.fn(), ApiError, API_BASE_URL: 'http://api.test/api' }
})

import apiClient from '../../utils/apiClient'
import * as api from './apiService'
import * as messagingApi from './messagingApi'

const client = vi.mocked(apiClient)

const lastCall = () => {
  const [path, options] = client.mock.calls[client.mock.calls.length - 1]
  return {
    path,
    method: options?.method ?? 'GET',
    body: options?.body ? JSON.parse(options.body as string) : undefined,
  }
}

const sheetWire = (overrides: Record<string, unknown> = {}) => ({
  id: 'sheet-1',
  name: 'Ficha',
  active: true,
  isTemplate: false,
  clientId: 'c1',
  description: null,
  tags: [],
  workouts: [],
  ...overrides,
})
const sessionWire = (overrides: Record<string, unknown> = {}) => ({
  id: 's1',
  date: '2026-10-05T13:00:00.000Z',
  durationMinutes: 60,
  type: 'In-Person',
  category: 'Workout',
  completed: false,
  clientId: 'c1',
  ...overrides,
})
const page = (items: unknown[], totalPages = 1, pageNumber = 1) => ({
  items,
  total: items.length,
  page: pageNumber,
  totalPages,
})

beforeEach(() => {
  client.mockReset()
  client.mockResolvedValue({} as never)
})

describe('crm API layer (contract v2 §6.2)', () => {
  it('reads GET /clients as a page and passes the filters through', async () => {
    client.mockResolvedValue(page([{ id: 'c1', name: 'Maria', goal: null, activeWorkoutSheet: null }]) as never)

    const result = await api.getClients({ page: 2, limit: 50, search: 'ma', status: 'ACTIVE' })

    expect(lastCall().path).toBe('/clients?page=2&limit=50&search=ma&status=ACTIVE')
    expect(result.items[0]).toMatchObject({ id: 'c1', name: 'Maria', activeWorkoutSheet: null })
    expect(result.total).toBe(1)
  })

  it('walks every page at the maximum page size to load all clients', async () => {
    client.mockResolvedValueOnce(page([{ id: 'c1' }, { id: 'c2' }], 2, 1) as never).mockResolvedValueOnce(page([{ id: 'c3' }], 2, 2) as never)

    const all = await api.getAllClients()

    expect(client.mock.calls.map(([path]) => path)).toEqual(['/clients?page=1&limit=500', '/clients?page=2&limit=500'])
    expect(all.map((c) => c.id)).toEqual(['c1', 'c2', 'c3'])
  })

  it('creates a client with the whitelisted body and returns the welcome-message outcome', async () => {
    client.mockResolvedValue({ id: 'c9', name: 'Ana', welcomeMessage: 'FAILED' } as never)

    const result = await api.createClient({
      name: 'Ana',
      email: 'ana@test.com',
      phone: '1',
      status: 'ACTIVE',
      modality: 'ONLINE',
      subscriptionStatus: 'ACTIVE',
      activeWorkoutSheet: null,
    } as never)

    expect(lastCall()).toEqual({
      path: '/clients',
      method: 'POST',
      body: { name: 'Ana', email: 'ana@test.com', phone: '1', status: 'ACTIVE', modality: 'ONLINE' },
    })
    expect(result.welcomeMessage).toBe('FAILED')
    expect(result.client).toMatchObject({ id: 'c9', name: 'Ana' })
    expect(result.client).not.toHaveProperty('welcomeMessage')
  })

  it.each([
    ['updateClientStatus', () => api.updateClientStatus('c1', 'PAUSED'), '/clients/c1/status', 'PATCH', { status: 'PAUSED' }],
    [
      'recordPayment',
      () => api.recordPayment('c1', { amount: 150, method: 'PIX', periodEnd: '2026-11-03T23:59:59.000Z' }),
      '/clients/c1/payments',
      'POST',
      { amount: 150, method: 'PIX', periodEnd: '2026-11-03T23:59:59.000Z' },
    ],
    ['convertLead', () => api.convertLead('c1', 'plan-1'), '/clients/c1/convert', 'PATCH', { planId: 'plan-1' }],
    ['getWorkoutMagicLink', () => api.getWorkoutMagicLink('c1'), '/clients/c1/magic-link', 'POST', undefined],
  ])('%s calls the v2 route', async (_name, call, path, method, body) => {
    client.mockResolvedValue({ client: {}, payment: {} } as never)

    await call()

    expect(lastCall()).toEqual({ path, method, body })
  })

  it('reads the heatmap and the CSV from the client routes', async () => {
    await api.getActivityHeatmap('c1', 14)

    expect(lastCall().path).toBe('/clients/c1/activity-heatmap?days=14')
    expect(api.getExportCsvUrl()).toBe('http://api.test/api/clients/export/csv')
  })

  it('splits "resend link" by kind: anamnesis → reassessment request, workout → magic-link/send', async () => {
    client.mockResolvedValueOnce({
      message: 'Enviado',
      token: 't',
      link: 'https://app/#/anamnesis?token=t',
      notification: { status: 'QUEUED', jobId: 'j1', scheduledDelayMs: 0 },
    } as never)
    const anamnesis = await api.resendStudentLink('c1', 'ANAMNESIS')
    expect(lastCall()).toEqual({
      path: '/anamnesis/student/c1/request-reassessment',
      method: 'POST',
      body: undefined,
    })
    expect(anamnesis).toEqual({
      status: 'QUEUED',
      message: 'Enviado',
      channel: 'WHATSAPP',
      scheduledDelayMs: 0,
      link: 'https://app/#/anamnesis?token=t',
    })

    client.mockResolvedValueOnce({
      status: 'QUEUED',
      channel: 'WHATSAPP',
      jobId: 'j2',
      scheduledDelayMs: 3600000,
      link: 'https://app/#/p/slug?token=x',
      message: 'Agendado',
    } as never)
    const workout = await api.resendStudentLink('c1', 'WORKOUT_SHEET')
    expect(lastCall()).toEqual({ path: '/clients/c1/magic-link/send', method: 'POST', body: undefined })
    expect(workout).toEqual({
      status: 'QUEUED',
      message: 'Agendado',
      channel: 'WHATSAPP',
      scheduledDelayMs: 3600000,
      link: 'https://app/#/p/slug?token=x',
    })
  })

  it('sends plan features as keys and strips read-only plan fields', async () => {
    client.mockResolvedValue({ id: 'p1', durationMinutes: null } as never)

    const created = await api.createPlan({
      type: 'CONSULTORIA',
      name: 'Online',
      sessionsPerWeek: 1,
      price: 150,
      features: ['automated_pix'],
      featureIds: ['x'],
      _count: { clients: 3 },
    } as never)
    expect(lastCall()).toEqual({
      path: '/plans',
      method: 'POST',
      body: {
        type: 'CONSULTORIA',
        name: 'Online',
        sessionsPerWeek: 1,
        price: 150,
        features: ['automated_pix'],
      },
    })
    expect(created.durationMinutes).toBeUndefined()

    await api.updatePlan('p1', {
      id: 'p1',
      name: 'Novo',
      userId: 'u1',
      createdAt: 'x',
      features: [],
    } as never)
    expect(lastCall()).toEqual({ path: '/plans/p1', method: 'PATCH', body: { name: 'Novo', features: [] } })
  })

  it('reads the feature catalogue from /plan-features', async () => {
    await api.getPlanFeatures()

    expect(lastCall().path).toBe('/plan-features')
  })
})

describe('workouts API layer (contract v2 §6.3)', () => {
  it('uses the /clients/:id/workout-sheets routes', async () => {
    client.mockResolvedValue([sheetWire()] as never)
    await api.getWorkoutSheets('c1')
    expect(lastCall().path).toBe('/clients/c1/workout-sheets')

    client.mockResolvedValue(sheetWire() as never)
    await api.createWorkoutSheet('c1', {
      name: 'Ficha',
      expiresAt: '2026-11-01T00:00:00.000Z',
      workouts: [
        {
          letter: 'A',
          name: 'Peito',
          blocks: [
            {
              type: 'REGULAR',
              restTimeSeconds: 60,
              exercises: [{ exerciseName: 'Supino', sets: 4, reps: '8' }],
            },
          ],
        },
      ],
    })
    const { path, method, body } = lastCall()
    expect([path, method]).toEqual(['/clients/c1/workout-sheets', 'POST'])
    expect(body).toMatchObject({ name: 'Ficha', expiresAt: '2026-11-01T00:00:00.000Z' })
    expect(body.workouts[0].id).toEqual(expect.any(String))
    expect(body.workouts[0].blocks[0].exercises[0]).toMatchObject({
      id: expect.any(String),
      exerciseName: 'Supino',
      orderIndex: 0,
    })
  })

  it('edits and deletes sheets and templates through /workout-sheets/:id', async () => {
    client.mockResolvedValue(sheetWire() as never)

    await api.updateWorkoutSheet('sheet-1', { name: 'Renomeada', expiresAt: null })
    expect(lastCall()).toEqual({
      path: '/workout-sheets/sheet-1',
      method: 'PATCH',
      body: { name: 'Renomeada', expiresAt: null },
    })

    await api.deleteWorkoutSheet('sheet-1')
    expect(lastCall()).toEqual({ path: '/workout-sheets/sheet-1', method: 'DELETE', body: undefined })

    client.mockResolvedValue([] as never)
    await api.getExpiringWorkoutSheets()
    expect(lastCall().path).toBe('/workout-sheets/expiring')
  })

  it('serves the workout library from the template routes', async () => {
    client.mockResolvedValue([sheetWire({ id: 'tpl-1', name: 'Full Body', isTemplate: true, clientId: null, tags: ['força'] })] as never)
    const library = await api.getWorkouts()
    expect(lastCall().path).toBe('/workout-templates')
    expect(library[0]).toMatchObject({ id: 'tpl-1', title: 'Full Body', tags: ['força'], exercises: [] })

    client.mockResolvedValue(sheetWire({ id: 'tpl-2', isTemplate: true, clientId: null }) as never)
    await api.createWorkout({
      title: 'Novo',
      tags: [],
      exercises: [{ name: 'Agachamento', sets: 3, reps: '10', weight: '50kg' }],
      status: 'Active',
    })
    const created = lastCall()
    expect([created.path, created.method]).toEqual(['/workout-templates', 'POST'])
    expect(created.body).not.toHaveProperty('status')
    expect(created.body.workouts[0].blocks[0].exercises[0]).toMatchObject({
      exerciseName: 'Agachamento',
      suggestedLoadKg: 50,
    })

    await api.updateWorkout('tpl-2', { title: 'Outro nome' })
    expect(lastCall()).toEqual({
      path: '/workout-sheets/tpl-2',
      method: 'PATCH',
      body: { name: 'Outro nome' },
    })

    await api.deleteWorkout('tpl-2')
    expect(lastCall()).toEqual({ path: '/workout-sheets/tpl-2', method: 'DELETE', body: undefined })
  })

  it("creates a workout for a client as that client's workout sheet", async () => {
    client.mockResolvedValue(sheetWire({ clientId: 'c1' }) as never)

    const plan = await api.createWorkout({
      clientId: 'c1',
      title: 'Fase 1',
      tags: [],
      exercises: [{ name: 'Remada', sets: 3, reps: '12' }],
    })

    expect([lastCall().path, lastCall().method]).toEqual(['/clients/c1/workout-sheets', 'POST'])
    expect(plan.clientId).toBe('c1')
  })
})

describe('calendar API layer (contract v2 §6.4)', () => {
  it('creates a series through POST /sessions with rrule, timezone and date', async () => {
    client.mockResolvedValue(sessionWire() as never)

    await api.createRecurringEvent({
      clientId: 'c1',
      date: '2026-10-05T13:00:00.000Z',
      durationMinutes: 60,
      type: 'In-Person',
      category: 'Workout',
      rrule: 'FREQ=WEEKLY;BYDAY=MO',
      timezone: 'America/Sao_Paulo',
    })

    expect(lastCall()).toEqual({
      path: '/sessions',
      method: 'POST',
      body: {
        clientId: 'c1',
        date: '2026-10-05T13:00:00.000Z',
        durationMinutes: 60,
        type: 'In-Person',
        category: 'Workout',
        rrule: 'FREQ=WEEKLY;BYDAY=MO',
        timezone: 'America/Sao_Paulo',
      },
    })
  })

  it('writes an exception by patching the occurrence id', async () => {
    client.mockResolvedValue(sessionWire() as never)

    await api.upsertSessionException({
      recurringEventId: 'series-1',
      originalStartTime: '2026-10-05T13:00:00.000Z',
      date: '2026-10-05T15:00:00.000Z',
      notes: 'remarcada',
    })

    expect(lastCall()).toEqual({
      path: `/sessions/${encodeURIComponent('series-1_2026-10-05T13:00:00.000Z')}`,
      method: 'PATCH',
      body: { date: '2026-10-05T15:00:00.000Z', notes: 'remarcada' },
    })
  })

  it('cancels one occurrence, deletes a series and toggles completion through /sessions/:id', async () => {
    client.mockResolvedValue(sessionWire() as never)
    const occurrence = 'series-1_2026-10-05T13:00:00.000Z'

    await api.deleteSession(occurrence)
    expect(lastCall()).toEqual({
      path: `/sessions/${encodeURIComponent(occurrence)}`,
      method: 'DELETE',
      body: undefined,
    })

    await api.deleteRecurringSeries('series-1')
    expect(lastCall()).toEqual({ path: '/sessions/series-1', method: 'DELETE', body: undefined })

    await api.toggleSessionComplete(occurrence)
    expect(lastCall()).toEqual({
      path: `/sessions/${encodeURIComponent(occurrence)}/toggle-complete`,
      method: 'POST',
      body: undefined,
    })
  })

  it('never sends the client or read-only fields when updating a session', async () => {
    client.mockResolvedValue(sessionWire() as never)

    await api.updateSession('s1', { clientId: 'c2', id: 's1', notes: 'ok', linkedWorkoutId: 'w1' } as never)

    expect(lastCall()).toEqual({ path: '/sessions/s1', method: 'PATCH', body: { notes: 'ok' } })
  })

  it('sends availability blocks with the contract keys only', async () => {
    await api.createAvailabilityBlock({
      title: 'Almoço',
      dtstart: '2026-10-05T15:00:00.000Z',
      dtend: '2026-10-05T16:00:00.000Z',
      timezone: 'America/Sao_Paulo',
      rrule: null,
      notes: undefined,
    })
    expect(lastCall()).toEqual({
      path: '/availability-blocks',
      method: 'POST',
      body: {
        title: 'Almoço',
        dtstart: '2026-10-05T15:00:00.000Z',
        dtend: '2026-10-05T16:00:00.000Z',
        timezone: 'America/Sao_Paulo',
      },
    })

    await api.updateAvailabilityBlock('b1', { id: 'b1', title: 'Almoço', rrule: null } as never)
    expect(lastCall()).toEqual({
      path: '/availability-blocks/b1',
      method: 'PATCH',
      body: { title: 'Almoço', rrule: null },
    })
  })
})

describe('health API layer (contract v2 §6.5)', () => {
  it('sends an evaluation without the fields the API does not know', async () => {
    await api.createEvaluation({
      clientId: 'c1',
      date: '2026-10-03',
      weight: 70,
      bodyFatPercentage: 18,
      idealWeight: 68,
      absoluteBodyFat: 12,
      perimeters: { waist: 80 },
    } as never)
    expect(lastCall()).toEqual({
      path: '/evaluations',
      method: 'POST',
      body: {
        clientId: 'c1',
        date: '2026-10-03',
        weight: 70,
        bodyFatPercentage: 18,
        perimeters: { waist: 80 },
      },
    })

    await api.updateEvaluation('e1', { id: 'e1', clientId: 'c1', weight: 71, createdAt: 'x' } as never)
    expect(lastCall()).toEqual({ path: '/evaluations/e1', method: 'PATCH', body: { weight: 71 } })
  })
})

describe('messaging API layer (contract v2 §6.6, §9)', () => {
  it('reads the audit log, the pending queue and a client history from the v2 routes', async () => {
    await messagingApi.getMessageLogs({
      status: 'FAILED',
      channel: 'WHATSAPP',
      search: '5553',
      page: 2,
      limit: 10,
    })
    expect(lastCall().path).toBe('/messaging/logs?status=FAILED&channel=WHATSAPP&search=5553&page=2&limit=10')

    await messagingApi.getPendingMessages()
    expect(lastCall().path).toBe('/messaging/pending')

    await messagingApi.getClientMessageHistory('c1')
    expect(lastCall().path).toBe('/clients/c1/messages')
  })

  it('flushes and cancels pending jobs', async () => {
    await messagingApi.flushPendingMessages()
    expect(lastCall()).toEqual({ path: '/messaging/pending/flush', method: 'POST', body: undefined })

    await messagingApi.cancelPendingMessage('job-1')
    expect(lastCall()).toEqual({ path: '/messaging/pending/job-1', method: 'DELETE', body: undefined })
  })
})

describe('removed routes have no caller left', () => {
  it('drops the functions of the routes contract v2 removes', () => {
    const removed = [
      'getStudents',
      'createStudent',
      'recordManualPayment',
      'updateStudentStatus',
      'updateSessionWithScope',
      'getSystemFeatures',
      'getActiveSystemFeatures',
      'createSystemFeature',
      'updateSystemFeature',
      'deleteSystemFeature',
    ]
    for (const name of removed) expect(api).not.toHaveProperty(name)
    for (const name of ['getTenantQueue', 'retryMessage', 'cancelMessage', 'processPendingQueue']) expect(messagingApi).not.toHaveProperty(name)
  })
})
