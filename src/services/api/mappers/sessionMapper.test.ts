// @vitest-environment node
import { describe, it, expect } from 'vitest'

import { occurrenceId, parseOccurrenceId, seriesIdOf, toSession, toSessionCreateBody, toSessionUpdateBody, type SessionWire } from './sessionMapper'

const SERIES = '0b9c2f0e-6a52-4c0e-9d53-4f2a5d0f7c11'

const wire = (overrides: Partial<SessionWire> = {}): SessionWire => ({
  id: 'evt-1',
  date: '2026-10-05T13:00:00.000Z',
  durationMinutes: 60,
  type: 'In-Person',
  category: 'Workout',
  notes: null,
  status: 'SCHEDULED',
  completed: false,
  cancelled: false,
  clientId: 'client-1',
  userId: 'user-1',
  client: { name: 'Maria', avatar: null },
  workoutSheetId: null,
  workoutSegmentId: null,
  workout: null,
  timezone: 'America/Sao_Paulo',
  isVirtual: false,
  recurringEventId: null,
  recurrenceId: null,
  originalStartTime: null,
  exceptionId: null,
  rrule: null,
  ...overrides,
})

describe('toSession', () => {
  it('turns the nulls of a one-off session into absent values', () => {
    const session = toSession(wire())

    expect(session).toMatchObject({
      id: 'evt-1',
      clientId: 'client-1',
      status: 'SCHEDULED',
      completed: false,
      cancelled: false,
      isVirtual: false,
    })
    for (const key of ['notes', 'workoutSheetId', 'workoutSegmentId', 'workout', 'recurringEventId', 'recurrenceId', 'originalStartTime', 'exceptionId', 'rrule'] as const) {
      expect(session[key]).toBeUndefined()
    }
  })

  it('keeps the series data and the resolved workout of an occurrence', () => {
    const start = '2026-10-05T13:00:00.000Z'
    const session = toSession(
      wire({
        id: `${SERIES}_${start}`,
        isVirtual: true,
        recurringEventId: SERIES,
        recurrenceId: SERIES,
        originalStartTime: start,
        rrule: 'FREQ=WEEKLY;BYDAY=MO',
        workoutSheetId: 'sheet-1',
        workoutSegmentId: 'item-a',
        workout: { id: 'item-a', name: 'Peito', letter: 'A' },
      })
    )

    expect(session).toMatchObject({
      isVirtual: true,
      recurringEventId: SERIES,
      recurrenceId: SERIES,
      originalStartTime: start,
      rrule: 'FREQ=WEEKLY;BYDAY=MO',
      workoutSheetId: 'sheet-1',
      workoutSegmentId: 'item-a',
    })
    expect(session.workout).toEqual({ id: 'item-a', name: 'Peito', letter: 'A' })
  })
})

describe('toSessionCreateBody', () => {
  it('sends a one-off session with only the keys of the contract', () => {
    const body = toSessionCreateBody({
      clientId: 'client-1',
      date: '2026-10-05T13:00:00.000Z',
      durationMinutes: 60,
      type: 'In-Person',
      category: 'Workout',
      notes: '',
      workoutSheetId: '',
      linkedWorkoutId: 'old',
      recurrenceId: 'old',
    } as never)

    expect(body).toEqual({
      clientId: 'client-1',
      date: '2026-10-05T13:00:00.000Z',
      durationMinutes: 60,
      type: 'In-Person',
      category: 'Workout',
    })
  })

  it('sends a series as the same body plus rrule and timezone, starting at `date`', () => {
    const body = toSessionCreateBody({
      clientId: 'client-1',
      date: '2026-10-05T13:00:00.000Z',
      durationMinutes: 45,
      type: 'Online',
      category: 'Check-in',
      rrule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=12',
      timezone: 'America/Sao_Paulo',
      workoutSheetId: 'sheet-1',
      workoutSegmentId: 'item-a',
    })

    expect(body).toMatchObject({
      date: '2026-10-05T13:00:00.000Z',
      rrule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=12',
      timezone: 'America/Sao_Paulo',
      workoutSheetId: 'sheet-1',
      workoutSegmentId: 'item-a',
    })
    expect(body).not.toHaveProperty('dtstart')
  })
})

describe('toSessionUpdateBody', () => {
  it('drops the client and every read-only field: PATCH rejects unknown properties', () => {
    const body = toSessionUpdateBody({
      ...toSession(wire({ notes: 'ok' })),
      date: '2026-10-06T13:00:00.000Z',
    } as never)

    expect(body).toEqual({
      date: '2026-10-06T13:00:00.000Z',
      durationMinutes: 60,
      type: 'In-Person',
      category: 'Workout',
      notes: 'ok',
      completed: false,
      cancelled: false,
    })
  })

  it('sends null to unlink a workout and leaves the link out when it is not part of the update', () => {
    expect(toSessionUpdateBody({ notes: 'x' })).toEqual({ notes: 'x' })
    expect(toSessionUpdateBody({ workoutSheetId: null, workoutSegmentId: null })).toEqual({
      workoutSheetId: null,
      workoutSegmentId: null,
    })
    expect(toSessionUpdateBody({ workoutSheetId: 'sheet-1', workoutSegmentId: 'item-a' })).toEqual({
      workoutSheetId: 'sheet-1',
      workoutSegmentId: 'item-a',
    })
  })

  it('carries the exception fields: move, complete, cancel', () => {
    expect(toSessionUpdateBody({ date: '2026-10-07T10:00:00.000Z', completed: true })).toEqual({
      date: '2026-10-07T10:00:00.000Z',
      completed: true,
    })
    expect(toSessionUpdateBody({ cancelled: true })).toEqual({ cancelled: true })
  })
})

describe('occurrence ids (event exceptions)', () => {
  it('builds `<seriesId>_<ISO originalStartTime>`', () => {
    expect(occurrenceId(SERIES, '2026-10-05T13:00:00.000Z')).toBe(`${SERIES}_2026-10-05T13:00:00.000Z`)
    expect(occurrenceId(SERIES, new Date('2026-10-05T10:00:00-03:00'))).toBe(`${SERIES}_2026-10-05T13:00:00.000Z`)
  })

  it('parses an occurrence id back and rejects a plain UUID', () => {
    expect(parseOccurrenceId(`${SERIES}_2026-10-05T13:00:00.000Z`)).toEqual({
      seriesId: SERIES,
      originalStartTime: '2026-10-05T13:00:00.000Z',
    })
    expect(parseOccurrenceId(SERIES)).toBeNull()
    expect(parseOccurrenceId('abc_not-a-date')).toBeNull()
  })

  it('finds the series of an occurrence, of a stored exception and of nothing', () => {
    expect(seriesIdOf({ id: `${SERIES}_2026-10-05T13:00:00.000Z` })).toBe(SERIES)
    expect(seriesIdOf({ id: 'exception-uuid', recurringEventId: SERIES })).toBe(SERIES)
    expect(seriesIdOf({ id: 'exception-uuid', recurrenceId: SERIES })).toBe(SERIES)
    expect(seriesIdOf({ id: 'one-off-uuid' })).toBeUndefined()
  })
})
