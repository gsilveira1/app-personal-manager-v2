// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'

import { createScheduleSlice, type ScheduleSlice } from './scheduleSlice'

const createTestStore = () => create<ScheduleSlice>()((...a) => ({ ...createScheduleSlice(...a) }))

describe('scheduleSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('should initialize with empty sessions array', () => {
    expect(store.getState().sessions).toEqual([])
  })

  it('_setSessions should replace entire array', () => {
    const sessions = [
      { id: '1', clientId: 'c1', clientName: 'Maria', date: '2026-03-20', time: '10:00', durationMinutes: 60, status: 'Scheduled' as const, type: 'In-Person' as const, completed: false },
    ]
    store.getState()._setSessions(sessions)
    expect(store.getState().sessions).toEqual(sessions)
  })

  it('_addSession should append to array', () => {
    const session = { id: '1', clientId: 'c1', clientName: 'Maria', date: '2026-03-20', time: '10:00', durationMinutes: 60, status: 'Scheduled' as const, type: 'In-Person' as const, completed: false }
    store.getState()._addSession(session)
    expect(store.getState().sessions).toHaveLength(1)
  })

  it('_addSessions should append multiple sessions', () => {
    const s1 = { id: '1', clientId: 'c1', clientName: 'Maria', date: '2026-03-20', time: '10:00', durationMinutes: 60, status: 'Scheduled' as const, type: 'In-Person' as const, completed: false }
    const s2 = { id: '2', clientId: 'c2', clientName: 'João', date: '2026-03-21', time: '11:00', durationMinutes: 60, status: 'Scheduled' as const, type: 'Online' as const, completed: false }

    store.getState()._addSessions([s1, s2])
    expect(store.getState().sessions).toHaveLength(2)
  })

  it('_updateSession should update matching session', () => {
    const session = { id: '1', clientId: 'c1', clientName: 'Maria', date: '2026-03-20', time: '10:00', durationMinutes: 60, status: 'Scheduled' as const, type: 'In-Person' as const, completed: false }
    store.getState()._setSessions([session])

    const updated = { ...session, completed: true }
    store.getState()._updateSession(updated)
    expect(store.getState().sessions[0].completed).toBe(true)
  })

  it('_updateSessionSeries should replace sessions matching recurrenceId', () => {
    const s1 = {
      id: '1',
      recurrenceId: 'r1',
      clientId: 'c1',
      clientName: 'Maria',
      date: '2026-03-20',
      time: '10:00',
      durationMinutes: 60,
      status: 'Scheduled' as const,
      type: 'In-Person' as const,
      completed: false,
    }
    const s2 = {
      id: '2',
      recurrenceId: 'r2',
      clientId: 'c2',
      clientName: 'João',
      date: '2026-03-21',
      time: '11:00',
      durationMinutes: 60,
      status: 'Scheduled' as const,
      type: 'Online' as const,
      completed: false,
    }

    store.getState()._setSessions([s1, s2])

    const updatedS1 = { ...s1, time: '14:00' }
    store.getState()._updateSessionSeries([updatedS1], 'r1')

    expect(store.getState().sessions).toHaveLength(2)
    const found = store.getState().sessions.find((s) => s.id === '1')
    expect(found?.time).toBe('14:00')
  })
})
