// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'

import { useScheduleStore } from './scheduleStore'

describe('scheduleStore', () => {
  beforeEach(() => {
    useScheduleStore.setState({ sessions: [] })
  })

  it('should initialize with empty sessions array', () => {
    expect(useScheduleStore.getState().sessions).toEqual([])
  })

  it('should manage schedule state correctly', () => {
    const session = { id: '1', clientId: 'c1', clientName: 'Maria', date: '2026-03-20', time: '10:00', durationMinutes: 60, status: 'Scheduled' as const, type: 'In-Person' as const, completed: false }
    useScheduleStore.getState()._addSession(session)
    expect(useScheduleStore.getState().sessions).toEqual([session])
  })
})
