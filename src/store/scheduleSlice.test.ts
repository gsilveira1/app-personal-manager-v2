// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('./store', () => ({}))

import { createScheduleSlice, type ScheduleSlice } from './scheduleSlice'
import { type Session } from '../types'

const createTestStore = () => {
  let state: ScheduleSlice = {} as ScheduleSlice
  const set = (partial: Partial<ScheduleSlice> | ((s: ScheduleSlice) => Partial<ScheduleSlice>)) => {
    if (typeof partial === 'function') {
      state = { ...state, ...partial(state) }
    } else {
      state = { ...state, ...partial }
    }
  }
  const get = () => state
  state = createScheduleSlice(set as any, get as any, {} as any)
  return { getState: () => state }
}

const makeSession = (id: string, overrides: Partial<Session> = {}): Session => ({
  id,
  clientId: 'client-1',
  date: '2025-02-01T10:00:00Z',
  durationMinutes: 60,
  type: 'In-Person',
  category: 'Workout',
  completed: false,
  ...overrides,
})

describe('scheduleSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('should initialize with empty sessions array', () => {
    expect(store.getState().sessions).toEqual([])
  })

  it('_setSessions should replace entire array', () => {
    const sessions = [makeSession('1'), makeSession('2')]
    store.getState()._setSessions(sessions)
    expect(store.getState().sessions).toEqual(sessions)
  })

  it('_addSession should append one session', () => {
    store.getState()._addSession(makeSession('1'))
    expect(store.getState().sessions).toHaveLength(1)
  })

  it('_addSessions should append multiple sessions', () => {
    store.getState()._addSession(makeSession('1'))
    store.getState()._addSessions([makeSession('2'), makeSession('3')])
    expect(store.getState().sessions).toHaveLength(3)
  })

  it('_updateSession should replace matching session by id', () => {
    store.getState()._setSessions([makeSession('1')])
    store.getState()._updateSession(makeSession('1', { completed: true }))
    expect(store.getState().sessions[0].completed).toBe(true)
  })

  it('_updateSessionSeries should replace sessions with matching recurrenceId', () => {
    const recId = 'rec-1'
    store.getState()._setSessions([
      makeSession('1', { recurrenceId: recId }),
      makeSession('2', { recurrenceId: recId }),
      makeSession('3'), // no recurrenceId — should survive
    ])

    const updated = [makeSession('4', { recurrenceId: recId, notes: 'Updated' })]
    store.getState()._updateSessionSeries(updated, recId)

    const sessions = store.getState().sessions
    expect(sessions).toHaveLength(2) // 1 original (id 3) + 1 updated (id 4)
    expect(sessions.find(s => s.id === '3')).toBeDefined()
    expect(sessions.find(s => s.id === '4')).toBeDefined()
  })
})
