// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { isTimeSlotTaken, findSchedulingConflicts } from './scheduleUtils'
import { type Session } from '../types'

const makeSession = (overrides: Partial<Session> & { id: string; date: string; durationMinutes: number }): Session => ({
  clientId: 'client-1',
  type: 'In-Person',
  category: 'Workout',
  completed: false,
  ...overrides,
})

describe('isTimeSlotTaken', () => {
  const sessions: Session[] = [
    makeSession({ id: '1', date: '2025-01-10T10:00:00.000Z', durationMinutes: 60 }), // 10:00–11:00
    makeSession({ id: '2', date: '2025-01-10T14:00:00.000Z', durationMinutes: 60 }), // 14:00–15:00
  ]

  it('should return null when no conflict exists', () => {
    const start = new Date('2025-01-10T12:00:00.000Z') // 12:00–13:00
    expect(isTimeSlotTaken(sessions, start, 60)).toBeNull()
  })

  it('should detect exact overlap', () => {
    const start = new Date('2025-01-10T10:00:00.000Z')
    expect(isTimeSlotTaken(sessions, start, 60)).toEqual(sessions[0])
  })

  it('should detect partial overlap (new starts before existing ends)', () => {
    const start = new Date('2025-01-10T10:30:00.000Z') // 10:30–11:30 overlaps 10:00–11:00
    expect(isTimeSlotTaken(sessions, start, 60)).toEqual(sessions[0])
  })

  it('should detect partial overlap (new ends after existing starts)', () => {
    const start = new Date('2025-01-10T09:30:00.000Z') // 09:30–10:30 overlaps 10:00–11:00
    expect(isTimeSlotTaken(sessions, start, 60)).toEqual(sessions[0])
  })

  it('should not report adjacent sessions as conflicting (end == start)', () => {
    const start = new Date('2025-01-10T11:00:00.000Z') // 11:00–12:00 right after 10:00–11:00
    expect(isTimeSlotTaken(sessions, start, 60)).toBeNull()
  })

  it('should not report adjacent sessions as conflicting (new ends at existing start)', () => {
    const start = new Date('2025-01-10T09:00:00.000Z') // 09:00–10:00 right before 10:00–11:00
    expect(isTimeSlotTaken(sessions, start, 60)).toBeNull()
  })

  it('should exclude a session by id when editing', () => {
    const start = new Date('2025-01-10T10:00:00.000Z')
    expect(isTimeSlotTaken(sessions, start, 60, '1')).toBeNull()
  })

  it('should still find conflicts with other sessions when excluding one', () => {
    const start = new Date('2025-01-10T10:00:00.000Z')
    // Exclude session 1, but add a session 3 that overlaps
    const sessionsWithThird = [
      ...sessions,
      makeSession({ id: '3', date: '2025-01-10T10:30:00.000Z', durationMinutes: 30 }),
    ]
    expect(isTimeSlotTaken(sessionsWithThird, start, 60, '1')?.id).toBe('3')
  })

  it('should return null for empty sessions array', () => {
    const start = new Date('2025-01-10T10:00:00.000Z')
    expect(isTimeSlotTaken([], start, 60)).toBeNull()
  })

  it('should detect overlap when new session fully contains existing', () => {
    const start = new Date('2025-01-10T09:00:00.000Z') // 09:00–12:00 contains 10:00–11:00
    expect(isTimeSlotTaken(sessions, start, 180)).toEqual(sessions[0])
  })

  it('should detect overlap when existing session fully contains new', () => {
    const start = new Date('2025-01-10T10:15:00.000Z') // 10:15–10:45 inside 10:00–11:00
    expect(isTimeSlotTaken(sessions, start, 30)).toEqual(sessions[0])
  })
})

describe('findSchedulingConflicts', () => {
  it('should return empty array when no conflicts', () => {
    const sessions = [
      makeSession({ id: '1', date: '2025-01-10T08:00:00.000Z', durationMinutes: 60 }),
      makeSession({ id: '2', date: '2025-01-10T10:00:00.000Z', durationMinutes: 60 }),
      makeSession({ id: '3', date: '2025-01-10T12:00:00.000Z', durationMinutes: 60 }),
    ]
    expect(findSchedulingConflicts(sessions)).toEqual([])
  })

  it('should detect a pair of overlapping sessions', () => {
    const sessions = [
      makeSession({ id: '1', date: '2025-01-10T10:00:00.000Z', durationMinutes: 60 }), // 10–11
      makeSession({ id: '2', date: '2025-01-10T10:30:00.000Z', durationMinutes: 60 }), // 10:30–11:30
    ]
    const conflicts = findSchedulingConflicts(sessions)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].map(s => s.id)).toEqual(['1', '2'])
  })

  it('should group three-way overlaps into a single group', () => {
    const sessions = [
      makeSession({ id: '1', date: '2025-01-10T10:00:00.000Z', durationMinutes: 60 }),
      makeSession({ id: '2', date: '2025-01-10T10:30:00.000Z', durationMinutes: 60 }),
      makeSession({ id: '3', date: '2025-01-10T10:45:00.000Z', durationMinutes: 60 }),
    ]
    const conflicts = findSchedulingConflicts(sessions)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].map(s => s.id)).toEqual(['1', '2', '3'])
  })

  it('should detect multiple independent conflict groups', () => {
    const sessions = [
      makeSession({ id: '1', date: '2025-01-10T08:00:00.000Z', durationMinutes: 60 }), // 8–9
      makeSession({ id: '2', date: '2025-01-10T08:30:00.000Z', durationMinutes: 60 }), // 8:30–9:30 → conflicts with 1
      makeSession({ id: '3', date: '2025-01-10T14:00:00.000Z', durationMinutes: 60 }), // 14–15
      makeSession({ id: '4', date: '2025-01-10T14:30:00.000Z', durationMinutes: 60 }), // 14:30–15:30 → conflicts with 3
    ]
    const conflicts = findSchedulingConflicts(sessions)
    expect(conflicts).toHaveLength(2)
    expect(conflicts[0].map(s => s.id)).toEqual(['1', '2'])
    expect(conflicts[1].map(s => s.id)).toEqual(['3', '4'])
  })

  it('should return empty array for empty sessions', () => {
    expect(findSchedulingConflicts([])).toEqual([])
  })

  it('should return empty array for single session', () => {
    const sessions = [makeSession({ id: '1', date: '2025-01-10T10:00:00.000Z', durationMinutes: 60 })]
    expect(findSchedulingConflicts(sessions)).toEqual([])
  })

  it('should not report adjacent (non-overlapping) sessions as conflicts', () => {
    const sessions = [
      makeSession({ id: '1', date: '2025-01-10T10:00:00.000Z', durationMinutes: 60 }), // 10–11
      makeSession({ id: '2', date: '2025-01-10T11:00:00.000Z', durationMinutes: 60 }), // 11–12
    ]
    expect(findSchedulingConflicts(sessions)).toEqual([])
  })

  it('should handle unsorted input correctly', () => {
    const sessions = [
      makeSession({ id: '2', date: '2025-01-10T10:30:00.000Z', durationMinutes: 60 }),
      makeSession({ id: '1', date: '2025-01-10T10:00:00.000Z', durationMinutes: 60 }),
    ]
    const conflicts = findSchedulingConflicts(sessions)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toHaveLength(2)
  })
})
