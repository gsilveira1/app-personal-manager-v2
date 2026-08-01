// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../services/api/apiService', () => ({
  createSession: vi.fn(),
  createRecurringSessions: vi.fn(),
  createRecurringEvent: vi.fn(),
  deleteRecurringSeries: vi.fn(),
  upsertSessionException: vi.fn(),
  updateSession: vi.fn(),
  updateSessionWithScope: vi.fn(),
  getSessionsForRange: vi.fn(),
  toggleSessionComplete: vi.fn(),
}))

import * as api from '../services/api/apiService'
import { useScheduleStore } from './scheduleStore'

const mockApi = api as Record<string, ReturnType<typeof vi.fn>>

describe('scheduleStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useScheduleStore.setState({ sessions: [] })
  })

  it('should initialize with empty sessions array', () => {
    expect(useScheduleStore.getState().sessions).toEqual([])
  })

  it('should manage schedule state correctly (sync)', () => {
    const session = { id: '1', clientId: 'c1', clientName: 'Maria', date: '2026-03-20', time: '10:00', durationMinutes: 60, status: 'Scheduled' as const, type: 'In-Person' as const, completed: false }
    useScheduleStore.getState()._addSession(session)
    expect(useScheduleStore.getState().sessions).toEqual([session])
  })

  describe('addSession', () => {
    it('should call createSession API and add to store', async () => {
      const session = { id: 'sess-1', clientId: 'c1', date: '2025-02-01', durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: false }
      mockApi.createSession.mockResolvedValue(session)

      await useScheduleStore.getState().addSession({ clientId: 'c1', date: '2025-02-01', durationMinutes: 60, type: 'In-Person', category: 'Workout' } as any)

      expect(useScheduleStore.getState().sessions).toHaveLength(1)
    })
  })

  describe('addRecurringSessions', () => {
    it('should create recurring sessions and add all to store', async () => {
      const sessions = [{ id: 's1' }, { id: 's2' }]
      mockApi.createRecurringSessions.mockResolvedValue(sessions)

      await useScheduleStore.getState().addRecurringSessions(
        { clientId: 'c1', durationMinutes: 60, type: 'In-Person', category: 'Workout' } as any,
        '2025-01-01', 'weekly', '2025-02-01',
      )

      expect(useScheduleStore.getState().sessions).toHaveLength(2)
    })
  })

  describe('deleteRecurringSeries', () => {
    it('should remove sessions by recurringEventId or recurrenceId', async () => {
      useScheduleStore.setState({ sessions: [
        { id: 's1', recurringEventId: 're1' },
        { id: 's2', recurrenceId: 're1' },
        { id: 's3', recurringEventId: 'other' },
      ] as any })
      mockApi.deleteRecurringSeries.mockResolvedValue(undefined)

      await useScheduleStore.getState().deleteRecurringSeries('re1')

      expect(useScheduleStore.getState().sessions).toHaveLength(1)
      expect(useScheduleStore.getState().sessions[0].id).toBe('s3')
    })
  })

  describe('toggleSessionComplete', () => {
    it('should call API and update session in store', async () => {
      const session = { id: 'sess-1', completed: false }
      useScheduleStore.setState({ sessions: [session] as any })

      const updated = { ...session, completed: true }
      mockApi.toggleSessionComplete.mockResolvedValue(updated)

      await useScheduleStore.getState().toggleSessionComplete('sess-1')

      expect(useScheduleStore.getState().sessions[0].completed).toBe(true)
    })
  })

  describe('fetchSessionsForRange', () => {
    it('should replace sessions in store', async () => {
      useScheduleStore.setState({ sessions: [{ id: 'old' }] as any })
      mockApi.getSessionsForRange.mockResolvedValue([{ id: 'new' }])

      await useScheduleStore.getState().fetchSessionsForRange(new Date(), new Date())

      expect(useScheduleStore.getState().sessions).toEqual([{ id: 'new' }])
    })
  })
})
