// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('./store', () => ({}))

import { createWorkoutSlice, type WorkoutSlice } from './workoutSlice'
import { type WorkoutPlan } from '../types'

const createTestStore = () => {
  let state: WorkoutSlice = {} as WorkoutSlice
  const set = (partial: Partial<WorkoutSlice> | ((s: WorkoutSlice) => Partial<WorkoutSlice>)) => {
    if (typeof partial === 'function') {
      state = { ...state, ...partial(state) }
    } else {
      state = { ...state, ...partial }
    }
  }
  const get = () => state
  state = createWorkoutSlice(set as any, get as any, {} as any)
  return { getState: () => state }
}

const makeWorkout = (id: string): WorkoutPlan => ({
  id,
  title: `Treino ${id}`,
  exercises: [{ name: 'Supino', sets: 4, reps: '8-12' }],
  tags: [],
  createdAt: '2025-01-01',
})

describe('workoutSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('should initialize with empty workouts array', () => {
    expect(store.getState().workouts).toEqual([])
  })

  it('_setWorkouts should replace entire array', () => {
    store.getState()._setWorkouts([makeWorkout('1'), makeWorkout('2')])
    expect(store.getState().workouts).toHaveLength(2)
  })

  it('_addWorkout should append', () => {
    store.getState()._addWorkout(makeWorkout('1'))
    expect(store.getState().workouts).toHaveLength(1)
  })

  it('_updateWorkout should replace matching by id', () => {
    store.getState()._setWorkouts([makeWorkout('1')])
    store.getState()._updateWorkout({ ...makeWorkout('1'), title: 'Updated' })
    expect(store.getState().workouts[0].title).toBe('Updated')
  })

  it('_removeWorkout should filter out by id', () => {
    store.getState()._setWorkouts([makeWorkout('1'), makeWorkout('2')])
    store.getState()._removeWorkout('1')
    expect(store.getState().workouts).toHaveLength(1)
    expect(store.getState().workouts[0].id).toBe('2')
  })
})
