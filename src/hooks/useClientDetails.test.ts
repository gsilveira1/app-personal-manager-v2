import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useClientDetails } from './useClientDetails'
import type { Evaluation, Session, WorkoutPlan } from '../types'

vi.mock('../utils/dateLocale', () => ({
  formatLocalized: (_date: Date, fmt: string) => `formatted-${fmt}`,
}))

const CLIENT_ID = 'client-1'
const OTHER_CLIENT = 'client-other'

function makeSession(overrides: Partial<Session> & { id: string; date: string }): Session {
  return {
    clientId: CLIENT_ID,
    durationMinutes: 60,
    type: 'In-Person',
    category: 'Workout',
    completed: false,
    ...overrides,
  }
}

function makeEvaluation(overrides: Partial<Evaluation> & { id: string; date: string }): Evaluation {
  return {
    clientId: CLIENT_ID,
    weight: 80,
    ...overrides,
  }
}

function makeWorkout(overrides: Partial<WorkoutPlan> & { id: string }): WorkoutPlan {
  return {
    clientId: CLIENT_ID,
    title: 'Workout A',
    exercises: [],
    tags: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('useClientDetails', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns empty arrays when clientId is undefined', () => {
    const { result } = renderHook(() =>
      useClientDetails(undefined, [], [], [], 'weight')
    )
    expect(result.current.clientSessions).toEqual([])
    expect(result.current.clientEvaluations).toEqual([])
    expect(result.current.clientWorkouts).toEqual([])
    expect(result.current.activePlans).toEqual([])
    expect(result.current.archivedPlans).toEqual([])
    expect(result.current.chartData).toEqual([])
  })

  it('returns empty arrays when no data matches clientId', () => {
    const sessions = [makeSession({ id: 's1', date: '2025-06-10T10:00:00.000Z', clientId: OTHER_CLIENT })]
    const evaluations = [makeEvaluation({ id: 'e1', date: '2025-06-10T10:00:00.000Z', clientId: OTHER_CLIENT })]
    const workouts = [makeWorkout({ id: 'w1', clientId: OTHER_CLIENT })]

    const { result } = renderHook(() =>
      useClientDetails(CLIENT_ID, sessions, evaluations, workouts, 'weight')
    )
    expect(result.current.clientSessions).toEqual([])
    expect(result.current.clientEvaluations).toEqual([])
    expect(result.current.clientWorkouts).toEqual([])
  })

  describe('clientSessions', () => {
    it('filters sessions by clientId and past dates only', () => {
      const sessions = [
        makeSession({ id: 's1', date: '2025-06-10T10:00:00.000Z', clientId: CLIENT_ID }),
        makeSession({ id: 's2', date: '2025-06-20T10:00:00.000Z', clientId: CLIENT_ID }), // future
        makeSession({ id: 's3', date: '2025-06-12T10:00:00.000Z', clientId: OTHER_CLIENT }), // wrong client
      ]

      const { result } = renderHook(() =>
        useClientDetails(CLIENT_ID, sessions, [], [], 'weight')
      )
      expect(result.current.clientSessions).toHaveLength(1)
      expect(result.current.clientSessions[0].id).toBe('s1')
    })

    it('sorts sessions descending by date', () => {
      const sessions = [
        makeSession({ id: 's1', date: '2025-06-01T10:00:00.000Z' }),
        makeSession({ id: 's2', date: '2025-06-14T10:00:00.000Z' }),
        makeSession({ id: 's3', date: '2025-06-10T10:00:00.000Z' }),
      ]

      const { result } = renderHook(() =>
        useClientDetails(CLIENT_ID, sessions, [], [], 'weight')
      )
      expect(result.current.clientSessions.map((s) => s.id)).toEqual(['s2', 's3', 's1'])
    })
  })

  describe('clientEvaluations', () => {
    it('filters evaluations by clientId and sorts descending by date', () => {
      const evaluations = [
        makeEvaluation({ id: 'e1', date: '2025-01-01T00:00:00.000Z', clientId: CLIENT_ID }),
        makeEvaluation({ id: 'e2', date: '2025-03-01T00:00:00.000Z', clientId: CLIENT_ID }),
        makeEvaluation({ id: 'e3', date: '2025-02-01T00:00:00.000Z', clientId: OTHER_CLIENT }),
      ]

      const { result } = renderHook(() =>
        useClientDetails(CLIENT_ID, [], evaluations, [], 'weight')
      )
      expect(result.current.clientEvaluations).toHaveLength(2)
      expect(result.current.clientEvaluations[0].id).toBe('e2')
      expect(result.current.clientEvaluations[1].id).toBe('e1')
    })
  })

  describe('clientWorkouts', () => {
    it('filters workouts by clientId and sorts descending by createdAt', () => {
      const workouts = [
        makeWorkout({ id: 'w1', createdAt: '2025-01-01T00:00:00.000Z' }),
        makeWorkout({ id: 'w2', createdAt: '2025-03-01T00:00:00.000Z' }),
        makeWorkout({ id: 'w3', clientId: OTHER_CLIENT, createdAt: '2025-02-01T00:00:00.000Z' }),
      ]

      const { result } = renderHook(() =>
        useClientDetails(CLIENT_ID, [], [], workouts, 'weight')
      )
      expect(result.current.clientWorkouts).toHaveLength(2)
      expect(result.current.clientWorkouts[0].id).toBe('w2')
      expect(result.current.clientWorkouts[1].id).toBe('w1')
    })
  })

  describe('activePlans and archivedPlans', () => {
    it('separates active vs archived plans', () => {
      const workouts = [
        makeWorkout({ id: 'w1', status: 'Active' }),
        makeWorkout({ id: 'w2', status: 'Archived' }),
        makeWorkout({ id: 'w3' }), // no status => treated as active
      ]

      const { result } = renderHook(() =>
        useClientDetails(CLIENT_ID, [], [], workouts, 'weight')
      )
      expect(result.current.activePlans.map((w) => w.id)).toEqual(
        expect.arrayContaining(['w1', 'w3'])
      )
      expect(result.current.activePlans).toHaveLength(2)
      expect(result.current.archivedPlans).toHaveLength(1)
      expect(result.current.archivedPlans[0].id).toBe('w2')
    })

    it('returns all as active when none are archived', () => {
      const workouts = [
        makeWorkout({ id: 'w1', status: 'Active' }),
        makeWorkout({ id: 'w2', status: 'Active' }),
      ]

      const { result } = renderHook(() =>
        useClientDetails(CLIENT_ID, [], [], workouts, 'weight')
      )
      expect(result.current.activePlans).toHaveLength(2)
      expect(result.current.archivedPlans).toHaveLength(0)
    })
  })

  describe('chartData', () => {
    it('extracts top-level metric values', () => {
      const evaluations = [
        makeEvaluation({ id: 'e1', date: '2025-01-01T00:00:00.000Z', weight: 80 }),
        makeEvaluation({ id: 'e2', date: '2025-02-01T00:00:00.000Z', weight: 78 }),
      ]

      const { result } = renderHook(() =>
        useClientDetails(CLIENT_ID, [], evaluations, [], 'weight')
      )
      // chartData is reversed from sorted-desc evaluations, so chronological order
      expect(result.current.chartData).toEqual([
        { date: 'formatted-MMM d', value: 80 },
        { date: 'formatted-MMM d', value: 78 },
      ])
    })

    it('extracts nested metric values like perimeters.waist', () => {
      const evaluations = [
        makeEvaluation({
          id: 'e1',
          date: '2025-01-01T00:00:00.000Z',
          perimeters: { waist: 85 },
        } as Partial<Evaluation> & { id: string; date: string }),
        makeEvaluation({
          id: 'e2',
          date: '2025-02-01T00:00:00.000Z',
          perimeters: { waist: 82 },
        } as Partial<Evaluation> & { id: string; date: string }),
      ]

      const { result } = renderHook(() =>
        useClientDetails(CLIENT_ID, [], evaluations, [], 'perimeters.waist')
      )
      expect(result.current.chartData).toEqual([
        { date: 'formatted-MMM d', value: 85 },
        { date: 'formatted-MMM d', value: 82 },
      ])
    })

    it('extracts nested metric values like skinfolds.triceps', () => {
      const evaluations = [
        makeEvaluation({
          id: 'e1',
          date: '2025-03-01T00:00:00.000Z',
          skinfolds: { triceps: 12 },
        } as Partial<Evaluation> & { id: string; date: string }),
      ]

      const { result } = renderHook(() =>
        useClientDetails(CLIENT_ID, [], evaluations, [], 'skinfolds.triceps')
      )
      expect(result.current.chartData).toEqual([
        { date: 'formatted-MMM d', value: 12 },
      ])
    })

    it('filters out evaluations where metric value is undefined', () => {
      const evaluations = [
        makeEvaluation({ id: 'e1', date: '2025-01-01T00:00:00.000Z', weight: 80 }),
        makeEvaluation({
          id: 'e2',
          date: '2025-02-01T00:00:00.000Z',
          weight: 78,
          perimeters: undefined,
        } as Partial<Evaluation> & { id: string; date: string }),
      ]

      const { result } = renderHook(() =>
        useClientDetails(CLIENT_ID, [], evaluations, [], 'perimeters.waist')
      )
      // Neither evaluation has perimeters.waist as a number, only e1 has no perimeters at all
      expect(result.current.chartData).toEqual([])
    })
  })

  describe('chartableMetrics', () => {
    it('returns the chartableMetrics constant with expected keys', () => {
      const { result } = renderHook(() =>
        useClientDetails(CLIENT_ID, [], [], [], 'weight')
      )
      const metrics = result.current.chartableMetrics
      expect(metrics).toHaveProperty('weight')
      expect(metrics).toHaveProperty('bodyFatPercentage')
      expect(metrics).toHaveProperty('leanMass')
      expect(metrics).toHaveProperty('perimeters.waist')
      expect(metrics).toHaveProperty('perimeters.hip')
      expect(metrics).toHaveProperty('perimeters.chest')
      expect(metrics).toHaveProperty('skinfolds.triceps')
      expect(metrics).toHaveProperty('skinfolds.abdominal')
      expect(metrics.weight).toEqual({ label: 'Weight', unit: 'kg' })
    })
  })
})
